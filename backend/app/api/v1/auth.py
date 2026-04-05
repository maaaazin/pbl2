from __future__ import annotations

from fastapi import APIRouter, HTTPException, status
from pydantic import BaseModel

from app.core.security import create_access_token, hash_password, verify_password
from app.db.repositories.user_repo import UserRepository
from app.models.user import TokenResponse, UserCreate, UserPublic

router = APIRouter()


class LoginBody(BaseModel):
    username: str
    password: str


@router.post("/register", response_model=TokenResponse)
async def register(payload: UserCreate):
    repo = UserRepository()
    if await repo.get_by_username(payload.username):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Username already taken",
        )
    user = await repo.create(payload, hash_password(payload.password))
    if not user.id:
        raise HTTPException(status_code=500, detail="Failed to create user")
    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user.id, username=user.username),
    )


@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginBody):
    repo = UserRepository()
    user = await repo.get_by_username(payload.username)
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
        )
    if not user.id:
        raise HTTPException(status_code=500, detail="Invalid user record")
    token = create_access_token(subject=user.id)
    return TokenResponse(
        access_token=token,
        user=UserPublic(id=user.id, username=user.username),
    )

from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.db.repositories.project_repo import ProjectRepository
from app.models.project import ProjectCreate, ProjectInDB
from app.models.user import UserPublic

router = APIRouter()


@router.get("/", response_model=list[ProjectInDB])
async def get_projects(user: Annotated[UserPublic, Depends(get_current_user)]):
    repo = ProjectRepository()
    return await repo.list_for_owner(user.id)


@router.post("/", response_model=ProjectInDB)
async def create_project(
    payload: ProjectCreate,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    repo = ProjectRepository()
    data = payload.model_dump()
    data["owner_id"] = user.id
    return await repo.create_one(ProjectCreate.model_validate(data))

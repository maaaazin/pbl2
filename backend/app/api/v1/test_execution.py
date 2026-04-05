from typing import Annotated

from fastapi import APIRouter, Depends

from app.api.dependencies import get_current_user
from app.models.user import UserPublic

router = APIRouter()


@router.post("/")
async def execute_test(_user: Annotated[UserPublic, Depends(get_current_user)]):
    return {
        "message": "Test execution started",
    }

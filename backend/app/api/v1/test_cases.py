from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException

from app.api.dependencies import get_current_user
from app.db.repositories.project_repo import ProjectRepository
from app.db.repositories.test_case_repo import TestCaseRepository
from app.models.test_case import TestCaseInDB
from app.models.user import UserPublic

router = APIRouter()


@router.get("/{project_name}", response_model=list[TestCaseInDB])
async def get_test_cases_for_project(
    project_name: str,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    project_repo = ProjectRepository()
    project = await project_repo.get_by_name_for_owner(project_name, user.id)

    if not project or not project.id:
        raise HTTPException(status_code=404, detail="Project not found")

    test_case_repo = TestCaseRepository(project.id)
    return await test_case_repo.list(project_id=project.id)

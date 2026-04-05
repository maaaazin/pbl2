from __future__ import annotations

from typing import Annotated, Literal

from fastapi import APIRouter, Depends
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.models.test_case import TestCaseInDB
from app.models.user import UserPublic
from app.services.test_generation_service import generate_test_cases_for_url

router = APIRouter()


class GenerateTestsRequest(BaseModel):
    url: str = Field(..., min_length=4)
    project_name: str = Field(..., min_length=1)
    generation_profile: Literal["quick", "standard", "detailed"] = "quick"
    user_prompt: str | None = None


@router.post("/", response_model=list[TestCaseInDB])
async def generate_tests(
    payload: GenerateTestsRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    """
    Generate tests for a webpage using the LLM and store them for this user's project.
    """
    created = await generate_test_cases_for_url(
        url=payload.url,
        project_name=payload.project_name,
        owner_id=user.id,
        generation_profile=payload.generation_profile,
        user_prompt=payload.user_prompt,
    )
    return created

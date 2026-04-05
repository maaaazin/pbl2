from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends, Header, HTTPException
from pydantic import BaseModel, Field

from app.api.dependencies import get_current_user
from app.models.user import UserPublic
from app.services.test_run_service import resume_test_with_inputs, run_single_test

router = APIRouter()


class ResumeTestBody(BaseModel):
    inputs: dict[str, str] = Field(default_factory=dict)


@router.post("/{project_name}/{test_id}/resume")
async def resume_test_endpoint(
    project_name: str,
    test_id: str,
    body: ResumeTestBody,
    user: Annotated[UserPublic, Depends(get_current_user)],
    x_aqua_route_jwt: Annotated[str | None, Header()] = None,
):
    """
    Merge supplied credentials/inputs into the test case and re-run Playwright.
    Values are passed to the script process as environment variables.
    """
    result = await resume_test_with_inputs(
        project_name,
        test_id,
        owner_id=user.id,
        inputs=body.inputs,
        route_jwt=x_aqua_route_jwt,
    )

    if result.get("error") == "project_not_found":
        raise HTTPException(status_code=404, detail="Project not found")
    if result.get("error") == "test_not_found":
        raise HTTPException(status_code=404, detail="Test case not found")

    return {
        "status": result["status"],
        "failure_reason": result.get("failure_reason"),
        "test_id": result.get("test_id"),
        "test_name": result.get("test_name"),
        "script_path": result.get("script_path"),
        "generation_mode": result.get("generation_mode"),
        "dom": result.get("dom"),
        "required_inputs": result.get("required_inputs"),
    }


@router.post("/{project_name}/{test_id}")
async def run_one_test(
    project_name: str,
    test_id: str,
    user: Annotated[UserPublic, Depends(get_current_user)],
    x_aqua_route_jwt: Annotated[str | None, Header()] = None,
):
    """
    Run a single test case for the given project.
    """
    result = await run_single_test(
        project_name,
        test_id,
        owner_id=user.id,
        route_jwt=x_aqua_route_jwt,
    )

    if result.get("error") == "project_not_found":
        raise HTTPException(status_code=404, detail="Project not found")
    if result.get("error") == "test_not_found":
        raise HTTPException(status_code=404, detail="Test case not found")

    return {
        "status": result["status"],
        "failure_reason": result.get("failure_reason"),
        "test_id": result.get("test_id"),
        "test_name": result.get("test_name"),
        "script_path": result.get("script_path"),
        "generation_mode": result.get("generation_mode"),
        "dom": result.get("dom"),
        "required_inputs": result.get("required_inputs"),
    }

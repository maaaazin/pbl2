from __future__ import annotations

from typing import Annotated

from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.api.dependencies import get_current_user
from app.models.user import UserPublic
from app.services.agent_service import run_agent_once

router = APIRouter()


class AgentRunRequest(BaseModel):
    project_name: str
    url: str


class AgentRunResponse(BaseModel):
    agent_decision: dict
    effect: dict | None = None


@router.post("/run-once", response_model=AgentRunResponse)
async def run_agent_endpoint(
    payload: AgentRunRequest,
    user: Annotated[UserPublic, Depends(get_current_user)],
):
    """
    Run a single agent decision step for a project and URL.
    """
    result = await run_agent_once(
        project_name=payload.project_name,
        url=payload.url,
        owner_id=user.id,
    )
    return AgentRunResponse(**result)

"""
Run a single test case by generating a Playwright script from its steps,
executing it, and setting status to passed/failed based on actual run result.
"""

from __future__ import annotations

import re
from datetime import datetime
from pathlib import Path
from typing import Any

from app.config import settings
from app.db.repositories.project_repo import ProjectRepository
from app.db.repositories.test_case_repo import TestCaseRepository
from app.services.playwright_generator import (
    can_generate_deterministically,
    generate_playwright_script,
    generate_playwright_script_deterministic,
)
from app.services.playwright_runner import run_playwright_script


def _safe_filename(s: str) -> str:
    return re.sub(r"[^\w\-.]", "_", s)[:80]


def _collect_supplied_env(test_case_metadata: dict[str, Any] | None) -> dict[str, str]:
    if not test_case_metadata:
        return {}
    raw = test_case_metadata.get("supplied_inputs")
    if not isinstance(raw, dict):
        return {}
    return {str(k): str(v) for k, v in raw.items() if v is not None}


async def run_single_test(
    project_name: str,
    test_id: str,
    *,
    owner_id: str,
    route_jwt: str | None = None,
) -> dict[str, Any]:
    """
    Run one test case: fetch it, generate a Playwright script from its steps,
    execute the script, then set status to passed/failed based on execution result.
    test_id can be metadata.test_id (e.g. TC001).
    """
    project_repo = ProjectRepository()
    project = await project_repo.get_by_name_for_owner(project_name, owner_id)
    if not project or not project.id:
        return {"error": "project_not_found", "status": None, "failure_reason": None}

    test_repo = TestCaseRepository(project.id)
    tc = await test_repo.get_by_project_and_test_id(
        project_id=project.id,
        test_id=test_id,
    )
    if not tc or not tc.id:
        return {"error": "test_not_found", "status": None, "failure_reason": None}

    await test_repo.update_status(tc.id, status="waiting", failure_reason=None)

    expected = (tc.metadata or {}).get("expected_result") or "Success"
    extra_env = _collect_supplied_env(tc.metadata)
    if route_jwt:
        extra_env = {**extra_env, "AQUA_ROUTE_JWT": route_jwt}

    # Generate Playwright script:
    try:
        if can_generate_deterministically(tc.steps):
            script = generate_playwright_script_deterministic(
                test_name=tc.name,
                url=tc.url,
                description=tc.description or "",
                steps=tc.steps,
                expected_result=expected,
            )
            generation_mode = "deterministic"
        else:
            script = await generate_playwright_script(
                test_name=tc.name,
                url=tc.url,
                description=tc.description or "",
                steps=tc.steps,
                expected_result=expected,
            )
            generation_mode = "llm"
    except Exception as e:
        await test_repo.update_status(
            tc.id,
            status="failed",
            failure_reason=f"Script generation failed: {e!s}",
        )
        return {
            "status": "failed",
            "failure_reason": f"Script generation failed: {e!s}",
            "test_id": tc.id,
            "test_name": tc.name,
            "script_path": None,
            "generation_mode": None,
            "dom": None,
        }

    if not script or not script.strip():
        await test_repo.update_status(
            tc.id,
            status="failed",
            failure_reason="LLM did not produce a valid Playwright script.",
        )
        return {
            "status": "failed",
            "failure_reason": "LLM did not produce a valid Playwright script.",
            "test_id": tc.id,
            "test_name": tc.name,
            "script_path": None,
            "generation_mode": None,
            "dom": None,
        }

    script_path: str | None = None
    if settings.PLAYWRIGHT_SCRIPT_OUTPUT_DIR:
        out_dir = Path(settings.PLAYWRIGHT_SCRIPT_OUTPUT_DIR)
        out_dir.mkdir(parents=True, exist_ok=True)
        ts = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        safe_id = _safe_filename(tc.id or test_id)
        fname = f"{_safe_filename(project_name)}_{safe_id}_{ts}.py"
        path = out_dir / fname
        path.write_text(script, encoding="utf-8")
        script_path = str(path.resolve())

    artifact_subdir = f"{_safe_filename(project_name)}_{_safe_filename(tc.id or test_id)}"
    result = await run_playwright_script(
        script,
        timeout_seconds=60.0,
        artifact_subdir=artifact_subdir,
        extra_env=extra_env if extra_env else None,
    )

    artifacts = result.get("artifacts") or {}
    required_inputs = None
    if isinstance(artifacts, dict):
        required_inputs = artifacts.get("required_inputs")

    if result.get("exit_code") == 2 or required_inputs:
        status = "waiting"
        failure_reason = None
        await test_repo.update_status(tc.id, status=status, failure_reason=None)
    elif result["success"]:
        status = "passed"
        failure_reason = None
    else:
        status = "failed"
        failure_reason = result.get("failure_reason") or "Playwright run failed"

    if status != "waiting":
        await test_repo.update_status(tc.id, status=status, failure_reason=failure_reason)

    dom_info = None
    if isinstance(artifacts, dict) and (
        "dom_hash_before" in artifacts or "dom_hash_after" in artifacts
    ):
        dom_info = {
            "dom_hash_before": artifacts.get("dom_hash_before"),
            "dom_hash_after": artifacts.get("dom_hash_after"),
            "dom_changed": artifacts.get("dom_changed"),
            "artifact_dir": artifacts.get("artifact_dir"),
        }

    return {
        "status": status,
        "failure_reason": failure_reason,
        "test_id": tc.id,
        "test_name": tc.name,
        "script_path": script_path,
        "generation_mode": generation_mode,
        "dom": dom_info,
        "required_inputs": required_inputs,
    }


async def resume_test_with_inputs(
    project_name: str,
    test_id: str,
    *,
    owner_id: str,
    inputs: dict[str, str],
    route_jwt: str | None = None,
) -> dict[str, Any]:
    project_repo = ProjectRepository()
    project = await project_repo.get_by_name_for_owner(project_name, owner_id)
    if not project or not project.id:
        return {"error": "project_not_found", "status": None, "failure_reason": None}

    test_repo = TestCaseRepository(project.id)
    tc = await test_repo.get_by_project_and_test_id(
        project_id=project.id,
        test_id=test_id,
    )
    if not tc or not tc.id:
        return {"error": "test_not_found", "status": None, "failure_reason": None}

    await test_repo.merge_supplied_inputs(tc.id, inputs)
    return await run_single_test(
        project_name,
        test_id,
        owner_id=owner_id,
        route_jwt=route_jwt,
    )

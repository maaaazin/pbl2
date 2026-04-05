from __future__ import annotations

import contextlib
from datetime import datetime
from typing import Any

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.common import to_object_id
from app.models.test_case import TestCaseCreate, TestCaseInDB


def _collection_name_for_project(project_id: str) -> str:
    safe = "".join(c if c.isalnum() else "_" for c in project_id)
    return f"test_cases_{safe}"


class TestCaseRepository:
    """Test cases are stored per Mongo project id to avoid cross-user collisions."""

    def __init__(self, project_id: str):
        if not project_id:
            raise ValueError("project_id is required")
        self.project_id = project_id
        self.collection_name = _collection_name_for_project(project_id)

    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB is not connected")
        return db[self.collection_name]

    async def create_one(
        self,
        test_case: TestCaseCreate,
        *,
        project_id: str | ObjectId | None = None,
    ) -> TestCaseInDB:
        now = datetime.utcnow()
        doc: dict[str, Any] = test_case.model_dump()
        pid = project_id if project_id is not None else self.project_id
        doc["project_id"] = to_object_id(pid)
        doc["created_at"] = now
        doc["updated_at"] = now
        doc["status"] = "draft"
        res = await self.collection.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        if "project_id" in doc and isinstance(doc["project_id"], ObjectId):
            doc["project_id"] = str(doc["project_id"])
        return TestCaseInDB.model_validate(doc)

    async def create_many(
        self,
        test_cases: list[TestCaseCreate],
        *,
        project_id: str | ObjectId | None = None,
    ) -> list[TestCaseInDB]:
        if not test_cases:
            return []
        now = datetime.utcnow()
        pid = project_id if project_id is not None else self.project_id
        oid = to_object_id(pid)
        docs: list[dict[str, Any]] = []
        for tc in test_cases:
            doc: dict[str, Any] = tc.model_dump()
            doc["project_id"] = oid
            doc["created_at"] = now
            doc["updated_at"] = now
            doc["status"] = "draft"
            docs.append(doc)

        res = await self.collection.insert_many(docs)
        for doc, _id in zip(docs, res.inserted_ids, strict=False):
            doc["_id"] = str(_id)
            if "project_id" in doc and isinstance(doc["project_id"], ObjectId):
                doc["project_id"] = str(doc["project_id"])
        return [TestCaseInDB.model_validate(doc) for doc in docs]

    async def list(
        self,
        *,
        project_id: str | ObjectId | None = None,
        url: str | None = None,
        limit: int = 500,
        skip: int = 0,
    ) -> list[TestCaseInDB]:
        query: dict[str, Any] = {}
        pid = project_id if project_id is not None else self.project_id
        query["project_id"] = to_object_id(pid)
        if url is not None:
            query["url"] = url

        cursor = (
            self.collection.find(query)
            .sort("created_at", -1)
            .skip(max(skip, 0))
            .limit(min(max(limit, 1), 1000))
        )
        docs = await cursor.to_list(length=None)
        for doc in docs:
            if "_id" in doc and isinstance(doc["_id"], ObjectId):
                doc["_id"] = str(doc["_id"])
            if "project_id" in doc and isinstance(doc.get("project_id"), ObjectId):
                doc["project_id"] = str(doc["project_id"])
        return [TestCaseInDB.model_validate(doc) for doc in docs]

    async def get_by_id(self, test_case_id: str | ObjectId) -> TestCaseInDB | None:
        doc = await self.collection.find_one({"_id": to_object_id(test_case_id)})
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        if "project_id" in doc and isinstance(doc.get("project_id"), ObjectId):
            doc["project_id"] = str(doc["project_id"])
        return TestCaseInDB.model_validate(doc)

    async def get_by_project_and_test_id(
        self,
        *,
        project_id: str | ObjectId,
        test_id: str,
    ) -> TestCaseInDB | None:
        pid = to_object_id(project_id)

        query: dict[str, Any] = {"project_id": pid}
        ors: list[dict[str, Any]] = [{"metadata.test_id": test_id}]

        with contextlib.suppress(Exception):
            ors.append({"_id": to_object_id(test_id)})

        query["$or"] = ors
        doc = await self.collection.find_one(query)
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        if "project_id" in doc and isinstance(doc.get("project_id"), ObjectId):
            doc["project_id"] = str(doc["project_id"])
        return TestCaseInDB.model_validate(doc)

    async def update_status(
        self,
        test_case_id: str | ObjectId,
        *,
        status: str,
        failure_reason: str | None,
    ) -> None:
        now = datetime.utcnow()
        await self.collection.update_one(
            {"_id": to_object_id(test_case_id)},
            {
                "$set": {
                    "status": status,
                    "failure_reason": failure_reason,
                    "updated_at": now,
                }
            },
        )

    async def merge_supplied_inputs(
        self,
        test_case_id: str | ObjectId,
        inputs: dict[str, str],
    ) -> None:
        doc = await self.collection.find_one({"_id": to_object_id(test_case_id)})
        if not doc:
            return
        meta = doc.get("metadata") or {}
        if not isinstance(meta, dict):
            meta = {}
        prev = meta.get("supplied_inputs") or {}
        if not isinstance(prev, dict):
            prev = {}
        merged = {**{str(k): str(v) for k, v in prev.items()}, **inputs}
        meta["supplied_inputs"] = merged
        now = datetime.utcnow()
        await self.collection.update_one(
            {"_id": to_object_id(test_case_id)},
            {"$set": {"metadata": meta, "updated_at": now}},
        )

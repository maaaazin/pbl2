from __future__ import annotations

from datetime import datetime
from typing import Any

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.common import to_object_id
from app.models.project import ProjectCreate, ProjectInDB


class ProjectRepository:
    collection_name = "projects"

    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB is not connected")
        return db[self.collection_name]

    async def create_one(self, project: ProjectCreate) -> ProjectInDB:
        now = datetime.utcnow()
        doc: dict[str, Any] = project.model_dump()
        if doc.get("owner_id"):
            doc["owner_id"] = to_object_id(doc["owner_id"])
        doc["created_at"] = now
        doc["updated_at"] = now
        res = await self.collection.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        if "owner_id" in doc and isinstance(doc["owner_id"], ObjectId):
            doc["owner_id"] = str(doc["owner_id"])
        return ProjectInDB.model_validate(doc)

    async def get_by_id(self, project_id: str | ObjectId) -> ProjectInDB | None:
        query = {"_id": to_object_id(project_id)}
        doc = await self.collection.find_one(query)
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        if "owner_id" in doc and isinstance(doc.get("owner_id"), ObjectId):
            doc["owner_id"] = str(doc["owner_id"])
        return ProjectInDB.model_validate(doc)

    async def get_by_name_for_owner(
        self,
        name: str,
        owner_id: str,
    ) -> ProjectInDB | None:
        oid = to_object_id(owner_id)
        doc = await self.collection.find_one({"name": name, "owner_id": oid})
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        if "owner_id" in doc and isinstance(doc.get("owner_id"), ObjectId):
            doc["owner_id"] = str(doc["owner_id"])
        return ProjectInDB.model_validate(doc)

    async def get_or_create_for_owner(
        self,
        name: str,
        owner_id: str,
        *,
        description: str | None = None,
        url: str | None = None,
    ) -> ProjectInDB:
        existing = await self.get_by_name_for_owner(name, owner_id)
        if existing:
            if url and not existing.url:
                await self.collection.update_one(
                    {"_id": to_object_id(existing.id)},
                    {"$set": {"url": url, "updated_at": datetime.utcnow()}},
                )
                existing.url = url
            return existing
        project = ProjectCreate(
            name=name,
            description=description,
            url=url,
            owner_id=owner_id,
        )
        return await self.create_one(project)

    async def list_for_owner(self, owner_id: str) -> list[ProjectInDB]:
        oid = to_object_id(owner_id)
        cursor = self.collection.find({"owner_id": oid}).sort("created_at", -1)
        docs = await cursor.to_list(length=None)
        for doc in docs:
            if "_id" in doc and isinstance(doc["_id"], ObjectId):
                doc["_id"] = str(doc["_id"])
            if "owner_id" in doc and isinstance(doc.get("owner_id"), ObjectId):
                doc["owner_id"] = str(doc["owner_id"])
        return [ProjectInDB.model_validate(doc) for doc in docs]

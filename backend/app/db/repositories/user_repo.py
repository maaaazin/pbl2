from __future__ import annotations

from datetime import datetime

from bson import ObjectId

from app.db.mongodb import get_database
from app.models.common import to_object_id
from app.models.user import UserCreate, UserInDB


class UserRepository:
    collection_name = "users"

    @property
    def collection(self):
        db = get_database()
        if db is None:
            raise RuntimeError("MongoDB is not connected")
        return db[self.collection_name]

    async def create(self, user: UserCreate, hashed_password: str) -> UserInDB:
        now = datetime.utcnow()
        doc = {
            "username": user.username.strip().lower(),
            "hashed_password": hashed_password,
            "created_at": now,
        }
        res = await self.collection.insert_one(doc)
        doc["_id"] = str(res.inserted_id)
        return UserInDB.model_validate(doc)

    async def get_by_username(self, username: str) -> UserInDB | None:
        doc = await self.collection.find_one({"username": username.strip().lower()})
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        return UserInDB.model_validate(doc)

    async def get_by_id(self, user_id: str) -> UserInDB | None:
        doc = await self.collection.find_one({"_id": to_object_id(user_id)})
        if not doc:
            return None
        if "_id" in doc and isinstance(doc["_id"], ObjectId):
            doc["_id"] = str(doc["_id"])
        return UserInDB.model_validate(doc)

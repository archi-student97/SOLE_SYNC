import os

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


def _ensure_connection() -> None:
    global client, database
    if client is not None and database is not None:
        return
    settings = get_settings()
    uri = settings.mongodb_uri.strip()
    if (uri.startswith("mongodb://localhost") or uri.startswith("mongodb://127.0.0.1")) and (
        str(os.environ.get("VERCEL", "")).lower() in {"1", "true"}
    ):
        raise RuntimeError(
            "MONGODB_URI is not configured for production. Set a cloud MongoDB URI in Vercel env vars."
        )
    client = AsyncIOMotorClient(uri, serverSelectionTimeoutMS=8000)
    database = client[settings.mongodb_db_name]


async def connect_to_mongo() -> None:
    _ensure_connection()


async def close_mongo_connection() -> None:
    global client, database
    if client:
        client.close()
    client = None
    database = None


def get_db() -> AsyncIOMotorDatabase:
    _ensure_connection()
    if database is None:
        raise RuntimeError("Mongo database is not initialized.")
    return database

from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


def _ensure_connection() -> None:
    global client, database
    if client is not None and database is not None:
        return
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
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

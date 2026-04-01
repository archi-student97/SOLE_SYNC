from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

from app.core.config import get_settings

client: AsyncIOMotorClient | None = None
database: AsyncIOMotorDatabase | None = None


async def connect_to_mongo() -> None:
    global client, database
    settings = get_settings()
    client = AsyncIOMotorClient(settings.mongodb_uri)
    database = client[settings.mongodb_db_name]


async def close_mongo_connection() -> None:
    global client
    if client:
        client.close()


def get_db() -> AsyncIOMotorDatabase:
    if database is None:
        raise RuntimeError("Mongo database is not initialized.")
    return database

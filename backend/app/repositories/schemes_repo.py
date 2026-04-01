from datetime import datetime, timezone

from app.db.mongodb import get_db


async def list_schemes() -> list[dict]:
    db = get_db()
    return await db.schemes.find({}, {"_id": 0}).sort("createdAt", -1).to_list(length=None)


async def create_scheme(scheme_data: dict) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    new_scheme = {
        **scheme_data,
        "id": int(now.timestamp() * 1000),
        "createdAt": now,
    }
    await db.schemes.insert_one(new_scheme)
    return new_scheme


async def delete_scheme(scheme_id: int) -> bool:
    db = get_db()
    result = await db.schemes.delete_one({"id": scheme_id})
    return result.deleted_count > 0

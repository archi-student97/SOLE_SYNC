from app.db.mongodb import get_db


def _normalize_loyalty(data: dict | None) -> dict:
    if not data:
        return {"distributor": 0, "retailer": 0}
    return {
        "distributor": int(data.get("distributor", 0)),
        "retailer": int(data.get("retailer", 0)),
    }


async def get_loyalty() -> dict:
    db = get_db()
    data = await db.loyalty.find_one({"id": 1}, {"_id": 0, "id": 0})
    if not data:
        data = await db.loyalty.find_one({}, {"_id": 0, "id": 0})
    return _normalize_loyalty(data)


async def update_loyalty(role: str, points: int) -> dict:
    db = get_db()
    await db.loyalty.update_one(
        {"id": 1},
        {"$setOnInsert": {"id": 1}, "$inc": {role: points}},
        upsert=True,
    )
    return await get_loyalty()

from app.db.mongodb import get_db


async def get_loyalty() -> dict:
    db = get_db()
    data = await db.loyalty.find_one({"id": 1}, {"_id": 0, "id": 0})
    return data or {"distributor": 0, "retailer": 0}


async def update_loyalty(role: str, points: int) -> dict:
    db = get_db()
    await db.loyalty.update_one(
        {"id": 1},
        {"$inc": {role: points}},
        upsert=True,
    )
    return await get_loyalty()

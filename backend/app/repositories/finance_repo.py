from app.db.mongodb import get_db


async def get_finance() -> dict:
    db = get_db()
    data = await db.finance.find_one({"id": 1}, {"_id": 0, "id": 0})
    return data or {"revenue": 0, "expenses": 0, "transactions": []}

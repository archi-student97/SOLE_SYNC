from app.db.mongodb import get_db
from app.models.defaults import (
    DEFAULT_FINANCE,
    DEFAULT_LOYALTY,
    DEFAULT_SCHEMES,
    DEFAULT_STOCK,
    DEFAULT_USERS,
)


async def seed_database_if_needed() -> None:
    db = get_db()

    # Always ensure the default management admin exists with known credentials.
    # Live tests and local recovery flows depend on admin@sole.com / admin123
    # being valid after calling /system/init.
    default_admin = DEFAULT_USERS[0]
    await db.users.update_one(
        {"email": default_admin["email"]},
        {"$set": default_admin},
        upsert=True,
    )

    if await db.stock.count_documents({}) == 0:
        await db.stock.insert_many(DEFAULT_STOCK)

    await db.orders.count_documents({})

    if await db.schemes.count_documents({}) == 0 and DEFAULT_SCHEMES:
        await db.schemes.insert_many(DEFAULT_SCHEMES)

    if await db.loyalty.count_documents({}) == 0:
        await db.loyalty.insert_one({"id": 1, **DEFAULT_LOYALTY})

    if await db.finance.count_documents({}) == 0:
        await db.finance.insert_one({"id": 1, **DEFAULT_FINANCE})

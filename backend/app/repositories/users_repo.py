from app.db.mongodb import get_db


async def get_all_users() -> list[dict]:
    db = get_db()
    return await db.users.find({}, {"_id": 0}).to_list(length=None)


async def get_user_by_email(email: str) -> dict | None:
    db = get_db()
    return await db.users.find_one({"email": email}, {"_id": 0})


async def get_user_by_id(user_id: int) -> dict | None:
    db = get_db()
    return await db.users.find_one({"id": user_id}, {"_id": 0})


async def create_user(user_data: dict) -> dict:
    db = get_db()
    last_user = await db.users.find_one({}, sort=[("id", -1)], projection={"id": 1, "_id": 0})
    next_id = (last_user["id"] + 1) if last_user else 1
    new_user = {**user_data, "id": next_id}
    await db.users.insert_one(new_user)
    return {k: v for k, v in new_user.items() if k != "password"}


async def update_user_password(email: str, password_hash: str) -> bool:
    db = get_db()
    result = await db.users.update_one({"email": email}, {"$set": {"password": password_hash}})
    return result.modified_count > 0


async def get_users_for_management() -> list[dict]:
    db = get_db()
    users = await db.users.find({"role": {"$in": ["distributor", "retailer"]}}, {"_id": 0}).sort("id", 1).to_list(length=None)
    return [
        {
            "id": u["id"],
            "name": u["name"],
            "role": u["role"],
            "email": u["email"],
            "password": u.get("plainPassword", "******"),
        }
        for u in users
    ]


async def delete_user_by_id(user_id: int) -> bool:
    db = get_db()
    result = await db.users.delete_one({"id": user_id, "role": {"$in": ["distributor", "retailer"]}})
    return result.deleted_count > 0

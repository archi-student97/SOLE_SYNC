from app.db.mongodb import get_db


def _normalize_user(user: dict | None) -> dict | None:
    if not user:
        return None
    normalized = dict(user)
    normalized["total_purchase"] = float(normalized.get("total_purchase", 0.0))
    normalized["loyalty_points"] = int(normalized.get("loyalty_points", 0))
    return normalized


async def get_all_users() -> list[dict]:
    db = get_db()
    users = await db.users.find({}, {"_id": 0}).to_list(length=None)
    return [_normalize_user(user) for user in users]


async def get_user_by_email(email: str) -> dict | None:
    db = get_db()
    user = await db.users.find_one({"email": email}, {"_id": 0})
    return _normalize_user(user)


async def get_user_by_id(user_id: int) -> dict | None:
    db = get_db()
    user = await db.users.find_one({"id": user_id}, {"_id": 0})
    return _normalize_user(user)


async def create_user(user_data: dict) -> dict:
    db = get_db()
    # Allocate user IDs from a monotonic sequence so deleted-user IDs are never reused.
    # Reuse caused new users to inherit old orders/finance/loyalty tied to the same userId.
    def _to_int(value, default=0):
        try:
            return int(value)
        except (TypeError, ValueError):
            return default

    last_user = await db.users.find_one({}, sort=[("id", -1)], projection={"id": 1, "_id": 0})
    last_order_with_user = await db.orders.find_one(
        {"userId": {"$exists": True, "$ne": None}},
        sort=[("userId", -1)],
        projection={"userId": 1, "_id": 0},
    )
    max_known_user_id = max(
        _to_int(last_user.get("id") if last_user else None, 0),
        _to_int(last_order_with_user.get("userId") if last_order_with_user else None, 0),
    )

    seq_doc = await db.counters.find_one({"_id": "user_id_seq"}, {"_id": 0, "value": 1})
    seq_value = _to_int(seq_doc.get("value") if seq_doc else None, 0)
    next_id = max(max_known_user_id, seq_value) + 1
    await db.counters.update_one(
        {"_id": "user_id_seq"},
        {"$set": {"value": next_id}},
        upsert=True,
    )
    new_user = {
        **user_data,
        "id": next_id,
        "total_purchase": float(user_data.get("total_purchase", 0.0)),
        "loyalty_points": int(user_data.get("loyalty_points", 0)),
    }
    await db.users.insert_one(new_user)
    return {k: v for k, v in new_user.items() if k != "password"}


async def update_user_password(email: str, password_hash: str) -> bool:
    db = get_db()
    result = await db.users.update_one({"email": email}, {"$set": {"password": password_hash}})
    return result.modified_count > 0


async def set_plain_password_for_user(user_id: int, plain_password: str) -> bool:
    db = get_db()
    result = await db.users.update_one({"id": user_id}, {"$set": {"plainPassword": plain_password}})
    return result.modified_count > 0


async def get_users_for_management() -> list[dict]:
    db = get_db()
    users = await db.users.find({"role": {"$in": ["distributor", "retailer"]}}, {"_id": 0}).sort("id", 1).to_list(length=None)

    def _to_int(value):
        try:
            return int(value)
        except (TypeError, ValueError):
            return None

    distributor_name_by_id = {
        _to_int(u.get("id")): u.get("name")
        for u in users
        if u.get("role") == "distributor" and _to_int(u.get("id")) is not None
    }
    return [
        {
            "id": u["id"],
            "name": u["name"],
            "role": u["role"],
            "email": u["email"],
            "password": u.get("plainPassword") or "Reset/Login once to view",
            "distributorId": u.get("distributorId"),
            "distributorName": (
                distributor_name_by_id.get(_to_int(u.get("distributorId")))
                if u.get("role") == "retailer"
                else None
            ),
            "total_purchase": float(u.get("total_purchase", 0.0)),
            "loyalty_points": int(u.get("loyalty_points", 0)),
        }
        for u in users
    ]


async def get_distributors_for_management() -> list[dict]:
    db = get_db()
    users = await (
        db.users.find({"role": "distributor"}, {"_id": 0, "id": 1, "name": 1, "email": 1}).sort("id", 1).to_list(length=None)
    )
    return users


async def get_retailers_for_distributor(distributor_id: int) -> list[dict]:
    db = get_db()
    users = await (
        db.users.find(
            {"role": "retailer", "distributorId": int(distributor_id)},
            {"_id": 0, "id": 1, "name": 1, "email": 1, "distributorId": 1},
        )
        .sort("id", 1)
        .to_list(length=None)
    )
    return users


async def delete_user_by_id(user_id: int) -> bool:
    db = get_db()
    result = await db.users.delete_one({"id": user_id, "role": {"$in": ["distributor", "retailer"]}})
    return result.deleted_count > 0


async def add_loyalty_purchase(user_id: int, amount: float) -> dict | None:
    db = get_db()
    if amount <= 0:
        return await get_user_by_id(user_id)

    points = int(amount // 10)
    await db.users.update_one(
        {"id": user_id},
        {"$inc": {"total_purchase": float(amount), "loyalty_points": points}},
    )
    return await get_user_by_id(user_id)


async def adjust_loyalty_points(user_id: int, points: int) -> dict | None:
    db = get_db()
    await db.users.update_one({"id": user_id}, {"$inc": {"loyalty_points": int(points)}})
    user = await get_user_by_id(user_id)
    if not user:
        return None
    if user["loyalty_points"] < 0:
        await db.users.update_one({"id": user_id}, {"$set": {"loyalty_points": 0}})
        return await get_user_by_id(user_id)
    return user


async def set_user_loyalty_totals(user_id: int, total_purchase: float, loyalty_points: int) -> dict | None:
    db = get_db()
    await db.users.update_one(
        {"id": user_id},
        {"$set": {"total_purchase": float(total_purchase), "loyalty_points": int(loyalty_points)}},
    )
    return await get_user_by_id(user_id)

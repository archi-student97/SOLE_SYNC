from datetime import datetime, timezone

from app.db.mongodb import get_db


def _normalize_order(doc: dict | None) -> dict | None:
    if not doc:
        return None

    # Support legacy snake_case documents and current camelCase documents.
    normalized = {
        "id": doc.get("id"),
        "itemName": doc.get("itemName", doc.get("item_name")),
        "quantity": doc.get("quantity"),
        "totalPrice": doc.get("totalPrice", doc.get("total_price")),
        "unitPrice": doc.get("unitPrice", doc.get("unit_price")),
        "fromRole": doc.get("fromRole", doc.get("from_role")),
        "toRole": doc.get("toRole", doc.get("to_role")),
        "userId": doc.get("userId", doc.get("user_id")),
        "status": doc.get("status", "pending"),
        "linkedOrderId": doc.get("linkedOrderId", doc.get("linked_order_id")),
        "createdAt": doc.get("createdAt", doc.get("created_at")),
        "updatedAt": doc.get("updatedAt", doc.get("updated_at")),
        "isDeleted": doc.get("isDeleted", False),
        "loyaltyCredited": doc.get("loyaltyCredited", False),
    }
    return normalized


async def list_orders() -> list[dict]:
    db = get_db()
    docs = await db.orders.find(
        {"$or": [{"isDeleted": {"$exists": False}}, {"isDeleted": False}]},
        {"_id": 0},
    ).sort("id", -1).to_list(length=None)
    return [_normalize_order(doc) for doc in docs]


async def get_order(order_id: int) -> dict | None:
    db = get_db()
    doc = await db.orders.find_one(
        {"id": order_id, "$or": [{"isDeleted": {"$exists": False}}, {"isDeleted": False}]},
        {"_id": 0},
    )
    return _normalize_order(doc)


async def create_order(order_data: dict) -> dict:
    db = get_db()
    now = datetime.now(timezone.utc)
    new_order = {
        **order_data,
        "id": int(now.timestamp() * 1000),
        "createdAt": now,
        "updatedAt": None,
        "isDeleted": False,
        "loyaltyCredited": False,
    }
    await db.orders.insert_one(new_order)
    return _normalize_order(new_order)


async def update_order_status(order_id: int, status: str) -> dict | None:
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"status": status, "updatedAt": now}},
    )
    return await get_order(order_id)


async def delete_order(order_id: int) -> bool:
    db = get_db()
    now = datetime.now(timezone.utc)
    result = await db.orders.update_one(
        {"id": order_id, "$or": [{"isDeleted": {"$exists": False}}, {"isDeleted": False}]},
        {"$set": {"isDeleted": True, "updatedAt": now}},
    )
    return result.modified_count > 0


async def mark_order_loyalty_credited(order_id: int) -> dict | None:
    db = get_db()
    now = datetime.now(timezone.utc)
    await db.orders.update_one(
        {"id": order_id},
        {"$set": {"loyaltyCredited": True, "updatedAt": now}},
    )
    return await get_order(order_id)


async def summarize_completed_orders_for_user(user_id: int, role: str | None = None) -> dict:
    db = get_db()
    docs = await db.orders.find(
        {
            "userId": user_id,
            "status": {"$in": ["approved", "delivered", "completed"]},
            "$or": [{"isDeleted": {"$exists": False}}, {"isDeleted": False}],
        },
        {"_id": 0, "totalPrice": 1},
    ).to_list(length=None)

    total_purchase = 0.0
    for doc in docs:
        total_purchase += float(doc.get("totalPrice", 0.0) or 0.0)
    loyalty_points = int(total_purchase // 10)
    return {"total_purchase": total_purchase, "loyalty_points": loyalty_points}

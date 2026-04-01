from app.db.mongodb import get_db

ROLE_FIELD_MAP = {
    "management": "managementQty",
    "distributor": "distributorQty",
    "retailer": "retailerQty",
}


def _normalize_legacy_stock(doc: dict) -> dict:
    # Backward compatibility for older schema with only `quantity`.
    if "quantity" in doc:
        legacy_qty = int(doc.get("quantity", 0))
        if "managementQty" not in doc:
            doc["managementQty"] = legacy_qty
        if "distributorQty" not in doc:
            doc["distributorQty"] = legacy_qty
        if "retailerQty" not in doc:
            doc["retailerQty"] = 0
    return doc


def _to_role_view(doc: dict | None, role: str = "management") -> dict | None:
    if not doc:
        return None
    normalized = _normalize_legacy_stock(dict(doc))
    field = ROLE_FIELD_MAP.get(role, "managementQty")
    return {
        "id": normalized.get("id"),
        "name": normalized.get("name"),
        "price": normalized.get("price"),
        "quantity": int(normalized.get(field, 0)),
    }


async def list_stock(role: str = "management") -> list[dict]:
    db = get_db()
    docs = await db.stock.find({}, {"_id": 0}).sort("id", 1).to_list(length=None)
    return [_to_role_view(doc, role) for doc in docs]


async def get_stock_by_id(stock_id: int, role: str = "management") -> dict | None:
    db = get_db()
    doc = await db.stock.find_one({"id": stock_id}, {"_id": 0})
    return _to_role_view(doc, role)


async def get_stock_by_name(item_name: str, role: str = "management") -> dict | None:
    db = get_db()
    doc = await db.stock.find_one({"name": item_name}, {"_id": 0})
    return _to_role_view(doc, role)


async def get_raw_stock_by_name(item_name: str) -> dict | None:
    db = get_db()
    return await db.stock.find_one({"name": item_name}, {"_id": 0})


async def add_stock_item(item_data: dict) -> dict:
    db = get_db()
    new_id = item_data.get("id")
    if new_id is None:
        last_item = await db.stock.find_one({}, sort=[("id", -1)], projection={"id": 1, "_id": 0})
        new_id = (last_item["id"] + 1) if last_item else 1

    qty = int(item_data.get("quantity", 0))
    new_item = {
        "id": new_id,
        "name": item_data.get("name"),
        "price": item_data.get("price"),
        "managementQty": qty,
        "distributorQty": int(item_data.get("distributorQty", 0)),
        "retailerQty": int(item_data.get("retailerQty", 0)),
    }
    await db.stock.insert_one(new_item)
    return _to_role_view(new_item, "management")


async def update_stock_item(stock_id: int, updates: dict, role: str = "management") -> dict | None:
    db = get_db()
    set_updates = dict(updates)
    if "quantity" in set_updates:
        field = ROLE_FIELD_MAP.get(role, "managementQty")
        set_updates[field] = int(set_updates.pop("quantity"))
    await db.stock.update_one({"id": stock_id}, {"$set": set_updates})
    return await get_stock_by_id(stock_id, role)


async def transfer_stock(item_name: str, from_role: str, to_role: str, quantity: int) -> dict | None:
    db = get_db()
    from_field = ROLE_FIELD_MAP.get(from_role)
    to_field = ROLE_FIELD_MAP.get(to_role)
    if not from_field or not to_field:
        return None

    raw_item = await get_raw_stock_by_name(item_name)
    if not raw_item:
        return None

    raw_item = _normalize_legacy_stock(raw_item)
    from_qty = int(raw_item.get(from_field, 0))
    if from_qty < quantity:
        return None

    to_qty = int(raw_item.get(to_field, 0))
    await db.stock.update_one(
        {"name": item_name},
        {"$set": {from_field: from_qty - quantity, to_field: to_qty + quantity}},
    )
    return await get_stock_by_name(item_name, to_role)

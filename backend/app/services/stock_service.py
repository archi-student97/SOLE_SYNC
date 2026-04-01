from app.repositories.stock_repo import (
    add_stock_item,
    get_stock_by_id,
    get_stock_by_name,
    get_raw_stock_by_name,
    list_stock,
    transfer_stock,
    update_stock_item,
)


async def get_stock_items(role: str = "management") -> list[dict]:
    return await list_stock(role)


async def add_new_stock_item(item_data: dict) -> dict:
    return await add_stock_item(item_data)


async def update_stock(stock_id: int, updates: dict, role: str = "management") -> dict | None:
    return await update_stock_item(stock_id, updates, role)


async def adjust_stock(stock_id: int, delta: int, role: str = "management") -> dict | None:
    item = await get_stock_by_id(stock_id, role)
    if not item:
        return None
    new_quantity = max(0, int(item["quantity"]) + delta)
    return await update_stock_item(stock_id, {"quantity": new_quantity}, role)


async def check_stock_availability(item_name: str, quantity: int, role: str = "management") -> dict:
    item = await get_stock_by_name(item_name, role)
    if item and item["quantity"] >= quantity:
        return {"available": True, "stockItem": item}
    return {"available": False, "stockItem": item}


async def deduct_stock(item_name: str, quantity: int, role: str = "management") -> dict | None:
    item = await get_stock_by_name(item_name, role)
    if not item or item["quantity"] < quantity:
        return None
    return await update_stock_item(item["id"], {"quantity": item["quantity"] - quantity}, role)


async def get_stock_summary(role: str = "management") -> dict:
    stock_items = await list_stock(role)
    total_items = sum(item["quantity"] for item in stock_items)
    total_value = sum(item["quantity"] * item["price"] for item in stock_items)
    return {
        "totalItems": total_items,
        "totalValue": total_value,
        "itemCount": len(stock_items),
    }


async def transfer_stock_between_roles(item_name: str, from_role: str, to_role: str, quantity: int) -> dict | None:
    return await transfer_stock(item_name, from_role, to_role, quantity)


async def ensure_stock_role_fields_initialized(item_name: str) -> None:
    item = await get_raw_stock_by_name(item_name)
    if not item:
        return
    updates = {}
    if "managementQty" not in item and "quantity" in item:
        qty = int(item["quantity"])
        updates["managementQty"] = qty
        updates["distributorQty"] = qty
        updates["retailerQty"] = int(item.get("retailerQty", 0))
    if updates:
        await update_stock_item(item["id"], {"quantity": updates["managementQty"]}, "management")
        await update_stock_item(item["id"], {"quantity": updates["distributorQty"]}, "distributor")
        await update_stock_item(item["id"], {"quantity": updates["retailerQty"]}, "retailer")

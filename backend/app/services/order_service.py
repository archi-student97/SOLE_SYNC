from app.repositories.orders_repo import (
    create_order,
    delete_order,
    get_order,
    list_orders,
    mark_order_loyalty_credited,
    update_order_status,
)
from app.services.loyalty_service import apply_loyalty_for_delivered_order
from app.services.stock_service import check_stock_availability, get_pricing_for_item, transfer_stock_between_roles

ORDER_STATUS = {
    "PENDING": "pending",
    "APPROVED": "approved",
    "REJECTED": "rejected",
    "FORWARDED": "forwarded",
}

COMPLETED_STATUSES = {"approved", "delivered", "completed"}


async def get_orders() -> list[dict]:
    return await list_orders()


async def get_orders_by_status(status: str) -> list[dict]:
    orders = await list_orders()
    return [order for order in orders if order["status"] == status]


async def get_orders_by_role(role: str) -> list[dict]:
    orders = await list_orders()
    if role == "management":
        return orders
    if role == "distributor":
        return [o for o in orders if o["fromRole"] == "retailer" or o["toRole"] == "management"]
    if role == "retailer":
        return [o for o in orders if o["fromRole"] == "retailer"]
    return orders


async def place_order(order_data: dict) -> dict:
    order_data["status"] = ORDER_STATUS["PENDING"]
    pricing = await get_pricing_for_item(order_data["itemName"])
    if pricing:
        from_role = str(order_data.get("fromRole", "")).lower()
        to_role = str(order_data.get("toRole", "")).lower()
        qty = int(order_data.get("quantity") or 0)
        if from_role == "distributor" and to_role == "management":
            unit_price = float(pricing["managementSellPrice"])
            order_data["unitPrice"] = unit_price
            order_data["totalPrice"] = round(unit_price * qty, 2)
        elif from_role == "retailer" and to_role == "distributor":
            unit_price = float(pricing["distributorSellPrice"])
            order_data["unitPrice"] = unit_price
            order_data["totalPrice"] = round(unit_price * qty, 2)
    return await create_order(order_data)


async def set_order_status(order_id: int, status: str) -> dict | None:
    previous = await get_order(order_id)
    updated = await update_order_status(order_id, status)
    if not previous or not updated:
        return updated

    prev_status = (previous.get("status") or "").lower()
    new_status = (updated.get("status") or "").lower()
    became_completed = prev_status not in COMPLETED_STATUSES and new_status in COMPLETED_STATUSES
    if became_completed:
        credited = await apply_loyalty_for_delivered_order(updated)
        if credited:
            updated = await mark_order_loyalty_credited(order_id) or updated
    return updated


async def remove_order(order_id: int) -> bool:
    return await delete_order(order_id)


async def approve_order_by_distributor(order_id: int) -> dict:
    order = await get_order(order_id)
    if not order:
        return {"success": False, "reason": "not_found"}

    stock_result = await check_stock_availability(order["itemName"], order["quantity"], "distributor")
    if not stock_result["available"]:
        return {"success": False, "reason": "insufficient_stock"}

    await transfer_stock_between_roles(order["itemName"], "distributor", "retailer", order["quantity"])
    updated = await set_order_status(order_id, ORDER_STATUS["APPROVED"])
    return {"success": True, "order": updated}


async def request_restock_from_management(order_id: int, order_data: dict, user_id: int | None = None) -> dict:
    pricing = await get_pricing_for_item(order_data["itemName"])
    qty = int(order_data.get("quantity") or 0)
    mgmt_unit_price = float(pricing["managementSellPrice"]) if pricing else float(order_data.get("unitPrice", 0))
    return await create_order(
        {
            "itemName": order_data["itemName"],
            "quantity": qty,
            "totalPrice": round(mgmt_unit_price * qty, 2),
            "unitPrice": mgmt_unit_price,
            "fromRole": "distributor",
            "toRole": "management",
            "userId": user_id,
            "status": ORDER_STATUS["PENDING"],
            "linkedOrderId": order_id,
        }
    )


async def approve_order_management(order_id: int) -> dict | None:
    order = await get_order(order_id)
    updated = await set_order_status(order_id, ORDER_STATUS["APPROVED"])
    if not order:
        return updated

    if order["fromRole"] == "distributor":
        # Management approval transfers stock from management to distributor.
        stock_result = await check_stock_availability(order["itemName"], order["quantity"], "management")
        if stock_result["available"]:
            await transfer_stock_between_roles(order["itemName"], "management", "distributor", order["quantity"])

        all_orders = await list_orders()
        linked_orders = [
            o for o in all_orders if o.get("linkedOrderId") == order["id"] and o["status"] == ORDER_STATUS["PENDING"]
        ]
        for linked in linked_orders:
            stock_result = await check_stock_availability(linked["itemName"], linked["quantity"], "distributor")
            if stock_result["available"]:
                await transfer_stock_between_roles(linked["itemName"], "distributor", "retailer", linked["quantity"])
                await set_order_status(linked["id"], ORDER_STATUS["APPROVED"])
    return updated


async def reject_order(order_id: int) -> dict | None:
    return await update_order_status(order_id, ORDER_STATUS["REJECTED"])


async def forward_order_to_management(order_id: int) -> dict | None:
    return await update_order_status(order_id, ORDER_STATUS["FORWARDED"])

from app.repositories.orders_repo import (
    create_order,
    delete_order,
    get_order,
    list_orders,
    update_order_status,
)
from app.services.loyalty_service import update_loyalty_points
from app.services.stock_service import check_stock_availability, transfer_stock_between_roles

ORDER_STATUS = {
    "PENDING": "pending",
    "APPROVED": "approved",
    "REJECTED": "rejected",
    "FORWARDED": "forwarded",
}


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
    return await create_order(order_data)


async def set_order_status(order_id: int, status: str) -> dict | None:
    return await update_order_status(order_id, status)


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
    updated = await update_order_status(order_id, ORDER_STATUS["APPROVED"])
    if updated and updated["fromRole"] == "retailer":
        await update_loyalty_points("retailer", 10)
    return {"success": True, "order": updated}


async def request_restock_from_management(order_id: int, order_data: dict) -> dict:
    return await create_order(
        {
            "itemName": order_data["itemName"],
            "quantity": order_data["quantity"],
            "totalPrice": order_data["totalPrice"],
            "unitPrice": order_data["unitPrice"],
            "fromRole": "distributor",
            "toRole": "management",
            "status": ORDER_STATUS["PENDING"],
            "linkedOrderId": order_id,
        }
    )


async def approve_order_management(order_id: int) -> dict | None:
    order = await get_order(order_id)
    updated = await update_order_status(order_id, ORDER_STATUS["APPROVED"])
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
                await update_order_status(linked["id"], ORDER_STATUS["APPROVED"])
                if linked["fromRole"] == "retailer":
                    await update_loyalty_points("retailer", 10)

    if updated and updated["fromRole"] == "retailer":
        await update_loyalty_points("retailer", 10)

    return updated


async def reject_order(order_id: int) -> dict | None:
    return await update_order_status(order_id, ORDER_STATUS["REJECTED"])


async def forward_order_to_management(order_id: int) -> dict | None:
    return await update_order_status(order_id, ORDER_STATUS["FORWARDED"])

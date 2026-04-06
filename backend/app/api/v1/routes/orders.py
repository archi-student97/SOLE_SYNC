from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.services.auth_service import get_user_from_token
from app.schemas.common import MessageResponse
from app.schemas.order import (
    ApproveDistributorResponse,
    Order,
    OrderCreate,
    OrderStatusUpdate,
    RequestRestockPayload,
)
from app.services.order_service import (
    approve_order_by_distributor,
    approve_order_management,
    forward_order_to_management,
    get_orders,
    get_orders_by_role,
    get_orders_by_status,
    place_order,
    reject_order,
    remove_order,
    request_restock_from_management,
    set_order_status,
)

router = APIRouter(prefix="/orders", tags=["orders"])
bearer_scheme_optional = HTTPBearer(auto_error=False)


@router.get("", response_model=list[Order])
async def list_orders_endpoint() -> list[Order]:
    return [Order(**order) for order in await get_orders()]


@router.get("/status/{status}", response_model=list[Order])
async def list_orders_by_status_endpoint(status: str) -> list[Order]:
    return [Order(**order) for order in await get_orders_by_status(status)]


@router.get("/role/{role}", response_model=list[Order])
async def list_orders_by_role_endpoint(role: str) -> list[Order]:
    return [Order(**order) for order in await get_orders_by_role(role)]


@router.post("", response_model=Order)
async def create_order_endpoint(
    payload: OrderCreate,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
) -> Order:
    order_data = payload.model_dump()
    if credentials:
        user = await get_user_from_token(credentials.credentials)
        if user:
            order_data["userId"] = user["id"]

    created = await place_order(order_data)
    return Order(**created)


@router.patch("/{order_id}/status", response_model=Order)
async def update_order_status_endpoint(order_id: int, payload: OrderStatusUpdate) -> Order:
    updated = await set_order_status(order_id, payload.status)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**updated)


@router.delete("/{order_id}", response_model=MessageResponse)
async def delete_order_endpoint(order_id: int) -> MessageResponse:
    deleted = await remove_order(order_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Order not found")
    return MessageResponse(message="Order deleted")


@router.post("/{order_id}/approve-distributor", response_model=ApproveDistributorResponse)
async def approve_by_distributor_endpoint(order_id: int) -> ApproveDistributorResponse:
    result = await approve_order_by_distributor(order_id)
    order = result.get("order")
    return ApproveDistributorResponse(
        success=result["success"],
        order=Order(**order) if order else None,
        reason=result.get("reason"),
    )


@router.post("/{order_id}/request-restock", response_model=Order)
async def request_restock_endpoint(
    order_id: int,
    payload: RequestRestockPayload,
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
) -> Order:
    user_id = None
    if credentials:
        user = await get_user_from_token(credentials.credentials)
        if user:
            user_id = user["id"]

    created = await request_restock_from_management(order_id, payload.model_dump(), user_id=user_id)
    return Order(**created)


@router.post("/{order_id}/approve-management", response_model=Order)
async def approve_management_endpoint(order_id: int) -> Order:
    updated = await approve_order_management(order_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**updated)


@router.post("/{order_id}/reject", response_model=Order)
async def reject_order_endpoint(order_id: int) -> Order:
    updated = await reject_order(order_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**updated)


@router.post("/{order_id}/forward", response_model=Order)
async def forward_order_endpoint(order_id: int) -> Order:
    updated = await forward_order_to_management(order_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Order not found")
    return Order(**updated)

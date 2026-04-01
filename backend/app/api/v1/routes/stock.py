from fastapi import APIRouter, HTTPException, Query

from app.schemas.stock import (
    DeductStockRequest,
    StockAdjustRequest,
    StockAvailabilityResponse,
    StockItem,
    StockItemCreate,
    StockItemUpdate,
    StockSummary,
)
from app.services.stock_service import (
    add_new_stock_item,
    adjust_stock,
    check_stock_availability,
    deduct_stock,
    get_stock_items,
    get_stock_summary,
    update_stock,
)

router = APIRouter(prefix="/stock", tags=["stock"])


@router.get("", response_model=list[StockItem])
async def list_stock_endpoint(role: str = Query("management")) -> list[StockItem]:
    return [StockItem(**item) for item in await get_stock_items(role)]


@router.post("", response_model=StockItem)
async def add_stock_endpoint(payload: StockItemCreate) -> StockItem:
    created = await add_new_stock_item(payload.model_dump())
    return StockItem(**created)


@router.patch("/{stock_id}", response_model=StockItem)
async def update_stock_endpoint(stock_id: int, payload: StockItemUpdate, role: str = Query("management")) -> StockItem:
    updates = {k: v for k, v in payload.model_dump().items() if v is not None}
    updated = await update_stock(stock_id, updates, role)
    if not updated:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return StockItem(**updated)


@router.post("/{stock_id}/adjust", response_model=StockItem)
async def adjust_stock_endpoint(stock_id: int, payload: StockAdjustRequest) -> StockItem:
    updated = await adjust_stock(stock_id, payload.delta, payload.role)
    if not updated:
        raise HTTPException(status_code=404, detail="Stock item not found")
    return StockItem(**updated)


@router.get("/check-availability", response_model=StockAvailabilityResponse)
async def check_availability_endpoint(
    item_name: str = Query(..., alias="itemName"),
    quantity: int = Query(...),
    role: str = Query("management"),
) -> StockAvailabilityResponse:
    result = await check_stock_availability(item_name, quantity, role)
    stock_item = result.get("stockItem")
    return StockAvailabilityResponse(
        available=result["available"],
        stockItem=StockItem(**stock_item) if stock_item else None,
    )


@router.post("/deduct", response_model=StockItem)
async def deduct_stock_endpoint(payload: DeductStockRequest) -> StockItem:
    updated = await deduct_stock(payload.itemName, payload.quantity, payload.role)
    if not updated:
        raise HTTPException(status_code=400, detail="Insufficient stock or item not found")
    return StockItem(**updated)


@router.get("/summary", response_model=StockSummary)
async def stock_summary_endpoint(role: str = Query("management")) -> StockSummary:
    summary = await get_stock_summary(role)
    return StockSummary(**summary)

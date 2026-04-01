from pydantic import BaseModel


class StockItemBase(BaseModel):
    name: str
    quantity: int
    price: float


class StockItemCreate(StockItemBase):
    pass


class StockItemUpdate(BaseModel):
    name: str | None = None
    quantity: int | None = None
    price: float | None = None


class StockItem(StockItemBase):
    id: int


class StockAdjustRequest(BaseModel):
    delta: int
    role: str = "management"


class StockSummary(BaseModel):
    totalItems: int
    totalValue: float
    itemCount: int


class StockAvailabilityResponse(BaseModel):
    available: bool
    stockItem: StockItem | None = None


class DeductStockRequest(BaseModel):
    itemName: str
    quantity: int
    role: str = "management"

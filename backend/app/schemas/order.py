from datetime import datetime
from pydantic import BaseModel


class OrderBase(BaseModel):
    itemName: str
    quantity: int
    totalPrice: float
    unitPrice: float
    fromRole: str
    toRole: str
    status: str = "pending"
    linkedOrderId: int | None = None
    isDeleted: bool = False


class OrderCreate(OrderBase):
    pass


class Order(OrderBase):
    id: int
    createdAt: datetime
    updatedAt: datetime | None = None


class OrderStatusUpdate(BaseModel):
    status: str


class RequestRestockPayload(BaseModel):
    itemName: str
    quantity: int
    totalPrice: float
    unitPrice: float


class ApproveDistributorResponse(BaseModel):
    success: bool
    order: Order | None = None
    reason: str | None = None

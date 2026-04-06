from pydantic import BaseModel


class Loyalty(BaseModel):
    total_purchase: float
    loyalty_points: int


class LoyaltyUpdate(BaseModel):
    points: int

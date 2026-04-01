from pydantic import BaseModel


class Loyalty(BaseModel):
    distributor: int
    retailer: int


class LoyaltyUpdate(BaseModel):
    role: str
    points: int

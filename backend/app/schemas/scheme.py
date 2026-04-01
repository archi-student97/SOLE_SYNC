from datetime import datetime
from pydantic import BaseModel


class SchemeCreate(BaseModel):
    name: str
    discount: float
    validity: str | None = None


class Scheme(BaseModel):
    id: int
    name: str
    discount: float
    validity: str | None = None
    createdAt: datetime

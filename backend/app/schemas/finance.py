from pydantic import BaseModel


class Transaction(BaseModel):
    id: int
    type: str
    amount: float
    description: str
    date: str


class Finance(BaseModel):
    revenue: float
    expenses: float
    transactions: list[Transaction]


class FinanceSummary(BaseModel):
    revenue: float
    expenses: float
    profit: float
    transactions: list[Transaction]

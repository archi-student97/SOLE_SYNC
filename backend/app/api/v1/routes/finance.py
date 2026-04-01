from fastapi import APIRouter

from app.schemas.finance import Finance, FinanceSummary
from app.services.finance_service import get_finance_data, get_finance_summary

router = APIRouter(prefix="/finance", tags=["finance"])


@router.get("", response_model=Finance)
async def get_finance_endpoint() -> Finance:
    return Finance(**(await get_finance_data()))


@router.get("/summary", response_model=FinanceSummary)
async def get_finance_summary_endpoint() -> FinanceSummary:
    return FinanceSummary(**(await get_finance_summary()))

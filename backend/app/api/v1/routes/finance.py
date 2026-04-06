from fastapi import APIRouter, Depends, Query
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer

from app.schemas.finance import Finance, FinanceSummary
from app.services.auth_service import get_user_from_token
from app.services.finance_service import get_finance_data, get_finance_summary

router = APIRouter(prefix="/finance", tags=["finance"])
bearer_scheme_optional = HTTPBearer(auto_error=False)


@router.get("", response_model=Finance)
async def get_finance_endpoint() -> Finance:
    return Finance(**(await get_finance_data()))


@router.get("/summary", response_model=FinanceSummary)
async def get_finance_summary_endpoint(
    role: str | None = Query(default=None),
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme_optional),
) -> FinanceSummary:
    if not credentials:
        # Backward-compatible behavior for unauthenticated callers.
        return FinanceSummary(**(await get_finance_summary(role)))

    user = await get_user_from_token(credentials.credentials)
    if not user:
        return FinanceSummary(**(await get_finance_summary(role)))

    user_role = str(user.get("role", "")).lower()
    if user_role in {"distributor", "retailer"}:
        # Enforce user-specific finance for non-management roles.
        return FinanceSummary(
            **(
                await get_finance_summary(
                    user_role,
                    user_id=int(user["id"]),
                )
            )
        )

    requested_role = (role or "management").strip().lower()
    return FinanceSummary(**(await get_finance_summary(requested_role)))

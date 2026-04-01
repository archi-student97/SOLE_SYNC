from app.repositories.finance_repo import get_finance


async def get_finance_data() -> dict:
    return await get_finance()


async def get_finance_summary() -> dict:
    finance = await get_finance()
    return {
        "revenue": finance["revenue"],
        "expenses": finance["expenses"],
        "profit": finance["revenue"] - finance["expenses"],
        "transactions": finance.get("transactions", []),
    }

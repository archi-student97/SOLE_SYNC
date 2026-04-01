from fastapi import APIRouter

from app.api.v1.routes import access, auth, finance, loyalty, orders, schemes, stock, system

api_router = APIRouter()
api_router.include_router(system.router)
api_router.include_router(access.router)
api_router.include_router(auth.router)
api_router.include_router(orders.router)
api_router.include_router(stock.router)
api_router.include_router(schemes.router)
api_router.include_router(loyalty.router)
api_router.include_router(finance.router)

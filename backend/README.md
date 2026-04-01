# Sole Sync Backend (FastAPI + MongoDB)

This backend replaces localStorage with a REST API and MongoDB persistence for:
- Auth
- Orders and workflow actions
- Stock
- Schemes
- Loyalty
- Finance

## 1) Prerequisites

- Python 3.10+
- MongoDB running locally or remote URI

## 2) Setup

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
```

Update `.env` values:
- `MONGODB_URI`
- `MONGODB_DB_NAME`
- `JWT_SECRET_KEY`
- `CORS_ORIGINS` (default includes `http://localhost:3000`)

## 3) Run API

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Health check:
- `GET http://localhost:8000/health`

Swagger docs:
- `http://localhost:8000/docs`

## 4) Frontend Integration

In your Next.js root, create `.env.local`:

```bash
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000/api/v1
```

Then run frontend:

```bash
npm run dev
```

## 5) API Overview

- `POST /api/v1/system/init`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `GET|POST /api/v1/orders`
- `GET /api/v1/orders/status/{status}`
- `GET /api/v1/orders/role/{role}`
- `PATCH /api/v1/orders/{order_id}/status`
- `DELETE /api/v1/orders/{order_id}`
- `POST /api/v1/orders/{order_id}/approve-distributor`
- `POST /api/v1/orders/{order_id}/request-restock`
- `POST /api/v1/orders/{order_id}/approve-management`
- `POST /api/v1/orders/{order_id}/reject`
- `POST /api/v1/orders/{order_id}/forward`
- `GET|POST /api/v1/stock`
- `PATCH /api/v1/stock/{stock_id}`
- `POST /api/v1/stock/{stock_id}/adjust`
- `GET /api/v1/stock/check-availability?itemName=...&quantity=...`
- `POST /api/v1/stock/deduct`
- `GET /api/v1/stock/summary`
- `GET|POST /api/v1/schemes`
- `DELETE /api/v1/schemes/{scheme_id}`
- `GET /api/v1/loyalty`
- `POST /api/v1/loyalty/update`
- `GET /api/v1/finance`
- `GET /api/v1/finance/summary`

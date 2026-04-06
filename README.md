# Sole Sync

Sole Sync is a full-stack supply chain management app for three roles:
- Management
- Distributor
- Retailer

Frontend is built with Next.js, backend is built with FastAPI, and data is stored in MongoDB.

## Tech Stack

- Frontend: Next.js 14.2.21, React 18
- Backend: FastAPI (Python)
- Database: MongoDB
- Auth: JWT token-based login

## Main Features

- Role-based login (management, distributor, retailer)
- Forgot password (email + new password, no OTP)
- Management can create/view/delete users
- Order placement and approval workflow
- Stock tracking and stock adjustments by role
- Soft delete for orders (`isDeleted`)
- Loyalty points based on purchase amount:
  - counts completed orders (`approved` / `delivered` / `completed`)
  - excludes soft-deleted orders
  - 1 point for every Rs 10 spent
- Net profit calculated per dashboard role and updated on refresh

## Project Structure

```text
copy/
  app/                  # Next.js App Router pages
  components/           # Reusable UI components
  services/             # Frontend service layer
  api/                  # Frontend API wrappers
  backend/              # FastAPI backend
    app/
      api/v1/routes/    # REST endpoints
      services/         # Business services
      repositories/     # MongoDB access
      schemas/          # Pydantic schemas
      models/           # Seed/default models
```

## Prerequisites

- Node.js 18+
- Python 3.10+
- MongoDB running locally (or remote URI)

## Environment Setup

### 1) Frontend `.env.local` (project root)

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8070/api/v1
```

### 2) Backend `.env` (`backend/.env`)

If missing:

```powershell
Copy-Item backend\.env.example backend\.env
```

Typical values:

```env
MONGODB_URI=mongodb://localhost:27017
MONGODB_DB_NAME=sole_sync
JWT_SECRET_KEY=change_me_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=120
CORS_ORIGINS=http://localhost:3000
```

## Run the Project

Open two terminals in VS Code.

### Terminal 1: Start backend

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 127.0.0.1 --port 8070 --reload
```

Optional (from project root):

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

Backend:
- Health: http://localhost:8070/health
- Docs: http://localhost:8070/docs

### Terminal 2: Start frontend

```powershell
cd ..
npm install
npm run dev
```

Open app:
- http://localhost:3000

## Stop the Project

- In each running terminal, press `Ctrl + C`

## Default Admin Login

- Email: `admin@sole.com`
- Password: `admin@13`

Then create distributor/retailer users from Management dashboard.

## Key APIs

### Auth
- `POST /api/v1/login`
- `POST /api/v1/forgot-password`
- `POST /api/v1/users` (management only)
- `GET /api/v1/users` (management only)
- `DELETE /api/v1/users/{user_id}` (management only)
- `GET /api/v1/auth/me`

### Orders
- `GET /api/v1/orders`
- `POST /api/v1/orders`
- `PATCH /api/v1/orders/{order_id}/status`
- `DELETE /api/v1/orders/{order_id}` (soft delete)

### Loyalty
- `GET /api/v1/loyalty`
- Response:
```json
{
  "total_purchase": 0,
  "loyalty_points": 0
}
```

### Finance
- `GET /api/v1/finance/summary?role=management`
- `GET /api/v1/finance/summary?role=distributor`
- `GET /api/v1/finance/summary?role=retailer`

## Manual Test Checklist

1. Login as admin
2. Create distributor and retailer users
3. Place order (retailer -> distributor)
4. Approve order (distributor)
5. Verify stock updates
6. Verify loyalty updates (purchase + points)
7. Verify net profit card changes after order updates
8. Soft delete an approved order and confirm it disappears from UI but remains in DB with `isDeleted: true`

## Common Issues

### "Another next dev server is already running"

Stop old process:

```powershell
taskkill /PID <PID> /F
```

Then run `npm run dev` once.

### "Cannot connect to backend at http://localhost:8070/api/v1"

This means frontend is running but backend is not reachable.

Check backend:

```powershell
Invoke-WebRequest http://127.0.0.1:8070/health -UseBasicParsing
```

If it fails, start backend:

```powershell
powershell -ExecutionPolicy Bypass -File .\start-backend.ps1
```

Then hard refresh browser (`Ctrl + F5`).

### Pytest folders like `pytest-cache-files-*`

These are temporary test cache folders and safe to remove:

```powershell
Remove-Item -Recurse -Force .\pytest-cache-files-* -ErrorAction SilentlyContinue
```

### Frontend still shows old data

- Hard refresh: `Ctrl + F5`
- Logout and login again

## GitHub Push (Quick)

```powershell
git status
git add .
git commit -m "Your message"
git push -u origin main
```

If your branch is not `main`:

```powershell
git branch --show-current
git push -u origin <your-branch-name>
```

If remote is not configured yet:

```powershell
git remote add origin https://github.com/<your-username>/<repo-name>.git
```

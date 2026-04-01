# Sole Sync Project Guide (Easy Understanding)

This file explains the project in simple language: what it does, how login works, how orders/stock flow works, and how to run it correctly.

## 1) What This Project Is

`Sole Sync` is a supply-chain app with 3 roles:

- `Management`
- `Distributor`
- `Retailer`

Main modules:

- Login/Auth
- Order processing
- Stock tracking
- Loyalty points
- Schemes
- Finance overview

Tech:

- Frontend: `Next.js`
- Backend: `FastAPI`
- Database: `MongoDB`

---

## 2) Role Workflow (Business Flow)

### Retailer

1. Places order to Distributor
2. Waits for approval
3. Sees stock and finance screens

### Distributor

1. Receives retailer orders
2. Checks distributor stock
3. If stock available -> approve retailer order
4. If stock not available -> request restock from Management

### Management

1. Receives distributor orders/restock requests
2. Approves/rejects
3. Manages stock and schemes
4. Creates Distributor/Retailer users

---

## 3) Authentication System (Current)

Login is database-based (not hardcoded frontend login).

Backend APIs used:

- `POST /api/v1/login`
- `POST /api/v1/forgot-password`
- `POST /api/v1/users` (management creates users)
- `GET /api/v1/users` (management view users)
- `DELETE /api/v1/users/{id}` (management delete user)
- `GET /api/v1/auth/me` (session validation)

### Default Admin

- Email: `admin@sole.com`
- Password: `admin123`
- Role: `management`

---

## 4) Forgot Password

On login page:

1. Click `Forgot Password?`
2. Enter email
3. Enter new password
4. Submit -> password updates in database

No OTP/email integration in this version.

---

## 5) Create Users (Management)

In Management dashboard -> `Create Users` menu:

Form fields:

- Name
- Role (`distributor` or `retailer`)
- Email
- Password

Below form, there is users table:

- User ID
- Name
- Role
- Email
- Password
- Delete button

---

## 6) Order Delete (Soft Delete)

Orders are NOT permanently removed.

Behavior:

- Delete button is shown for `approved` orders
- Clicking delete calls backend `DELETE /orders/{id}`
- Backend sets `isDeleted = true`
- UI excludes deleted orders from list
- Data remains in DB for record/history

---

## 7) How to Run (Correct Way)

## A) Start Backend

```powershell
cd c:\Users\archi\OneDrive\Desktop\copy\backend
python -m uvicorn app.main:app --host 127.0.0.1 --port 8060
```

## B) Start Frontend

Open second terminal:

```powershell
cd c:\Users\archi\OneDrive\Desktop\copy
npm run dev
```

Open app:

- `http://localhost:3000`

---

## 8) Important Environment Setting

In file `.env.local` (project root):

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8060/api/v1
```

---

## 9) If You See Old UI / Missing New Features

This usually means stale dev process/cache.

Run in PowerShell (preferably Admin):

```powershell
taskkill /IM node.exe /F
taskkill /IM python.exe /F
```

Then clear Next cache:

```powershell
cd c:\Users\archi\OneDrive\Desktop\copy
if (Test-Path .next) { Remove-Item -Recurse -Force .next }
```

Start backend + frontend again, then hard refresh browser:

- `Ctrl + F5`

---

## 10) Where Key Files Are

Frontend:

- Login page: `app/page.js`
- Management dashboard: `app/dashboard/management/page.js`
- Distributor dashboard: `app/dashboard/distributor/page.js`
- Retailer dashboard: `app/dashboard/retailer/page.js`
- Sidebar menu: `components/Sidebar.js`

Backend:

- Auth/user APIs: `backend/app/api/v1/routes/access.py`
- Login/me APIs: `backend/app/api/v1/routes/auth.py`
- Order APIs: `backend/app/api/v1/routes/orders.py`
- Auth service: `backend/app/services/auth_service.py`
- Users repo: `backend/app/repositories/users_repo.py`
- Orders repo (soft delete): `backend/app/repositories/orders_repo.py`

---

## 11) Quick Testing Checklist

1. Login with admin
2. Open Management -> Create Users
3. Create one Distributor user
4. Logout
5. Login as created Distributor user
6. Place/approve order flow
7. Check approved order delete button
8. Delete order -> order disappears from UI

---

If you want, I can also create a short **one-page operator manual** (for non-technical users) with only login, create-user, place-order, approve-order, and delete-order steps.

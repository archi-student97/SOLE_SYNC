# Sole Sync - Supply Chain Management System

A web-based supply chain management system for shoe distribution, built with Next.js. It supports three user roles — Management, Distributor, and Retailer — with features for order management, stock tracking, loyalty points, schemes, and finance overview.

## Tech Stack

- **Framework:** Next.js 14.2.21 (App Router)
- **Language:** JavaScript (JSX)
- **UI:** React 18.3.1 with CSS Modules
- **Data Storage:** Browser localStorage (no backend server)
- **Path Aliasing:** `@/*` mapped to project root via `jsconfig.json`

## Project Structure

```
sole-sync/
├── app/
│   ├── globals.css                  # Global styles (login, dashboard, forms, tables, etc.)
│   ├── layout.js                    # Root layout (metadata, html/body wrapper)
│   ├── page.js                      # Login page (email/password auth with demo accounts)
│   └── dashboard/
│       ├── layout.js                # Dashboard layout (auth guard, redirects if not logged in)
│       ├── page.js                  # Dashboard redirect (routes to role-specific page)
│       ├── management/
│       │   └── page.js              # Management dashboard (orders, stock, schemes, monitor)
│       ├── distributor/
│       │   └── page.js              # Distributor dashboard (orders, stock, loyalty, finance)
│       └── retailer/
│           └── page.js              # Retailer dashboard (orders, stock, loyalty, finance)
├── components/
│   ├── Button.js                    # Reusable button component (primary, success, danger variants)
│   ├── Button.module.css            # Button styles
│   ├── Card.js                      # Reusable card component (title, value, variants)
│   ├── Card.module.css              # Card styles
│   ├── Table.js                     # Reusable table component (columns, data, actions)
│   ├── Table.module.css             # Table styles
│   ├── Sidebar.js                   # Sidebar navigation (role-based menus, logout)
│   └── Sidebar.module.css           # Sidebar styles
├── api/
│   ├── api.js                       # Storage initialization (seeds defaults if empty)
│   ├── userApi.js                   # User API (authenticate, getAuthState, logout)
│   ├── orderApi.js                  # Order API (fetch, create, update status, delete)
│   └── stockApi.js                  # Stock/Schemes/Loyalty/Finance API (CRUD operations)
├── services/
│   ├── userService.js               # User service (authenticate, getCurrentUser, isLoggedIn, logout)
│   ├── orderService.js              # Order service (place, approve, reject, forward orders)
│   ├── stockService.js              # Stock service (get items, adjust, summary, add new)
│   └── financeService.js            # Finance service (revenue, expenses, profit, transactions)
├── lib/
│   └── storage.js                   # localStorage wrapper (getData, setData, removeData, clearAll)
├── utils/
│   └── constants.js                 # App constants (storage keys, roles, defaults for users/stock/finance)
├── public/
│   ├── file.svg
│   ├── globe.svg
│   ├── next.svg
│   ├── vercel.svg
│   └── window.svg
├── jsconfig.json                    # Path alias config (@/* -> ./*)
├── next.config.mjs                  # Next.js config (empty defaults)
├── package.json                     # Project metadata and dependencies
└── README.md                        # This file
```

## Getting Started

### Prerequisites

- Node.js 18.17 or later
- npm, yarn, pnpm, or bun

### Step 1: Clone the Repository

```bash
git clone <repository-url>
cd sole-sync
```

### Step 2: Install Dependencies

```bash
npm install
```

### Step 3: Run the Development Server

```bash
npm run dev
```

### Step 4: Open in Browser

Navigate to [http://localhost:3000](http://localhost:3000)

### Step 5: Login with a Demo Account

Use one of the pre-configured demo accounts:

| Role         | Email              | Password    |
|-------------|--------------------|-------------|
| Management  | admin@sole.com     | admin123    |
| Distributor | dist@sole.com      | dist123     |
| Retailer    | retail@sole.com    | retail123   |

Or click on a demo account on the login page to auto-fill credentials.

### Step 6: Explore the Dashboard

After logging in, you will be redirected to the role-specific dashboard.

## Available Scripts

```bash
npm run dev      # Start the development server
npm run build    # Build for production
npm run start    # Start the production server
```

## User Roles & Features

### Management
- **Take Orders** — View and approve/reject orders from distributors
- **Stock Management** — View stock summary, adjust quantities
- **Create Schemes** — Create promotional schemes with discounts and validity
- **Monitor Orders** — View all orders with status breakdown

### Distributor
- **Take Orders** — View orders from retailers, forward to management
- **Place Order** — Place orders to management
- **Loyalty Points** — View distributor loyalty points
- **Track Stock** — View stock items and total value
- **Finance** — View revenue, expenses, net profit, and transactions

### Retailer
- **Place Order** — Place orders to distributors
- **Track Stock** — View stock items and total value
- **Loyalty Points** — View retailer loyalty points
- **Finance** — View revenue, expenses, net profit, and transactions

## Architecture

The application follows a layered architecture:

1. **Pages** (`app/`) — Next.js App Router pages with client-side rendering
2. **Components** (`components/`) — Reusable UI components (Button, Card, Table, Sidebar)
3. **Services** (`services/`) — Business logic layer that orchestrates API calls
4. **API** (`api/`) — Data access layer that reads/writes to localStorage
5. **Lib** (`lib/`) — Utility functions (localStorage wrapper)
6. **Utils** (`utils/`) — Constants and default data

Data persistence is handled entirely through the browser's `localStorage`. The `initStorage()` function in `api/api.js` seeds default data on first load.

## Order Flow

```
Retailer → places order → Distributor
Distributor → forwards order → Management
Management → approves/rejects order
```

When an order is approved, the retailer earns 10 loyalty points.

export const STORAGE_KEYS = {
  ORDERS: "sole_sync_orders",
  STOCK: "sole_sync_stock",
  USERS: "sole_sync_users",
  SCHEMES: "sole_sync_schemes",
  LOYALTY: "sole_sync_loyalty",
  FINANCE: "sole_sync_finance",
  AUTH: "sole_sync_auth",
};

export const ROLES = {
  MANAGEMENT: "management",
  DISTRIBUTOR: "distributor",
  RETAILER: "retailer",
};

export const ORDER_STATUS = {
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  FORWARDED: "forwarded",
};

export const DEFAULT_USERS = [
  {
    id: 1,
    email: "admin@sole.com",
    password: "admin123",
    name: "Admin",
    role: ROLES.MANAGEMENT,
  },
  {
    id: 2,
    email: "dist@sole.com",
    password: "dist123",
    name: "Distributor One",
    role: ROLES.DISTRIBUTOR,
  },
  {
    id: 3,
    email: "retail@sole.com",
    password: "retail123",
    name: "Retailer One",
    role: ROLES.RETAILER,
  },
];

export const DEFAULT_STOCK = [
  { id: 1, name: "Running Shoe A", quantity: 150, price: 89.99 },
  { id: 2, name: "Casual Sneaker B", quantity: 200, price: 59.99 },
  { id: 3, name: "Sports Sandal C", quantity: 75, price: 45.99 },
  { id: 4, name: "Training Shoe D", quantity: 120, price: 74.99 },
  { id: 5, name: "Hiking Boot E", quantity: 60, price: 119.99 },
];

export const DEFAULT_SCHEMES = [];

export const DEFAULT_LOYALTY = {
  distributor: 500,
  retailer: 200,
};

export const DEFAULT_FINANCE = {
  revenue: 15000,
  expenses: 8000,
  transactions: [
    { id: 1, type: "income", amount: 5000, description: "Order #101", date: "2026-03-01" },
    { id: 2, type: "income", amount: 3000, description: "Order #102", date: "2026-03-05" },
    { id: 3, type: "expense", amount: 2000, description: "Restocking", date: "2026-03-10" },
    { id: 4, type: "income", amount: 7000, description: "Order #103", date: "2026-03-15" },
    { id: 5, type: "expense", amount: 6000, description: "Supplier Payment", date: "2026-03-20" },
  ],
};

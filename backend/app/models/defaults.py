from app.core.security import hash_password


DEFAULT_USERS = [
    {
        "id": 1,
        "email": "admin@sole.com",
        "password": hash_password("admin123"),
        "name": "Admin",
        "role": "management",
    },
]

DEFAULT_STOCK = [
    {"id": 1, "name": "Running Shoe A", "quantity": 150, "price": 89.99},
    {"id": 2, "name": "Casual Sneaker B", "quantity": 200, "price": 59.99},
    {"id": 3, "name": "Sports Sandal C", "quantity": 75, "price": 45.99},
    {"id": 4, "name": "Training Shoe D", "quantity": 120, "price": 74.99},
    {"id": 5, "name": "Hiking Boot E", "quantity": 60, "price": 119.99},
]

DEFAULT_SCHEMES = []

DEFAULT_LOYALTY = {"distributor": 500, "retailer": 200}

DEFAULT_FINANCE = {
    "revenue": 15000,
    "expenses": 8000,
    "transactions": [
        {"id": 1, "type": "income", "amount": 5000, "description": "Order #101", "date": "2026-03-01"},
        {"id": 2, "type": "income", "amount": 3000, "description": "Order #102", "date": "2026-03-05"},
        {"id": 3, "type": "expense", "amount": 2000, "description": "Restocking", "date": "2026-03-10"},
        {"id": 4, "type": "income", "amount": 7000, "description": "Order #103", "date": "2026-03-15"},
        {"id": 5, "type": "expense", "amount": 6000, "description": "Supplier Payment", "date": "2026-03-20"},
    ],
}

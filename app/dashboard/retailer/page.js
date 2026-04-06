"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Button from "@/components/Button";
import { deleteOrderById, getOrders, placeOrder } from "@/services/orderService";
import { getStockItemsByRole, getStockSummary } from "@/services/stockService";
import { getSummary } from "@/services/financeService";
import { fetchLoyalty } from "@/api/stockApi";
import { getCurrentUser } from "@/services/userService";

export default function RetailerPage() {
  const [activeFeature, setActiveFeature] = useState("placeOrder");
  const [orders, setOrders] = useState([]);
  const [distributorStock, setDistributorStock] = useState([]);
  const [retailerStock, setRetailerStock] = useState([]);
  const [loyalty, setLoyalty] = useState({ total_purchase: 0, loyalty_points: 0 });
  const [finance, setFinance] = useState(null);
  const [stockSummary, setStockSummary] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  const [orderItem, setOrderItem] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderPrice, setOrderPrice] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ordersData, distributorStockData, retailerStockData, loyaltyData, financeData, summary] =
      await Promise.all([
        getOrders(),
        getStockItemsByRole("distributor"),
        getStockItemsByRole("retailer"),
        fetchLoyalty(),
        getSummary("retailer"),
        getStockSummary("retailer"),
      ]);
    const me = await getCurrentUser();
    setOrders(ordersData);
    setDistributorStock(distributorStockData);
    setRetailerStock(retailerStockData);
    setLoyalty(loyaltyData);
    setFinance(financeData);
    setStockSummary(summary);
    setCurrentUser(me);
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!orderItem || !orderQty || !orderPrice) return;
    await placeOrder({
      itemName: orderItem,
      quantity: parseInt(orderQty),
      totalPrice: parseFloat(orderPrice) * parseInt(orderQty),
      unitPrice: parseFloat(orderPrice),
      fromRole: "retailer",
      toRole: "distributor",
    });
    setOrderItem("");
    setOrderQty("");
    setOrderPrice("");
    loadData();
  };

  const handleDeleteOrder = async (id) => {
    await deleteOrderById(id);
    loadData();
  };

  const myOrders = orders.filter(
    (o) => o.fromRole === "retailer" && Number(o.userId) === Number(currentUser?.id)
  );
  const approvedOrders = myOrders.filter((o) => o.status === "approved").length;
  const pendingOrders = myOrders.filter((o) => o.status === "pending").length;

  const orderColumns = [
    { key: "id", label: "Order ID" },
    { key: "itemName", label: "Item" },
    { key: "quantity", label: "Qty" },
    {
      key: "totalPrice",
      label: "Total",
      render: (val) => `Rs ${(val || 0).toFixed(2)}`,
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span
          className={`statusBadge status${
            val.charAt(0).toUpperCase() + val.slice(1)
          }`}
        >
          {val}
        </span>
      ),
    },
    {
      key: "createdAt",
      label: "Date",
      render: (val) => (val ? new Date(val).toLocaleDateString() : "-"),
    },
  ];

  const renderContent = () => {
    switch (activeFeature) {
      case "placeOrder":
        return (
          <div className="featureSection">
            <h2>Place Order to Distributor</h2>
            <form className="orderForm" onSubmit={handlePlaceOrder}>
              <div className="formGroup">
                <label>Item Name</label>
                <select
                  value={orderItem}
                  onChange={(e) => {
                    setOrderItem(e.target.value);
                    const item = distributorStock.find((s) => s.name === e.target.value);
                    if (item) setOrderPrice(item.price.toString());
                  }}
                  required
                >
                  <option value="">Select an item</option>
                  {distributorStock.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} (Rs {item.price})
                    </option>
                  ))}
                </select>
              </div>
              <div className="formGroup">
                <label>Quantity</label>
                <input
                  type="number"
                  placeholder="Enter quantity"
                  value={orderQty}
                  onChange={(e) => setOrderQty(e.target.value)}
                  min="1"
                  required
                />
              </div>
              <div className="formGroup">
                <label>Unit Price (Rs)</label>
                <input
                  type="number"
                  step="0.01"
                  placeholder="Unit price"
                  value={orderPrice}
                  onChange={(e) => setOrderPrice(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Total</label>
                <input
                  type="text"
                  value={
                    orderQty && orderPrice
                      ? `Rs ${(parseFloat(orderPrice) * parseInt(orderQty || 0)).toFixed(2)}`
                      : "Rs 0.00"
                  }
                  disabled
                />
              </div>
              <div className="formActions">
                <Button type="submit" variant="primary">
                  Place Order
                </Button>
              </div>
            </form>

            <h3>My Orders</h3>
            <Table
              columns={orderColumns}
              data={myOrders}
              onAction={(row) =>
                row.status === "approved" ? (
                  <Button variant="danger" onClick={() => handleDeleteOrder(row.id)}>
                    Delete
                  </Button>
                ) : null
              }
              emptyMessage="No orders placed yet"
            />
          </div>
        );

      case "stock":
        return (
          <div className="featureSection">
            <h2>Track Stock</h2>
            <Table
              columns={[
                { key: "name", label: "Item" },
                { key: "quantity", label: "Quantity" },
                {
                  key: "price",
                  label: "Price",
                  render: (val) => `Rs ${val.toFixed(2)}`,
                },
                {
                  key: "value",
                  label: "Total Value",
                  render: (_, row) => `Rs ${(row.quantity * row.price).toFixed(2)}`,
                },
              ]}
              data={retailerStock}
            />
          </div>
        );

      case "loyalty":
        return (
          <div className="featureSection">
            <h2>Loyalty Points</h2>
            <div className="loyaltyDisplay">
              <div className="loyaltyPoints">{loyalty.loyalty_points}</div>
              <div className="loyaltyLabel">Retailer Loyalty Points</div>
              <p style={{ marginTop: "12px", color: "var(--text-light)", fontSize: "14px" }}>
                Total Purchase: Rs {(loyalty.total_purchase || 0).toFixed(2)}
              </p>
              <p style={{ marginTop: "16px", color: "var(--text-light)", fontSize: "14px" }}>
                Earn 1 point for every Rs 10 spent on delivered orders
              </p>
            </div>
          </div>
        );

      case "finance":
        return (
          <div className="featureSection">
            <h2>Finance Overview</h2>
            {finance && (
              <>
                <h3 style={{ marginTop: 0 }}>Recent Transactions</h3>
                <ul className="transactionList">
                  {finance.transactions.map((tx) => (
                    <li key={tx.id} className="transactionItem">
                      <div>
                        <div className="transactionDesc">{tx.description}</div>
                        <div className="transactionDate">{tx.date}</div>
                      </div>
                      <div
                        className={`transactionAmount ${
                          tx.type === "income" ? "amountIncome" : "amountExpense"
                        }`}
                      >
                        {tx.type === "income" ? "+" : "-"}Rs {tx.amount.toLocaleString()}
                      </div>
                    </li>
                  ))}
                </ul>
              </>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <Sidebar activeFeature={activeFeature} onFeatureChange={setActiveFeature} />
      <main className="mainContent">
        <div className="pageHeader">
          <div>
            <h1>Retailer Dashboard</h1>
            <p>Place orders, track stock, view loyalty points and finances</p>
          </div>
        </div>

        <div className="cardGrid cardGridRetailer">
          <Card
            title="My Total Orders"
            value={myOrders.length}
            variant="highlight"
          />
          <Card
            title="Approved"
            value={approvedOrders}
            variant="success"
          />
          <Card
            title="Pending"
            value={pendingOrders}
            variant="warning"
          />
          <Card
            title="Loyalty Points"
            value={loyalty.loyalty_points}
            variant="highlight"
          />
          {stockSummary && (
            <Card
              title="My Stock Value"
              value={`Rs ${stockSummary.totalValue.toFixed(2)}`}
              variant="highlight"
            />
          )}
        </div>

        {renderContent()}
      </main>
    </>
  );
}

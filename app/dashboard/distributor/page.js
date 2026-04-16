"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Button from "@/components/Button";
import {
  getOrders,
  approveOrderByDistributor,
  deleteOrderById,
  requestRestockFromManagement,
} from "@/services/orderService";
import { getStockItemsByRole, checkStockAvailability } from "@/services/stockService";
import { getSummary } from "@/services/financeService";
import { fetchLoyalty } from "@/api/stockApi";
import { getCurrentUser, getMyRetailersUnderDistributor } from "@/services/userService";

export default function DistributorPage() {
  const [activeFeature, setActiveFeature] = useState("takeOrders");
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [retailers, setRetailers] = useState([]);
  const [loyalty, setLoyalty] = useState({ total_purchase: 0, loyalty_points: 0 });
  const [finance, setFinance] = useState(null);
  const [stockAvailability, setStockAvailability] = useState({});
  const [loadError, setLoadError] = useState("");
  const [currentUser, setCurrentUser] = useState(null);

  const [orderItem, setOrderItem] = useState("");
  const [orderQty, setOrderQty] = useState("");
  const [orderPrice, setOrderPrice] = useState("");
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [processingOrderIds, setProcessingOrderIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoadError("");
    const results = await Promise.allSettled([
      getOrders(),
      getStockItemsByRole("distributor"),
      fetchLoyalty(),
      getSummary("distributor"),
      getMyRetailersUnderDistributor(),
      getCurrentUser(),
    ]);

    const ordersData = results[0].status === "fulfilled" ? results[0].value : [];
    const stockData = results[1].status === "fulfilled" ? results[1].value : [];
    const loyaltyData =
      results[2].status === "fulfilled"
        ? results[2].value
        : { total_purchase: 0, loyalty_points: 0 };
    const financeData = results[3].status === "fulfilled" ? results[3].value : null;
    const retailersData = results[4].status === "fulfilled" ? results[4].value : [];
    const me = results[5].status === "fulfilled" ? results[5].value : null;

    if (results.some((r) => r.status === "rejected")) {
      setLoadError("Some dashboard data could not be loaded. Showing available data.");
    }

    const retailerNameById = new Map(
      (retailersData || []).map((retailer) => [Number(retailer.id), retailer.name])
    );
    const enrichedOrders = (ordersData || []).map((order) => ({
      ...order,
      fromUserName:
        order.fromRole === "retailer"
          ? retailerNameById.get(Number(order.userId)) || order.fromUserName || "Retailer"
          : order.fromRole,
    }));

    setOrders(enrichedOrders);
    setStock(stockData || []);
    setRetailers(retailersData || []);
    setCurrentUser(me);
    setLoyalty(loyaltyData || { total_purchase: 0, loyalty_points: 0 });
    setFinance(financeData);

    const retailerOrders = enrichedOrders.filter((o) => o.fromRole === "retailer" && o.status === "pending");
    const avail = {};
    for (const order of retailerOrders) {
      try {
        const result = await checkStockAvailability(order.itemName, order.quantity, "distributor");
        avail[order.id] = result.available;
      } catch {
        avail[order.id] = false;
      }
    }
    setStockAvailability(avail);
  };

  const handleApprove = async (id) => {
    if (processingOrderIds.includes(id)) return;
    setProcessingOrderIds((prev) => [...prev, id]);
    try {
      const result = await approveOrderByDistributor(id);
      if (result && !result.success) {
        alert("Insufficient stock to approve this order.");
      }
      await loadData();
    } finally {
      setProcessingOrderIds((prev) => prev.filter((orderId) => orderId !== id));
    }
  };

  const handleRequestRestock = async (order) => {
    if (processingOrderIds.includes(order.id)) return;
    setProcessingOrderIds((prev) => [...prev, order.id]);
    const stockItem = stock.find((s) => s.name === order.itemName);
    try {
      await requestRestockFromManagement(order.id, {
        itemName: order.itemName,
        quantity: order.quantity,
        unitPrice: stockItem ? stockItem.price : order.unitPrice,
        totalPrice: stockItem ? stockItem.price * order.quantity : order.totalPrice,
      });
      await loadData();
    } finally {
      setProcessingOrderIds((prev) => prev.filter((orderId) => orderId !== order.id));
    }
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    if (!orderItem || !orderQty || !orderPrice || isPlacingOrder) return;
    setIsPlacingOrder(true);
    try {
      const { placeOrder } = await import("@/services/orderService");
      await placeOrder({
        itemName: orderItem,
        quantity: parseInt(orderQty),
        totalPrice: parseFloat(orderPrice) * parseInt(orderQty),
        unitPrice: parseFloat(orderPrice),
        fromRole: "distributor",
        toRole: "management",
      });
      setOrderItem("");
      setOrderQty("");
      setOrderPrice("");
      await loadData();
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const handleDeleteOrder = async (id) => {
    await deleteOrderById(id);
    loadData();
  };

  const retailerIds = new Set((retailers || []).map((r) => Number(r.id)));
  const retailerOrders = orders.filter(
    (o) => o.fromRole === "retailer" && retailerIds.has(Number(o.userId))
  );
  const myOrders = orders.filter(
    (o) => o.fromRole === "distributor" && Number(o.userId) === Number(currentUser?.id)
  );
  const pendingRetailerOrders = retailerOrders.filter((o) => o.status === "pending").length;
  const approvedMyOrders = myOrders.filter((o) => o.status === "approved").length;

  const linkedOrderIds = new Set(
    myOrders
      .filter(
        (o) =>
          o.linkedOrderId &&
          o.toRole === "management" &&
          o.status === "pending"
      )
      .map((o) => o.linkedOrderId)
  );

  const orderColumns = [
    { key: "id", label: "Order ID" },
    { key: "itemName", label: "Item" },
    { key: "quantity", label: "Qty" },
    {
      key: "totalPrice",
      label: "Total",
      render: (val) => `₹${(val || 0).toFixed(2)}`,
    },
    {
      key: "fromUserName",
      label: "From Retailer",
      render: (_, row) => row.fromUserName || "Retailer",
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
      case "takeOrders":
        return (
          <div className="featureSection">
            <h2>Orders from Retailers</h2>
            <Table
              columns={orderColumns}
              data={retailerOrders}
              onAction={(row) => {
                if (row.status === "approved") {
                  return (
                    <Button variant="danger" onClick={() => handleDeleteOrder(row.id)}>
                      Delete
                    </Button>
                  );
                }
                if (row.status !== "pending") return null;
                const hasStock = stockAvailability[row.id];
                const hasRestockRequest = linkedOrderIds.has(row.id);
                if (hasStock) {
                  return (
                    <Button
                      variant="success"
                      onClick={() => handleApprove(row.id)}
                      disabled={processingOrderIds.includes(row.id)}
                    >
                      {processingOrderIds.includes(row.id) ? "Processing..." : "Approve"}
                    </Button>
                  );
                }
                if (hasRestockRequest) {
                  return (
                    <span style={{ fontSize: "12px", color: "var(--text-light)", fontWeight: 500 }}>
                      Restock requested
                    </span>
                  );
                }
                return (
                  <Button
                    variant="primary"
                    onClick={() => handleRequestRestock(row)}
                    disabled={processingOrderIds.includes(row.id)}
                  >
                    {processingOrderIds.includes(row.id) ? "Processing..." : "Request Restock"}
                  </Button>
                );
              }}
              emptyMessage="No orders from retailers"
            />
          </div>
        );

      case "placeOrder":
        return (
          <div className="featureSection">
            <h2>Place Order to Management</h2>
            <form className="orderForm" onSubmit={handlePlaceOrder}>
              <div className="formGroup">
                <label>Item Name</label>
                <select
                  value={orderItem}
                  onChange={(e) => {
                    setOrderItem(e.target.value);
                    const item = stock.find((s) => s.name === e.target.value);
                    if (item) setOrderPrice(item.price.toString());
                  }}
                  required
                >
                  <option value="">Select an item</option>
                  {stock.map((item) => (
                    <option key={item.id} value={item.name}>
                      {item.name} (₹{item.price}) — {item.quantity} in stock
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
                <label>Unit Price (₹)</label>
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
                      ? `₹${(parseFloat(orderPrice) * parseInt(orderQty || 0)).toFixed(2)}`
                      : "₹0.00"
                  }
                  disabled
                />
              </div>
              <div className="formActions">
                <Button type="submit" variant="primary" disabled={isPlacingOrder}>
                  {isPlacingOrder ? "Placing..." : "Place Order"}
                </Button>
              </div>
            </form>

            <h3>My Orders to Management</h3>
            <Table
              columns={[
                ...orderColumns,
                {
                  key: "linkedOrderId",
                  label: "For Retailer Order",
                  render: (val) => val ? `#${val}` : "-",
                },
              ]}
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

      case "myRetailers":
        const retailerRows = retailers.map((retailer, index) => ({
          ...retailer,
          displayId: index + 1,
        }));
        return (
          <div className="featureSection">
            <h2>Retailers Under Me</h2>
            <Table
              columns={[
                { key: "displayId", label: "Retailer ID" },
                { key: "name", label: "Name" },
                { key: "email", label: "Email" },
              ]}
              data={retailerRows}
              emptyMessage="No retailers linked to this distributor yet"
            />
          </div>
        );

      case "loyalty":
        return (
          <div className="featureSection">
            <h2>Loyalty Points</h2>
            <div className="loyaltyDisplay">
              <div className="loyaltyPoints">{loyalty.loyalty_points}</div>
              <div className="loyaltyLabel">Distributor Loyalty Points</div>
              <p style={{ marginTop: "12px", color: "var(--text-light)", fontSize: "14px" }}>
                Total Purchase: Rs {(loyalty.total_purchase || 0).toFixed(2)}
              </p>
              <p style={{ marginTop: "16px", color: "var(--text-light)", fontSize: "14px" }}>
                Earn 1 point for every Rs 10 spent on delivered orders
              </p>
            </div>
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
                  render: (val) => `₹${val.toFixed(2)}`,
                },
                {
                  key: "value",
                  label: "Total Value",
                  render: (_, row) => `₹${(row.quantity * row.price).toFixed(2)}`,
                },
              ]}
              data={stock}
            />
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
                        {tx.type === "income" ? "+" : "-"}₹{tx.amount.toLocaleString()}
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
            <h1>Distributor Dashboard</h1>
            <p>Manage orders, stock, loyalty points, and finances</p>
            {loadError && (
              <p style={{ marginTop: "8px", color: "#b45309", fontWeight: 600 }}>
                {loadError}
              </p>
            )}
          </div>
        </div>

        <div className="cardGrid cardGridDistributor">
          <Card
            title="Pending from Retailers"
            value={pendingRetailerOrders}
            variant="warning"
          />
          <Card
            title="My Orders Approved"
            value={approvedMyOrders}
            variant="success"
          />
          <Card
            title="Loyalty Points"
            value={loyalty.loyalty_points}
            variant="highlight"
          />
          <Card
            title="My Retailers"
            value={retailers.length}
            variant="highlight"
          />
          {finance && (
            <Card
              title="Net Profit"
              value={`₹${finance.profit.toLocaleString()}`}
              variant={finance.profit >= 0 ? "success" : "danger"}
            />
          )}
        </div>

        {renderContent()}
      </main>
    </>
  );
}

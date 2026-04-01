"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Button from "@/components/Button";
import { createUserAccount, deleteUserAccount, getManagedUsers } from "@/services/userService";
import {
  getOrders,
  approveOrder,
  rejectOrder,
  deleteOrderById,
} from "@/services/orderService";
import {
  getStockItemsByRole,
  adjustStock,
  getStockSummary,
} from "@/services/stockService";
import {
  fetchSchemes as getSchemesFromApi,
  createScheme,
  deleteScheme,
} from "@/api/stockApi";

export default function ManagementPage() {
  const [activeFeature, setActiveFeature] = useState("takeOrders");
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [schemeName, setSchemeName] = useState("");
  const [schemeDiscount, setSchemeDiscount] = useState("");
  const [schemeValidity, setSchemeValidity] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("distributor");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [users, setUsers] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const [ordersData, stockData, schemesData, summary, usersData] = await Promise.all([
      getOrders(),
      getStockItemsByRole("management"),
      getSchemesFromApi(),
      getStockSummary("management"),
      getManagedUsers(),
    ]);
    setOrders(ordersData);
    setStock(stockData);
    setSchemes(schemesData);
    setStockSummary(summary);
    setUsers(usersData);
  };

  const handleApprove = async (id) => {
    await approveOrder(id);
    loadData();
  };

  const handleReject = async (id) => {
    await rejectOrder(id);
    loadData();
  };

  const handleDeleteOrder = async (id) => {
    await deleteOrderById(id);
    loadData();
  };

  const handleStockAdjust = async (id, delta) => {
    await adjustStock(id, delta, "management");
    loadData();
  };

  const handleCreateScheme = async (e) => {
    e.preventDefault();
    if (!schemeName || !schemeDiscount) return;
    await createScheme({
      name: schemeName,
      discount: parseFloat(schemeDiscount),
      validity: schemeValidity,
    });
    setSchemeName("");
    setSchemeDiscount("");
    setSchemeValidity("");
    loadData();
  };

  const handleDeleteScheme = async (id) => {
    await deleteScheme(id);
    loadData();
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setUserMessage("");
    try {
      await createUserAccount(userName, userRole, userEmail, userPassword);
      setUserName("");
      setUserRole("distributor");
      setUserEmail("");
      setUserPassword("");
      setUserMessage("User created successfully");
      loadData();
    } catch (error) {
      setUserMessage(error.message || "Failed to create user");
    }
  };

  const handleDeleteUser = async (id) => {
    await deleteUserAccount(id);
    loadData();
  };

  const distributorOrders = orders.filter((o) => o.fromRole === "distributor");
  const pendingCount = distributorOrders.filter((o) => o.status === "pending").length;
  const approvedCount = distributorOrders.filter((o) => o.status === "approved").length;
  const rejectedCount = distributorOrders.filter((o) => o.status === "rejected").length;

  const filteredOrders =
    filterStatus === "all"
      ? distributorOrders
      : distributorOrders.filter((o) => o.status === filterStatus);

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
      key: "linkedOrderId",
      label: "Type",
      render: (val) => val ? (
        <span className="statusBadge statusForwarded">Restock</span>
      ) : (
        <span className="statusBadge" style={{ background: "#f1f5f9", color: "var(--text-light)" }}>Direct</span>
      ),
    },
    {
      key: "status",
      label: "Status",
      render: (val) => (
        <span className={`statusBadge status${val.charAt(0).toUpperCase() + val.slice(1)}`}>
          {val}
        </span>
      ),
    },
    { key: "createdAt", label: "Date", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  const stockColumns = [
    { key: "name", label: "Item" },
    { key: "quantity", label: "Quantity" },
    { key: "price", label: "Price", render: (val) => `₹${val.toFixed(2)}` },
  ];

  const schemeColumns = [
    { key: "name", label: "Scheme Name" },
    { key: "discount", label: "Discount", render: (val) => `${val}%` },
    { key: "validity", label: "Valid Until", render: (val) => val || "No expiry" },
    { key: "createdAt", label: "Created", render: (val) => val ? new Date(val).toLocaleDateString() : "-" },
  ];

  const renderContent = () => {
    switch (activeFeature) {
      case "takeOrders":
        return (
          <div className="featureSection">
            <h2>Orders from Distributors</h2>
            <div className="filterTabs">
              {["all", "pending", "approved", "rejected"].map((status) => (
                <button
                  key={status}
                  className={`filterTab ${filterStatus === status ? "filterTabActive" : ""}`}
                  onClick={() => setFilterStatus(status)}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <Table
              columns={orderColumns}
              data={filteredOrders}
              onAction={(row) => {
                if (row.status === "pending") {
                  return (
                    <div style={{ display: "flex", gap: "6px" }}>
                      <Button variant="success" onClick={() => handleApprove(row.id)}>
                        Approve
                      </Button>
                      <Button variant="danger" onClick={() => handleReject(row.id)}>
                        Reject
                      </Button>
                    </div>
                  );
                }
                if (row.status === "approved") {
                  return (
                    <Button variant="danger" onClick={() => handleDeleteOrder(row.id)}>
                      Delete
                    </Button>
                  );
                }
                return null;
              }}
              emptyMessage="No orders found"
            />
          </div>
        );

      case "stock":
        return (
          <div className="featureSection">
            <h2>Stock Management</h2>
            <Table
              columns={[
                ...stockColumns,
                {
                  key: "actions",
                  label: "Adjust",
                  render: (_, row) => (
                    <div className="stockControls">
                      <button className="stockBtn" onClick={() => handleStockAdjust(row.id, -10)}>
                        −
                      </button>
                      <span style={{ minWidth: "40px", textAlign: "center", fontWeight: "600", fontSize: "13px" }}>{row.quantity}</span>
                      <button className="stockBtn" onClick={() => handleStockAdjust(row.id, 10)}>
                        +
                      </button>
                    </div>
                  ),
                },
              ]}
              data={stock}
            />
          </div>
        );

      case "schemes":
        return (
          <div className="featureSection">
            <h2>Create Schemes</h2>
            <form className="schemeForm" onSubmit={handleCreateScheme}>
              <div className="formGroup">
                <label>Scheme Name</label>
                <input
                  type="text"
                  placeholder="e.g. Summer Sale"
                  value={schemeName}
                  onChange={(e) => setSchemeName(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Discount (%)</label>
                <input
                  type="number"
                  placeholder="e.g. 15"
                  value={schemeDiscount}
                  onChange={(e) => setSchemeDiscount(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Valid Until</label>
                <input
                  type="date"
                  value={schemeValidity}
                  onChange={(e) => setSchemeValidity(e.target.value)}
                />
              </div>
              <Button type="submit" variant="primary">
                Create
              </Button>
            </form>
            <Table
              columns={[
                ...schemeColumns,
                {
                  key: "actions",
                  label: "Actions",
                  render: (_, row) => (
                    <Button variant="danger" onClick={() => handleDeleteScheme(row.id)}>
                      Delete
                    </Button>
                  ),
                },
              ]}
              data={schemes}
              emptyMessage="No schemes created yet"
            />
          </div>
        );

      case "users":
        return (
          <div className="featureSection">
            <h2>Create Distributor / Retailer User</h2>
            <form className="schemeForm" onSubmit={handleCreateUser}>
              <div className="formGroup">
                <label>Name</label>
                <input
                  type="text"
                  placeholder="Enter user name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Role</label>
                <select value={userRole} onChange={(e) => setUserRole(e.target.value)} required>
                  <option value="distributor">Distributor</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>
              <div className="formGroup">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
              </div>
              <div className="formGroup">
                <label>Password</label>
                <input
                  type="password"
                  placeholder="Set password"
                  value={userPassword}
                  onChange={(e) => setUserPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" variant="primary">
                Create User
              </Button>
            </form>
            {userMessage && (
              <p style={{ marginTop: "12px", color: userMessage.includes("successfully") ? "#059669" : "#dc2626" }}>
                {userMessage}
              </p>
            )}
            <h3 style={{ marginTop: "24px" }}>Created Users</h3>
            <Table
              columns={[
                { key: "id", label: "User ID" },
                { key: "name", label: "Name" },
                { key: "role", label: "Role" },
                { key: "email", label: "Email" },
                { key: "password", label: "Password" },
              ]}
              data={users}
              onAction={(row) => (
                <Button variant="danger" onClick={() => handleDeleteUser(row.id)}>
                  Delete
                </Button>
              )}
              emptyMessage="No users created yet"
            />
          </div>
        );

      case "monitor":
        return (
          <div className="featureSection">
            <h2>Monitor All Orders</h2>
            <Table
              columns={orderColumns}
              data={orders}
              onAction={(row) =>
                row.status === "approved" ? (
                  <Button variant="danger" onClick={() => handleDeleteOrder(row.id)}>
                    Delete
                  </Button>
                ) : null
              }
              emptyMessage="No orders to monitor"
            />
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
            <h1>Management Dashboard</h1>
            <p>Manage orders, stock, schemes, and monitor activity</p>
          </div>
        </div>

        <div className="cardGrid">
          <Card
            title="Distributor Orders"
            value={distributorOrders.length}
            variant="highlight"
          />
          <Card
            title="Pending Review"
            value={pendingCount}
            variant="warning"
          />
          <Card
            title="Approved"
            value={approvedCount}
            variant="success"
          />
          {stockSummary && (
            <Card
              title="Total Stock Value"
              value={`₹${stockSummary.totalValue.toFixed(2)}`}
              variant="highlight"
            />
          )}
        </div>

        {renderContent()}
      </main>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import Card from "@/components/Card";
import Table from "@/components/Table";
import Button from "@/components/Button";
import {
  createUserAccount,
  deleteUserAccount,
  getDistributorsForRetailerLink,
  getManagedUsers,
} from "@/services/userService";
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
import { getSummary } from "@/services/financeService";

export default function ManagementPage() {
  const [activeFeature, setActiveFeature] = useState("takeOrders");
  const [orders, setOrders] = useState([]);
  const [stock, setStock] = useState([]);
  const [schemes, setSchemes] = useState([]);
  const [stockSummary, setStockSummary] = useState(null);
  const [financeSummary, setFinanceSummary] = useState(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const [schemeName, setSchemeName] = useState("");
  const [schemeDiscount, setSchemeDiscount] = useState("");
  const [schemeValidity, setSchemeValidity] = useState("");
  const [userName, setUserName] = useState("");
  const [userRole, setUserRole] = useState("distributor");
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [selectedDistributorId, setSelectedDistributorId] = useState("");
  const [userMessage, setUserMessage] = useState("");
  const [userErrors, setUserErrors] = useState({});
  const [users, setUsers] = useState([]);
  const [distributors, setDistributors] = useState([]);
  const [distributorsLoading, setDistributorsLoading] = useState(false);
  const [distributorsError, setDistributorsError] = useState("");
  const [processingOrderIds, setProcessingOrderIds] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setDistributorsLoading(true);
    setDistributorsError("");
    try {
      const [ordersData, stockData, schemesData, summary, usersData, financeData, distributorsData] = await Promise.all([
        getOrders(),
        getStockItemsByRole("management"),
        getSchemesFromApi(),
        getStockSummary("management"),
        getManagedUsers(),
        getSummary("management"),
        getDistributorsForRetailerLink(),
      ]);
      setOrders(ordersData);
      setStock(stockData);
      setSchemes(schemesData);
      setStockSummary(summary);
      setUsers(usersData);
      setFinanceSummary(financeData);
      setDistributors(distributorsData || []);
    } catch (error) {
      setDistributorsError(error.message || "Failed to fetch distributors");
    } finally {
      setDistributorsLoading(false);
    }
  };

  const handleApprove = async (id) => {
    if (processingOrderIds.includes(id)) return;
    setProcessingOrderIds((prev) => [...prev, id]);
    try {
      await approveOrder(id);
      await loadData();
    } finally {
      setProcessingOrderIds((prev) => prev.filter((orderId) => orderId !== id));
    }
  };

  const handleReject = async (id) => {
    if (processingOrderIds.includes(id)) return;
    setProcessingOrderIds((prev) => [...prev, id]);
    try {
      await rejectOrder(id);
      await loadData();
    } finally {
      setProcessingOrderIds((prev) => prev.filter((orderId) => orderId !== id));
    }
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
    setUserErrors({});
    const nextErrors = {};
    if (!userName.trim()) nextErrors.name = "Name is required";
    if (!userEmail.trim()) nextErrors.email = "Email is required";
    if (!userPassword.trim()) nextErrors.password = "Password is required";
    if (userRole === "retailer" && !selectedDistributorId) {
      nextErrors.distributorId = "Please select a distributor";
    }
    if (Object.keys(nextErrors).length > 0) {
      setUserErrors(nextErrors);
      return;
    }
    try {
      await createUserAccount(
        userName,
        userRole,
        userEmail,
        userPassword,
        userRole === "retailer" ? Number(selectedDistributorId) : null
      );
      setUserName("");
      setUserRole("distributor");
      setUserEmail("");
      setUserPassword("");
      setSelectedDistributorId("");
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

  const getUserById = (id) => users.find((u) => Number(u.id) === Number(id));
  const getOrderFromLabel = (order) => {
    const user = getUserById(order.userId);
    if (user?.name) return `${user.name} (${order.fromRole})`;
    return order.fromRole;
  };
  const getOrderToLabel = (order) => {
    if (order.toRole === "management") return "Management";
    if (order.toRole === "distributor") {
      // Retailer order goes to selected distributor.
      const fromUser = getUserById(order.userId);
      const linkedDistributor = distributors.find(
        (d) => Number(d.id) === Number(fromUser?.distributorId)
      );
      if (linkedDistributor?.name) return `${linkedDistributor.name} (distributor)`;
    }
    return order.toRole;
  };

  const orderColumns = [
    { key: "id", label: "Order ID" },
    { key: "orderedBy", label: "Ordered By", render: (_, row) => getOrderFromLabel(row) },
    { key: "orderedTo", label: "Ordered To", render: (_, row) => getOrderToLabel(row) },
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
  const distributorUsers = users
    .filter((u) => u.role === "distributor")
    .map((u, idx) => ({ ...u, displayId: idx + 1 }));
  const retailerUsers = users
    .filter((u) => u.role === "retailer")
    .map((u, idx) => ({ ...u, displayId: idx + 1 }));
  const getDistributorNameForRetailer = (row) => {
    if (row.distributorName) return row.distributorName;
    const linked = distributors.find((d) => Number(d.id) === Number(row.distributorId));
    return linked?.name || "-";
  };

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
                      <Button
                        variant="success"
                        onClick={() => handleApprove(row.id)}
                        disabled={processingOrderIds.includes(row.id)}
                      >
                        {processingOrderIds.includes(row.id) ? "Processing..." : "Approve"}
                      </Button>
                      <Button
                        variant="danger"
                        onClick={() => handleReject(row.id)}
                        disabled={processingOrderIds.includes(row.id)}
                      >
                        {processingOrderIds.includes(row.id) ? "Processing..." : "Reject"}
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
                <select
                  value={userRole}
                  onChange={(e) => {
                    const nextRole = e.target.value;
                    setUserRole(nextRole);
                    setUserErrors((prev) => ({ ...prev, distributorId: undefined }));
                    if (nextRole !== "retailer") {
                      setSelectedDistributorId("");
                    }
                  }}
                  required
                >
                  <option value="distributor">Distributor</option>
                  <option value="retailer">Retailer</option>
                </select>
              </div>
              {userRole === "retailer" && (
                <div className="formGroup">
                  <label>Select Distributor</label>
                  <select
                    value={selectedDistributorId}
                    onChange={(e) => setSelectedDistributorId(e.target.value)}
                    disabled={distributorsLoading || distributors.length === 0}
                    required
                  >
                    <option value="">
                      {distributorsLoading ? "Loading distributors..." : "Select distributor"}
                    </option>
                    {distributors.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.email})
                      </option>
                    ))}
                  </select>
                  {distributors.length === 0 && !distributorsLoading && (
                    <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>
                      No distributors available. Please create a distributor first.
                    </p>
                  )}
                  {distributorsError && (
                    <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>
                      {distributorsError}
                    </p>
                  )}
                  {userErrors.distributorId && (
                    <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>
                      {userErrors.distributorId}
                    </p>
                  )}
                </div>
              )}
              <div className="formGroup">
                <label>Email</label>
                <input
                  type="email"
                  placeholder="user@company.com"
                  value={userEmail}
                  onChange={(e) => setUserEmail(e.target.value)}
                  required
                />
                {userErrors.email && (
                  <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>{userErrors.email}</p>
                )}
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
                {userErrors.password && (
                  <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>{userErrors.password}</p>
                )}
              </div>
              {userErrors.name && (
                <p style={{ marginTop: "6px", color: "#dc2626", fontSize: "13px" }}>{userErrors.name}</p>
              )}
              <Button
                type="submit"
                variant="primary"
                disabled={userRole === "retailer" && (distributorsLoading || distributors.length === 0)}
              >
                Create User
              </Button>
            </form>
            {userMessage && (
              <p style={{ marginTop: "12px", color: userMessage.includes("successfully") ? "#059669" : "#dc2626" }}>
                {userMessage}
              </p>
            )}
            <h3 style={{ marginTop: "24px" }}>Distributor Users</h3>
            <Table
              columns={[
                { key: "displayId", label: "User ID" },
                { key: "name", label: "Name" },
                { key: "role", label: "Role" },
                { key: "email", label: "Email" },
                { key: "password", label: "Password", render: () => "******" },
              ]}
              data={distributorUsers}
              onAction={(row) => (
                <Button variant="danger" onClick={() => handleDeleteUser(row.id)}>
                  Delete
                </Button>
              )}
              emptyMessage="No distributor users created yet"
            />

            <h3 style={{ marginTop: "24px" }}>Retailer Users</h3>
            <Table
              columns={[
                { key: "displayId", label: "User ID" },
                { key: "name", label: "Name" },
                { key: "role", label: "Role" },
                {
                  key: "distributorName",
                  label: "Under Distributor",
                  render: (_, row) => getDistributorNameForRetailer(row),
                },
                { key: "email", label: "Email" },
                { key: "password", label: "Password", render: () => "******" },
              ]}
              data={retailerUsers}
              onAction={(row) => (
                <Button variant="danger" onClick={() => handleDeleteUser(row.id)}>
                  Delete
                </Button>
              )}
              emptyMessage="No retailer users created yet"
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

        <div className="cardGrid cardGridManagement">
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
          {financeSummary && (
            <Card
              title="Net Profit"
              value={`Rs ${financeSummary.profit.toFixed(2)}`}
              variant={financeSummary.profit >= 0 ? "success" : "danger"}
            />
          )}
        </div>

        {renderContent()}
      </main>
    </>
  );
}


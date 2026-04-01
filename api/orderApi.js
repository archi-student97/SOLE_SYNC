import { httpClient } from "@/api/httpClient";

export async function fetchOrders() {
  try {
    return await httpClient.get("/orders");
  } catch {
    return [];
  }
}

export async function createOrder(order) {
  try {
    return await httpClient.post("/orders", order);
  } catch {
    return null;
  }
}

export async function updateOrderStatus(orderId, status) {
  try {
    return await httpClient.patch(`/orders/${orderId}/status`, { status });
  } catch {
    return null;
  }
}

export async function deleteOrder(orderId) {
  try {
    await httpClient.delete(`/orders/${orderId}`);
  } catch {
    return;
  }
}

export async function fetchOrdersByStatus(status) {
  try {
    return await httpClient.get(`/orders/status/${status}`);
  } catch {
    return [];
  }
}

export async function fetchOrdersByRole(role) {
  try {
    return await httpClient.get(`/orders/role/${role}`);
  } catch {
    return [];
  }
}

export async function approveOrderByDistributorApi(orderId) {
  try {
    return await httpClient.post(`/orders/${orderId}/approve-distributor`, {});
  } catch {
    return { success: false, reason: "backend_unavailable" };
  }
}

export async function requestRestockFromManagementApi(orderId, payload) {
  try {
    return await httpClient.post(`/orders/${orderId}/request-restock`, payload);
  } catch {
    return null;
  }
}

export async function approveOrderByManagementApi(orderId) {
  try {
    return await httpClient.post(`/orders/${orderId}/approve-management`, {});
  } catch {
    return null;
  }
}

export async function rejectOrderApi(orderId) {
  try {
    return await httpClient.post(`/orders/${orderId}/reject`, {});
  } catch {
    return null;
  }
}

export async function forwardOrderToManagementApi(orderId) {
  try {
    return await httpClient.post(`/orders/${orderId}/forward`, {});
  } catch {
    return null;
  }
}

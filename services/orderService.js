import {
  approveOrderByDistributorApi,
  approveOrderByManagementApi,
  fetchOrders,
  fetchOrdersByRole,
  fetchOrdersByStatus,
  forwardOrderToManagementApi,
  rejectOrderApi,
  requestRestockFromManagementApi,
  createOrder,
  deleteOrder as deleteOrderApi,
} from "@/api/orderApi";
import { ORDER_STATUS } from "@/utils/constants";

export async function getOrders() {
  return await fetchOrders();
}

export async function getOrdersByStatus(status) {
  return await fetchOrdersByStatus(status);
}

export async function getOrdersByRole(role) {
  return await fetchOrdersByRole(role);
}

export async function placeOrder(orderData) {
  const order = await createOrder({
    ...orderData,
    status: ORDER_STATUS.PENDING,
  });
  return order;
}

export async function approveOrderByDistributor(orderId) {
  return await approveOrderByDistributorApi(orderId);
}

export async function requestRestockFromManagement(orderId, orderData) {
  return await requestRestockFromManagementApi(orderId, orderData);
}

export async function approveOrder(orderId) {
  return await approveOrderByManagementApi(orderId);
}

export async function rejectOrder(orderId) {
  return await rejectOrderApi(orderId);
}

export async function forwardOrderToManagement(orderId) {
  return await forwardOrderToManagementApi(orderId);
}

export async function deleteOrderById(orderId) {
  return await deleteOrderApi(orderId);
}

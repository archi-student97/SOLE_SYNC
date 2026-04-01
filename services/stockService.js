import {
  addStockItem,
  adjustStockByDelta,
  checkAvailability,
  deductStockItem,
  fetchStock,
  fetchStockSummary,
  updateStockItem,
} from "@/api/stockApi";

export async function getStockItems() {
  return await fetchStock("management");
}

export async function getStockItemsByRole(role) {
  return await fetchStock(role);
}

export async function adjustStock(id, delta, role = "management") {
  return await adjustStockByDelta(id, delta, role);
}

export async function checkStockAvailability(itemName, quantity, role = "management") {
  return await checkAvailability(itemName, quantity, role);
}

export async function deductStock(itemName, quantity, role = "management") {
  return await deductStockItem(itemName, quantity, role);
}

export async function getStockSummary(role = "management") {
  return await fetchStockSummary(role);
}

export async function addNewStockItem(item) {
  return await addStockItem(item);
}

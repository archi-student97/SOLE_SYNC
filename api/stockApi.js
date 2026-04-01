import { httpClient } from "@/api/httpClient";

export async function fetchStock(role = "management") {
  try {
    return await httpClient.get(`/stock?role=${encodeURIComponent(role)}`);
  } catch {
    return [];
  }
}

export async function updateStockItem(id, updates, role = "management") {
  try {
    return await httpClient.patch(`/stock/${id}?role=${encodeURIComponent(role)}`, updates);
  } catch {
    return null;
  }
}

export async function addStockItem(item) {
  try {
    return await httpClient.post("/stock", item);
  } catch {
    return null;
  }
}

export async function fetchSchemes() {
  try {
    return await httpClient.get("/schemes");
  } catch {
    return [];
  }
}

export async function createScheme(scheme) {
  try {
    return await httpClient.post("/schemes", scheme);
  } catch {
    return null;
  }
}

export async function deleteScheme(id) {
  try {
    await httpClient.delete(`/schemes/${id}`);
  } catch {
    return;
  }
}

export async function fetchLoyalty() {
  try {
    return await httpClient.get("/loyalty");
  } catch {
    return { distributor: 0, retailer: 0 };
  }
}

export async function updateLoyalty(role, points) {
  try {
    return await httpClient.post("/loyalty/update", { role, points });
  } catch {
    return { distributor: 0, retailer: 0 };
  }
}

export async function fetchFinance() {
  try {
    return await httpClient.get("/finance");
  } catch {
    return { revenue: 0, expenses: 0, transactions: [] };
  }
}

export async function fetchFinanceSummary() {
  try {
    return await httpClient.get("/finance/summary");
  } catch {
    return { revenue: 0, expenses: 0, profit: 0, transactions: [] };
  }
}

export async function adjustStockByDelta(id, delta, role = "management") {
  try {
    return await httpClient.post(`/stock/${id}/adjust`, { delta, role });
  } catch {
    return null;
  }
}

export async function fetchStockSummary(role = "management") {
  try {
    return await httpClient.get(`/stock/summary?role=${encodeURIComponent(role)}`);
  } catch {
    return { totalItems: 0, totalValue: 0, itemCount: 0 };
  }
}

export async function checkAvailability(itemName, quantity, role = "management") {
  try {
    const query = `itemName=${encodeURIComponent(itemName)}&quantity=${quantity}&role=${encodeURIComponent(role)}`;
    return await httpClient.get(`/stock/check-availability?${query}`);
  } catch {
    return { available: false, stockItem: null };
  }
}

export async function deductStockItem(itemName, quantity, role = "management") {
  try {
    return await httpClient.post("/stock/deduct", { itemName, quantity, role });
  } catch {
    return null;
  }
}

import { fetchFinance, fetchFinanceSummary } from "@/api/stockApi";

export async function getFinanceData() {
  return await fetchFinance();
}

export async function getRevenue() {
  const finance = await fetchFinance();
  return finance.revenue;
}

export async function getExpenses() {
  const finance = await fetchFinance();
  return finance.expenses;
}

export async function getSummary() {
  return await fetchFinanceSummary();
}

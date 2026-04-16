import { httpClient } from "@/api/httpClient";

const API_CONFIG = {
  BASE_URL:
    process.env.NEXT_PUBLIC_API_BASE_URL ||
    (process.env.NODE_ENV === "development"
      ? "http://localhost:8070/api/v1"
      : "/_backend/api/v1"),
  TIMEOUT: 5000,
};

export async function initStorage() {
  try {
    await httpClient.post("/system/init", {});
  } catch (error) {
    console.error("Backend init failed:", error);
  }
}

export { API_CONFIG };

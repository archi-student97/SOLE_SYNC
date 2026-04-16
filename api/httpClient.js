import { getData } from "@/lib/storage";
import { STORAGE_KEYS } from "@/utils/constants";

function resolveApiBaseUrl() {
  const serviceBase = process.env.NEXT_PUBLIC_BACKEND_URL?.trim();
  const envBase = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  const isProd = process.env.NODE_ENV === "production";

  if (isProd && serviceBase) {
    return `${serviceBase}/api/v1`;
  }

  if (envBase) {
    const looksLikeLocalhost =
      envBase.includes("localhost") || envBase.includes("127.0.0.1");
    if (!(isProd && looksLikeLocalhost)) {
      return envBase;
    }
  }

  return isProd ? "/_backend/api/v1" : "http://localhost:8070/api/v1";
}

const API_BASE_URL = resolveApiBaseUrl();

function getAuthToken() {
  const auth = getData(STORAGE_KEYS.AUTH);
  return auth?.token || null;
}

async function request(path, options = {}) {
  const token = getAuthToken();
  const headers = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  } catch {
    throw new Error(
      `Cannot connect to backend at ${API_BASE_URL}. Start FastAPI server and check NEXT_PUBLIC_API_BASE_URL.`
    );
  }

  let data = null;
  let rawText = "";
  try {
    data = await response.json();
  } catch {
    try {
      rawText = await response.text();
    } catch {
      rawText = "";
    }
  }

  if (!response.ok) {
    const message =
      data?.detail ||
      data?.message ||
      rawText ||
      `Request failed (${response.status}) for ${path}`;
    throw new Error(message);
  }
  return data;
}

export const httpClient = {
  get: (path) => request(path),
  post: (path, body) =>
    request(path, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  patch: (path, body) =>
    request(path, {
      method: "PATCH",
      body: JSON.stringify(body),
    }),
  delete: (path) =>
    request(path, {
      method: "DELETE",
    }),
};

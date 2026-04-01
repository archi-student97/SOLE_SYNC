import { httpClient } from "@/api/httpClient";
import { getData, removeData, setData } from "@/lib/storage";
import { STORAGE_KEYS } from "@/utils/constants";

export async function fetchUsers() {
  return await httpClient.get("/users");
}

export async function authenticateUser(email, password) {
  try {
    const response = await httpClient.post("/login", { email, password });
    if (response.success) {
      setData(STORAGE_KEYS.AUTH, {
        isLoggedIn: true,
        user: response.user,
        token: response.access_token,
      });
      return { success: true, user: response.user };
    }
    return { success: false, error: response.error || "Invalid email or password" };
  } catch (error) {
    return { success: false, error: error.message || "Login failed" };
  }
}

export async function getAuthState() {
  const auth = getData(STORAGE_KEYS.AUTH);
  if (!auth?.token) {
    return { isLoggedIn: false, user: null };
  }

  try {
    const user = await httpClient.get("/auth/me");
    const updated = { isLoggedIn: true, user, token: auth.token };
    setData(STORAGE_KEYS.AUTH, updated);
    return updated;
  } catch {
    removeData(STORAGE_KEYS.AUTH);
    return { isLoggedIn: false, user: null };
  }
}

export async function logoutUser() {
  removeData(STORAGE_KEYS.AUTH);
}

export async function createUser(name, role, email, password) {
  return await httpClient.post("/users", { name, role, email, password });
}

export async function forgotPassword(email, newPassword) {
  return await httpClient.post("/forgot-password", {
    email,
    new_password: newPassword,
  });
}

export async function deleteUser(userId) {
  return await httpClient.delete(`/users/${userId}`);
}

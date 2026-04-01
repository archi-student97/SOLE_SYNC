import {
  authenticateUser,
  createUser,
  deleteUser,
  fetchUsers,
  forgotPassword,
  getAuthState,
  logoutUser,
} from "@/api/userApi";

export async function authenticate(email, password) {
  return await authenticateUser(email, password);
}

export async function getCurrentUser() {
  const auth = await getAuthState();
  return auth.user;
}

export async function isLoggedIn() {
  const auth = await getAuthState();
  return auth.isLoggedIn;
}

export async function logout() {
  await logoutUser();
}

export async function createUserAccount(name, role, email, password) {
  return await createUser(name, role, email, password);
}

export async function resetPassword(email, newPassword) {
  return await forgotPassword(email, newPassword);
}

export async function getManagedUsers() {
  return await fetchUsers();
}

export async function deleteUserAccount(userId) {
  return await deleteUser(userId);
}

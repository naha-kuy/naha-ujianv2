import users from "../models/users";

const STORAGE_KEY = "auth_user";

export function login(username, password) {
  const user = users.find(
    (u) => u.username === username && u.password === password
  );
  if (user) {
    const session = { username: user.username, role: user.role, name: user.name };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }
  return { success: false, message: "Username atau password salah" };
}

export function logout() {
  localStorage.removeItem(STORAGE_KEY);
}

export function getCurrentUser() {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;
  return JSON.parse(raw);
}

export function isAuthenticated() {
  return getCurrentUser() !== null;
}

export function hasRole(role) {
  const user = getCurrentUser();
  return user && user.role === role;
}

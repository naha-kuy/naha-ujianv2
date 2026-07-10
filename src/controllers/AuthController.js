import users from "../models/users";
import supabase from "../models/supabaseClient";

const STORAGE_KEY = "auth_user";

export async function login(username, password) {
  // 1. Try hardcoded demo users first
  const localUser = users.find(
    (u) => u.username === username && u.password === password
  );
  if (localUser) {
    const session = { username: localUser.username, role: localUser.role, name: localUser.name, provider: "local" };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  // 2. Try Supabase authentication
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });

    if (authError) {
      // Try username-based login with custom approach
      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("*")
        .eq("username", username)
        .single();

      if (userError || !userData) {
        return { success: false, message: "Username atau password salah" };
      }

      const email = `${username}@app.local`;

      const { data: retryData, error: retryError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (retryError) {
        return { success: false, message: "Username atau password salah" };
      }

      const session = {
        id: userData.id,
        username: userData.username,
        role: userData.role,
        name: userData.name,
        provider: "supabase",
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
      return { success: true, user: session };
    }

    // Fetch profile from Supabase
    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    const session = {
      id: authData.user.id,
      username: profile?.username || username,
      role: profile?.role || "siswa",
      name: profile?.name || username,
      provider: "supabase",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan koneksi" };
  }
}

export async function register({ username, password, name, role }) {
  try {
    const email = `${username}@app.local`;

    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role, name },
      },
    });

    if (authError) {
      if (authError.message.includes("already")) {
        return { success: false, message: "Username/email sudah terdaftar" };
      }
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      return { success: false, message: "Gagal mendaftar, coba lagi" };
    }

    return {
      success: true,
      message: "Pendaftaran berhasil! Silakan login.",
    };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan koneksi" };
  }
}

export async function logout() {
  localStorage.removeItem(STORAGE_KEY);
  await supabase.auth.signOut();
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

import users from "../models/users";
import supabase from "../models/supabaseClient";

const STORAGE_KEY = "auth_user";

export async function login(username, password) {
  // 1. Try hardcoded demo users first
  const localUser = users.find(
    (u) => u.username === username && u.password === password
  );
  if (localUser) {
    const session = {
      username: localUser.username,
      role: localUser.role,
      name: localUser.name,
      provider: "local",
    };
    await supabase.auth
      .signInWithPassword({ email: `${username}@app.local`, password })
      .catch(() => {});
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  }

  // 2. Try Supabase authentication
  try {
    let authResult = null;
    let lastError = null;

    const r1 = await supabase.auth.signInWithPassword({
      email: username,
      password,
    });
    if (!r1.error) {
      authResult = r1;
    } else {
      lastError = r1.error;
    }

    if (!authResult?.data?.user) {
      const r2 = await supabase.auth.signInWithPassword({
        email: `${username}@app.local`,
        password,
      });
      if (!r2.error) {
        authResult = r2;
      } else {
        lastError = r2.error;
      }
    }

    if (!authResult?.data?.user) {
      const { data: email } = await supabase.rpc("get_email_by_username", {
        p_username: username,
      });
      if (email) {
        const r3 = await supabase.auth.signInWithPassword({ email, password });
        if (!r3.error) {
          authResult = r3;
        } else {
          lastError = r3.error;
        }
      }
    }

    if (!authResult?.data?.user) {
      if (lastError?.message?.toLowerCase().includes("email not confirmed")) {
        return {
          success: false,
          message:
            "Email belum diverifikasi. Silakan cek email Anda (termasuk folder spam).",
        };
      }
      return { success: false, message: "Username atau password salah" };
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", authResult.data.user.id)
      .single();

    if (!profile) {
      await supabase.auth.signOut();
      return { success: false, message: "Profil tidak ditemukan. Hubungi admin." };
    }

    // Check approval status for non-admin users
    if (profile.role !== "admin") {
      if (profile.status === "pending") {
        await supabase.auth.signOut();
        const roleLabel = profile.role === "guru" ? "guru" : "siswa";
        return {
          success: false,
          message: `Akun ${roleLabel} Anda sedang menunggu persetujuan admin.`,
          action: {
            type: "whatsapp",
            phone: "6282334157792",
            text:
              profile.role === "guru"
                ? `Halo Admin, saya ${profile.name} (${profile.username}) telah mendaftar sebagai guru. Mohon persetujuannya. Terima kasih.`
                : `Halo Admin, saya ${profile.name} (${profile.username}) telah mendaftar sebagai siswa. Mohon persetujuannya. Terima kasih.`,
          },
        };
      }
      if (profile.status === "rejected") {
        await supabase.auth.signOut();
        return {
          success: false,
          message: "Pendaftaran ditolak. Silakan daftar ulang dengan akun berbeda.",
          action: {
            type: "whatsapp",
            phone: "6282334157792",
            text: `Halo Admin, saya ${profile.name} (${profile.username}) ingin menanyakan penolakan pendaftaran akun saya. Mohon informasinya. Terima kasih.`,
          },
        };
      }
    }

    const session = {
      id: profile.id,
      username: profile.username,
      role: profile.role,
      name: profile.name,
      provider: "supabase",
    };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    return { success: true, user: session };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan koneksi" };
  }
}

export async function register({ username, email, password, name, role, ...extra }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { username, role, name, ...extra },
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        return { success: false, message: "Email sudah terdaftar" };
      }
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      return { success: false, message: "Gagal mendaftar, coba lagi" };
    }

    return {
      success: true,
      message:
        "Pendaftaran berhasil! Silakan cek email (termasuk folder spam) untuk verifikasi, lalu tunggu persetujuan admin.",
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

// --- Admin: User Approvals ---

export async function getPendingUsers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .neq("role", "admin")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      return {
        success: false,
        message:
          "Akses ditolak. Admin harus login dengan akun Supabase yang memiliki role admin. " +
          "Coba logout lalu login ulang menggunakan kredensial admin.",
      };
    }
    return { success: false, message: error.message };
  }
  return { success: true, data };
}

export async function approveUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function rejectUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "rejected" })
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

// --- Admin: Teacher Management ---

export async function getPendingTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "guru")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      return { success: false, message: "Akses ditolak. Login dengan akun admin." };
    }
    return { success: false, message: error.message };
  }
  return { success: true, data: data || [] };
}

export async function getRegisteredTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "guru")
    .eq("status", "approved")
    .order("name", { ascending: true });

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      return { success: false, message: "Akses ditolak. Login dengan akun admin." };
    }
    return { success: false, message: error.message };
  }
  return { success: true, data: data || [] };
}

export async function deleteUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (error) {
    return { success: false, message: error.message };
  }
  return { success: true };
}

export async function updateUser(userId, updates) {
  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", userId);

  if (error) {
    if (error.message?.toLowerCase().includes("duplicate")) {
      return { success: false, message: "Username sudah digunakan" };
    }
    return { success: false, message: error.message };
  }
  return { success: true };
}

// --- Profile Update Functions ---

export async function updateProfile({ name, username, student_class, student_group }) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (username !== undefined) updates.username = username;
  if (student_class !== undefined) updates.student_class = student_class;
  if (student_group !== undefined) updates.student_group = student_group;

  const { error } = await supabase
    .from("profiles")
    .update(updates)
    .eq("id", user.id);

  if (error) {
    if (error.message?.toLowerCase().includes("duplicate")) {
      return { success: false, message: "Username sudah digunakan" };
    }
    if (error.message?.toLowerCase().includes("row level security")) {
      return { success: false, message: "Akses ditolak. Silakan login ulang." };
    }
    return { success: false, message: error.message };
  }

  // Update local session
  const updated = { ...user, ...updates };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return { success: true, user: updated };
}

export async function changePassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "Password baru minimal 6 karakter" };
  }

  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // For local demo users, simulate password change
  if (user.provider === "local") {
    return { success: true, message: "Password berhasil diubah (mode demo)" };
  }

  // For Supabase users, re-authenticate then update
  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: `${user.username}@app.local`,
    password: currentPassword,
  });

  if (signInError) {
    return { success: false, message: "Password lama salah" };
  }

  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  return { success: true, message: "Password berhasil diubah" };
}

export async function getProfile() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  if (user.provider === "local") {
    return { success: true, data: user };
  }

  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error) {
    return { success: false, message: error.message };
  }

  return { success: true, data };
}

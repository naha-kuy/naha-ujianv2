import supabase from "../models/supabaseClient";

const STORAGE_KEY = "auth_user";
const PENDING_KEY = "pending_verification";

// ── Pending Registration (belum konfirmasi email) ──

export function savePendingRegistration(data) {
  const list = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  const filtered = list.filter((item) => item.username !== data.username);
  filtered.push({ ...data, timestamp: Date.now() });
  localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
}

export function checkPendingRegistration(username) {
  const list = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  return list.find((item) => item.username === username) || null;
}

export function clearPendingRegistration(username) {
  const list = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  const filtered = list.filter((item) => item.username !== username);
  localStorage.setItem(PENDING_KEY, JSON.stringify(filtered));
}

// Hapus data pending yang sudah kadaluwarsa (> 24 jam)
export function cleanExpiredPending() {
  const list = JSON.parse(localStorage.getItem(PENDING_KEY) || "[]");
  const now = Date.now();
  const active = list.filter((item) => now - item.timestamp < 86400000);
  localStorage.setItem(PENDING_KEY, JSON.stringify(active));
}

// ── RPC: ambil profile berdasarkan username (bypass RLS, tanpa autentikasi) ──
async function getProfileByUsername(username) {
  const { data } = await supabase.rpc("admin_get_profile_by_username", {
    p_username: username,
  });
  return data || null; // JSONB object atau null
}

export async function login(username, password) {
  cleanExpiredPending();

  try {
    // Langkah 1: Ambil profile dari database berdasarkan username
    const profile = await getProfileByUsername(username);

    if (!profile) {
      // Tidak ada di tabel profiles → coba anggap input sebagai email langsung
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: username,
        password,
      });

      if (authError) {
        if (authError.message?.toLowerCase().includes("email not confirmed")) {
          const pending = checkPendingRegistration(username);
          if (pending) {
            return {
              success: false,
              message: `Akun Anda belum diverifikasi. Silakan buka email (${pending.email}) dan klik tautan konfirmasi, lalu coba login kembali.`,
              action: { type: "gmail" },
            };
          }
          return {
            success: false,
            message: "Email belum diverifikasi. Silakan cek email Anda (termasuk folder spam).",
          };
        }
        return { success: false, message: "Username atau password salah" };
      }

      // Berhasil login via email langsung → ambil profile via id
      const { data: profileById } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", authData.user.id)
        .single();

      if (!profileById) {
        await supabase.auth.signOut();
        return { success: false, message: "Profil tidak ditemukan. Hubungi admin." };
      }

      return await _finalizeLogin(profileById);
    }

    // Langkah 2: Verifikasi password plaintext dari kolom profiles.password
    if (!profile.password || profile.password !== password) {
      return { success: false, message: "Username atau password salah" };
    }

    // Langkah 3: Cek status sebelum lanjut ke Supabase Auth
    if (profile.role !== "admin") {
      if (profile.status === "pending") {
        const pending = checkPendingRegistration(username);
        const roleLabel = profile.role === "guru" ? "guru" : "siswa";
        if (pending) {
          return {
            success: false,
            message: `Akun ${roleLabel} Anda belum diverifikasi. Silakan buka email (${pending.email}) dan klik tautan konfirmasi, lalu coba login kembali.`,
            action: { type: "gmail" },
          };
        }
        return {
          success: false,
          message: `Akun ${roleLabel} Anda sedang menunggu persetujuan admin.`,
          action: {
            type: "whatsapp",
            phone: import.meta.env.VITE_ADMIN_WHATSAPP || "6282334157792",
            text:
              profile.role === "guru"
                ? `Halo Admin, saya ${profile.name} (${profile.username}) telah mendaftar sebagai guru. Mohon persetujuannya. Terima kasih.`
                : `Halo Admin, saya ${profile.name} (${profile.username}) telah mendaftar sebagai siswa. Mohon persetujuannya. Terima kasih.`,
          },
        };
      }
      if (profile.status === "rejected") {
        return {
          success: false,
          message: "Pendaftaran ditolak. Silakan daftar ulang dengan akun berbeda.",
          action: {
            type: "whatsapp",
            phone: import.meta.env.VITE_ADMIN_WHATSAPP || "6282334157792",
            text: `Halo Admin, saya ${profile.name} (${profile.username}) ingin menanyakan penolakan pendaftaran akun saya. Mohon informasinya. Terima kasih.`,
          },
        };
      }
    }

    // Langkah 4: Sign in ke Supabase Auth untuk mendapatkan session valid (diperlukan RLS)
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: profile.email,
      password,
    });

    if (signInError) {
      // Email belum dikonfirmasi di Supabase Auth
      if (signInError.message?.toLowerCase().includes("email not confirmed")) {
        const pending = checkPendingRegistration(username);
        if (pending) {
          return {
            success: false,
            message: `Akun Anda belum diverifikasi. Silakan buka email (${profile.email}) dan klik tautan konfirmasi, lalu coba login kembali.`,
            action: { type: "gmail" },
          };
        }
        return {
          success: false,
          message: "Email belum diverifikasi. Silakan cek email Anda (termasuk folder spam).",
        };
      }
      return { success: false, message: "Gagal autentikasi. Hubungi admin." };
    }

    // Login sukses → hapus pending registration (jika ada)
    clearPendingRegistration(profile.username);

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

// Helper: finalize login setelah auth berhasil (untuk path login via email langsung)
async function _finalizeLogin(profile) {
  if (profile.role !== "admin") {
    if (profile.status === "pending") {
      await supabase.auth.signOut();
      const roleLabel = profile.role === "guru" ? "guru" : "siswa";
      return {
        success: false,
        message: `Akun ${roleLabel} Anda sedang menunggu persetujuan admin.`,
        action: {
          type: "whatsapp",
          phone: import.meta.env.VITE_ADMIN_WHATSAPP || "6282334157792",
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
          phone: import.meta.env.VITE_ADMIN_WHATSAPP || "6282334157792",
          text: `Halo Admin, saya ${profile.name} (${profile.username}) ingin menanyakan penolakan pendaftaran akun saya. Mohon informasinya. Terima kasih.`,
        },
      };
    }
  }

  clearPendingRegistration(profile.username);
  const session = {
    id: profile.id,
    username: profile.username,
    role: profile.role,
    name: profile.name,
    provider: "supabase",
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  return { success: true, user: session };
}

export async function register({ username, email, password, name, role, ...extra }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // Kirim password plaintext via metadata → trigger handle_new_user simpan ke profiles
        data: { username, role, name, password, ...extra },
        emailRedirectTo: import.meta.env.VITE_EMAIL_REDIRECT_URL || "https://tesmathematalk.vercel.app/",
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

    // Tunggu trigger handle_new_user selesai membuat profile
    const uid = authData.user.id;
    let profileCreated = false;
    for (let i = 0; i < 10; i++) {
      await new Promise((r) => setTimeout(r, 600));
      const { data: p } = await supabase.from("profiles").select("id").eq("id", uid).maybeSingle();
      if (p) { profileCreated = true; break; }
    }

    if (!profileCreated && authData.session) {
      // Fallback: insert manual jika trigger gagal (hanya saat email confirmation disabled)
      await supabase.from("profiles").insert({
        id: uid, username, email, role,
        name: name || username,
        password,
        kelas: extra.kelas || null,
        jurusan: extra.jurusan || null,
        nama_sekolah: extra.nama_sekolah || null,
        mata_pelajaran: extra.mata_pelajaran || null,
        catatan_pendaftaran: extra.catatan_pendaftaran || null,
        status: role === "admin" || role === "siswa" ? "approved" : "pending",
      }).then(() => {}).catch(() => {});
    }

    // Auto-approve siswa
    if (role === "siswa") {
      await supabase.from("profiles").update({ status: "approved" }).eq("id", uid).then(() => {}).catch(() => {});
    }

    savePendingRegistration({ username, email, name, role });

    const msg = role === "siswa"
      ? "Pendaftaran berhasil! Silakan cek email (termasuk folder spam) untuk verifikasi, lalu Anda bisa login."
      : "Pendaftaran berhasil! Silakan cek email (termasuk folder spam) untuk verifikasi, lalu tunggu persetujuan admin.";

    return { success: true, message: msg, role };
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
    if (error.message?.toLowerCase().includes("row level security")) {
      const { data, error: rpcErr } = await supabase.rpc("admin_approve_user", { p_user_id: userId });
      if (!rpcErr && data) return { success: true };
      return { success: false, message: "Akses ditolak. Login dengan akun admin." };
    }
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
    if (error.message?.toLowerCase().includes("row level security")) {
      const { data, error: rpcErr } = await supabase.rpc("admin_reject_user", { p_user_id: userId });
      if (!rpcErr && data) return { success: true };
      return { success: false, message: "Akses ditolak. Login dengan akun admin." };
    }
    return { success: false, message: error.message };
  }
  return { success: true };
}

// --- Admin: Teacher Management ---

async function tryRPC(fn, ...args) {
  try {
    const { data, error } = await supabase.rpc(fn, ...args);
    if (error) return { success: false, message: error.message };
    return { success: true, data };
  } catch {
    return { success: false, message: "Gagal memuat data" };
  }
}

export async function getPendingTeachers() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "guru")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) {
    if (error.message?.toLowerCase().includes("row level security")) {
      const rpc = await tryRPC("admin_get_pending_teachers");
      if (rpc.success) return { success: true, data: rpc.data || [] };
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
      const rpc = await tryRPC("admin_get_registered_teachers");
      if (rpc.success) return { success: true, data: rpc.data || [] };
      return { success: false, message: "Akses ditolak. Login dengan akun admin." };
    }
    return { success: false, message: error.message };
  }
  return { success: true, data: data || [] };
}

export async function getRegisteredStudents() {
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .eq("role", "siswa")
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
  const { error: profileError } = await supabase
    .from("profiles")
    .delete()
    .eq("id", userId);

  if (profileError) {
    return { success: false, message: profileError.message };
  }

  // Note: Auth user deletion requires service_role key (server-side).
  // Profile deletion cascades to related data (jawaban_siswa, nilai, etc.)
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

// --- Admin: Student Management ---

export async function createStudent({ name, username, password, email, kelas, jurusan, student_group }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email || `${username}@student.local`,
      password,
      options: {
        data: {
          username,
          role: "siswa",
          name,
          password, // disimpan ke profiles.password via trigger handle_new_user
          kelas: kelas || null,
          jurusan: jurusan || null,
          student_group: student_group || null,
        },
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        return { success: false, message: "Username atau email sudah terdaftar" };
      }
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      return { success: false, message: "Gagal membuat akun, coba lagi" };
    }

    // Auto-approve + pastikan password plaintext tersimpan di profiles
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ status: "approved", password })
        .eq("id", authData.user.id);

      if (!updateError) break;
      if (i === maxRetries - 1) {
        return { success: false, message: "Akun dibuat tapi gagal auto-approve. Approve manual di halaman Guru." };
      }
    }

    return { success: true, data: { id: authData.user.id, name, username, role: "siswa" } };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan koneksi" };
  }
}

// --- Admin: Teacher Management ---

export async function createTeacher({ name, username, password, email, mata_pelajaran }) {
  try {
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email: email || `${username}@teacher.local`,
      password,
      options: {
        data: {
          username,
          role: "guru",
          name,
          password, // disimpan ke profiles.password via trigger handle_new_user
          mata_pelajaran: mata_pelajaran || null,
        },
      },
    });

    if (authError) {
      if (authError.message?.toLowerCase().includes("already")) {
        return { success: false, message: "Username atau email sudah terdaftar" };
      }
      return { success: false, message: authError.message };
    }

    if (!authData.user) {
      return { success: false, message: "Gagal membuat akun, coba lagi" };
    }

    // Pastikan password plaintext tersimpan (trigger mungkin sudah handle, tapi update untuk pasti)
    const maxRetries = 10;
    for (let i = 0; i < maxRetries; i++) {
      await new Promise((r) => setTimeout(r, 500));
      const { error: updateError } = await supabase
        .from("profiles")
        .update({ password })
        .eq("id", authData.user.id);

      if (!updateError) break;
    }

    return { success: true, data: { id: authData.user.id, name, username, role: "guru" } };
  } catch (err) {
    return { success: false, message: "Terjadi kesalahan koneksi" };
  }
}

export async function approveNewUser(userId) {
  const { error } = await supabase
    .from("profiles")
    .update({ status: "approved" })
    .eq("id", userId);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// --- Profile Update Functions ---

export async function updateProfile({ name, username, student_group, kelas }) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const updates = {};
  if (name !== undefined) updates.name = name;
  if (username !== undefined) updates.username = username;
  if (kelas !== undefined) updates.kelas = kelas;
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
  const updated = { ...user };
  if (name !== undefined) updated.name = name;
  if (username !== undefined) updated.username = username;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));

  return { success: true, user: updated };
}

export async function changePassword(currentPassword, newPassword) {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, message: "Password baru minimal 6 karakter" };
  }

  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // Verifikasi password lama lewat plaintext di profiles terlebih dahulu
  const { data: profileData } = await supabase
    .from("profiles")
    .select("password, email")
    .eq("id", user.id)
    .single();

  if (!profileData) {
    return { success: false, message: "Akun tidak ditemukan. Silakan login ulang." };
  }

  if (profileData.password !== currentPassword) {
    return { success: false, message: "Password lama salah" };
  }

  // Update password di Supabase Auth
  const { error: updateError } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (updateError) {
    return { success: false, message: updateError.message };
  }

  // Simpan password plaintext baru ke tabel profiles
  await supabase.from("profiles").update({ password: newPassword }).eq("id", user.id);

  return { success: true, message: "Password berhasil diubah" };
}

export async function getProfile() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

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

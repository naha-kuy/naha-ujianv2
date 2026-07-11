import supabase from "../models/supabaseClient";
import { getCurrentUser } from "./AuthController";

const MAPEL_MAP = {
  matematika: "MTK", biologi: "BIO", fisika: "FIS", kimia: "KIM",
  "bahasa indonesia": "BIN", "bahasa inggris": "BIG",
  "bahasa arab": "BAR", "bahasa sunda": "BSD", "bahasa jawa": "BJW",
  sejarah: "SEJ", geografi: "GEO", ekonomi: "EKO", sosiologi: "SOS",
  "seni budaya": "SBU", "pendidikan agama islam": "PAI",
  "pendidikan jasmani": "PJO", "teknologi informasi": "TIK",
  prakarya: "PRK", ppkn: "PKN", kewirausahaan: "KWU",
};

function normalizeMapel(mapel) {
  const key = mapel.toLowerCase().trim();
  return MAPEL_MAP[key] || mapel.substring(0, 3).toUpperCase();
}

function extractNama(name) {
  const skip = ["dr", "prof", "h", "hj"];
  const words = name.split(/[\s,]+/);
  for (const w of words) {
    const clean = w.replace(/\./g, "").toLowerCase();
    if (!skip.includes(clean) && clean.length >= 2) {
      return w.replace(/\./g, "").toUpperCase();
    }
  }
  return words[0]?.replace(/\./g, "").toUpperCase() || "GURU";
}

export async function generateKodeSoal(mapel) {
  const user = getCurrentUser();
  if (!user || !mapel || !mapel.trim()) return { success: false, data: "" };

  const mapelCode = normalizeMapel(mapel);
  const namaCode = extractNama(user.name || user.username);
  const prefix = `${mapelCode}-${namaCode}`;

  const { data } = await supabase
    .from("soal")
    .select("kode_soal")
    .like("kode_soal", `${prefix}-%`);

  let maxNum = 0;
  for (const s of data || []) {
    const parts = s.kode_soal.split("-");
    const last = parts[parts.length - 1];
    const num = parseInt(last, 10);
    if (!isNaN(num) && num > maxNum) maxNum = num;
  }

  const kode_soal = `${prefix}-${String(maxNum + 1).padStart(2, "0")}`;
  return { success: true, data: kode_soal };
}

function generateToken() {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  let t = "";
  for (let i = 0; i < 6; i++) t += chars[Math.floor(Math.random() * chars.length)];
  return t;
}

function buildAnswerKey(questions) {
  return questions
    .sort((a, b) => a.nomer_soal - b.nomer_soal)
    .map((q) => {
      if (q.tipe_soal === "Menjodohkan") {
        const pairs = (q.jawaban_benar || "")
          .split("|")
          .map((p) => p.trim())
          .filter(Boolean);
        return `[${q.nomer_soal}:${pairs.join("|")}]`;
      }
      return `[${q.nomer_soal}:${q.jawaban_benar || ""}]`;
    })
    .join(",");
}

// ───── HELPERS ─────

function getRoleFilter(role, username) {
  if (role === "admin" || role === "siswa") return null;
  if (role === "guru") return { column: "created_by_username", value: username };
  return null;
}

function applyFilter(query, filter) {
  if (!filter) return query;
  return query.eq(filter.column, filter.value);
}

// ───── SOAL CRUD ─────

export async function getSoalList() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  let query = supabase
    .from("soal")
    .select(`*, butir_soal:butir_soal(count)`)
    .order("created_at", { ascending: false });

  const filter = getRoleFilter(user.role, user.username);
  if (filter) query = applyFilter(query, filter);

  if (user.role === "siswa") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("kelas")
      .eq("id", user.id)
      .single();
    query = query.eq("status", "Aktif");
    if (profile?.kelas) {
      query = query.or(`kelas.eq.${profile.kelas},semua_kelas.eq.true`);
    }
  }

  const { data, error } = await query;

  if (error) return { success: false, message: error.message };
  return {
    success: true,
    data: data.map((s) => ({
      ...s,
      jumlah_butir: s.butir_soal?.[0]?.count || 0,
      butir_soal: undefined,
    })),
  };
}

export async function getSoalById(id) {
  const { data, error } = await supabase
    .from("soal")
    .select("*")
    .eq("id_soal", id)
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function createSoal({ kode_soal, nama_soal, mapel, kelas, waktu_ujian, tampilan_soal, tanggal, token_required, tanggal_unlimited, tampilan_jawaban, semua_kelas }) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };
  if (user.role !== "guru") return { success: false, message: "Hanya guru yang dapat membuat soal" };

  const { data: dup } = await supabase.from("soal").select("id_soal").eq("kode_soal", kode_soal).maybeSingle();
  if (dup) return { success: false, message: "Kode soal sudah digunakan" };

  const { data, error } = await supabase.from("soal").insert({
    kode_soal, nama_soal, mapel, kelas,
    waktu_ujian: parseInt(waktu_ujian) || 60,
    tampilan_soal: tampilan_soal || "Urut",
    tanggal: tanggal || new Date().toISOString().split("T")[0],
    token_required: token_required ?? false,
    tanggal_unlimited: tanggal_unlimited ?? false,
    tampilan_jawaban: tampilan_jawaban || "Urut",
    semua_kelas: semua_kelas ?? false,
    created_by_username: user.username,
  }).select().single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function updateSoal(id, updates, { isAdmin } = {}) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // If not admin, check ownership
  if (user.role !== "admin") {
    const { data: ownerCheck } = await supabase
      .from("soal").select("created_by_username")
      .eq("id_soal", id).single();
    if (ownerCheck?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa mengedit soal milik sendiri" };
    }
  }

  const { data: existing } = await supabase.from("soal").select("status").eq("id_soal", id).single();
  if (existing?.status === "Aktif") return { success: false, message: "Tidak bisa mengedit soal yang sedang aktif" };

  const allowed = {};
  if (updates.kode_soal !== undefined) allowed.kode_soal = updates.kode_soal;
  if (updates.nama_soal !== undefined) allowed.nama_soal = updates.nama_soal;
  if (updates.mapel !== undefined) allowed.mapel = updates.mapel;
  if (updates.kelas !== undefined) allowed.kelas = updates.kelas;
  if (updates.waktu_ujian !== undefined) allowed.waktu_ujian = parseInt(updates.waktu_ujian);
  if (updates.tampilan_soal !== undefined) allowed.tampilan_soal = updates.tampilan_soal;
  if (updates.tanggal !== undefined) allowed.tanggal = updates.tanggal;
  if (updates.token_required !== undefined) allowed.token_required = updates.token_required;
  if (updates.semua_kelas !== undefined) allowed.semua_kelas = updates.semua_kelas;
  if (updates.tanggal_unlimited !== undefined) allowed.tanggal_unlimited = updates.tanggal_unlimited;
  if (updates.tampilan_jawaban !== undefined) allowed.tampilan_jawaban = updates.tampilan_jawaban;

  const { error } = await supabase.from("soal").update(allowed).eq("id_soal", id);
  if (error) return { success: false, message: error.message };

  const { data } = await supabase.from("soal").select("*").eq("id_soal", id).single();
  return { success: true, data };
}

export async function deleteSoal(kode_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // If not admin, check ownership
  if (user.role !== "admin") {
    const { data: ownerCheck } = await supabase
      .from("soal").select("created_by_username")
      .eq("kode_soal", kode_soal).single();
    if (ownerCheck?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa menghapus soal milik sendiri" };
    }
  }

  const { data: existing } = await supabase.from("soal").select("status").eq("kode_soal", kode_soal).single();
  if (existing?.status === "Aktif") return { success: false, message: "Tidak bisa menghapus soal yang sedang aktif" };

  const { error } = await supabase.from("soal").delete().eq("kode_soal", kode_soal);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function duplicateSoal(oldKode, newKode) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };
  if (user.role !== "guru") return { success: false, message: "Hanya guru yang dapat menduplikasi soal" };

  // Check ownership
  const { data: ownerCheck } = await supabase
    .from("soal").select("created_by_username")
    .eq("kode_soal", oldKode).single();
  if (ownerCheck?.created_by_username !== user.username) {
    return { success: false, message: "Anda hanya bisa menduplikasi soal milik sendiri" };
  }

  const { data: dup } = await supabase.from("soal").select("id_soal").eq("kode_soal", newKode).maybeSingle();
  if (dup) return { success: false, message: "Kode soal baru sudah digunakan" };

  const { data: oldSoal } = await supabase.from("soal").select("*").eq("kode_soal", oldKode).single();
  if (!oldSoal) return { success: false, message: "Soal asal tidak ditemukan" };
  if (oldSoal.status === "Aktif") return { success: false, message: "Tidak bisa menduplikasi soal yang aktif" };

  const { data: newSoal, error: e1 } = await supabase.from("soal").insert({
    kode_soal: newKode,
    nama_soal: `${oldSoal.nama_soal} (Copy)`,
    mapel: oldSoal.mapel,
    kelas: oldSoal.kelas,
    waktu_ujian: oldSoal.waktu_ujian,
    tampilan_soal: oldSoal.tampilan_soal,
    tanggal: new Date().toISOString().split("T")[0],
    status: "Nonaktif",
    token_required: oldSoal.token_required ?? false,
    semua_kelas: oldSoal.semua_kelas ?? false,
    tanggal_unlimited: oldSoal.tanggal_unlimited ?? false,
    tampilan_jawaban: oldSoal.tampilan_jawaban || "Urut",
    created_by_username: user.username,
  }).select().single();

  if (e1) return { success: false, message: e1.message };

  const { data: oldButir } = await supabase.from("butir_soal").select("*").eq("kode_soal", oldKode).order("nomer_soal");
  if (oldButir && oldButir.length > 0) {
    const newButir = oldButir.map((b, i) => ({
      nomer_soal: i + 1,
      kode_soal: newKode,
      pertanyaan: b.pertanyaan,
      tipe_soal: b.tipe_soal,
      pilihan_1: b.pilihan_1,
      pilihan_2: b.pilihan_2,
      pilihan_3: b.pilihan_3,
      pilihan_4: b.pilihan_4,
      jawaban_benar: b.jawaban_benar,
      status_soal: "Aktif",
    }));

    const { error: e2 } = await supabase.from("butir_soal").insert(newButir);
    if (e2) return { success: false, message: e2.message };
  }

  return { success: true, data: newSoal };
}

export async function toggleSoalStatus(id_soal, action) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // Check ownership
  if (user.role !== "admin") {
    const { data: ownerCheck } = await supabase
      .from("soal").select("created_by_username")
      .eq("id_soal", id_soal).single();
    if (ownerCheck?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa mengelola soal milik sendiri" };
    }
  }

  if (action === "nonaktif") {
    const { error } = await supabase.from("soal").update({ status: "Nonaktif", token: null }).eq("id_soal", id_soal);
    if (error) return { success: false, message: error.message };
    return { success: true };
  }

  // Activate
  const { data: soal } = await supabase.from("soal").select("kode_soal").eq("id_soal", id_soal).single();
  if (!soal) return { success: false, message: "Soal tidak ditemukan" };

  const { count } = await supabase.from("butir_soal").select("*", { count: "exact", head: true }).eq("kode_soal", soal.kode_soal);
  if (!count || count === 0) return { success: false, message: "Tidak bisa mengaktifkan soal tanpa butir soal" };

  const { data: questions } = await supabase.from("butir_soal").select("nomer_soal, tipe_soal, jawaban_benar").eq("kode_soal", soal.kode_soal).order("nomer_soal");
  const kunci = buildAnswerKey(questions || []);
  const token = generateToken();

  const { error } = await supabase.from("soal").update({ status: "Aktif", kunci, token }).eq("id_soal", id_soal);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function generateSoalToken(id_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // Check ownership
  if (user.role !== "admin") {
    const { data: ownerCheck } = await supabase
      .from("soal").select("created_by_username")
      .eq("id_soal", id_soal).single();
    if (ownerCheck?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa mengelola soal milik sendiri" };
    }
  }

  const token = generateToken();
  const { error } = await supabase.from("soal").update({ token }).eq("id_soal", id_soal);
  if (error) return { success: false, message: error.message };
  return { success: true, token };
}

// ───── BUTIR SOAL CRUD ─────

export async function getButirSoalList(kode_soal) {
  const { data, error } = await supabase
    .from("butir_soal")
    .select("*")
    .eq("kode_soal", kode_soal)
    .order("nomer_soal");

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getButirSoalById(id) {
  const { data, error } = await supabase
    .from("butir_soal")
    .select("*")
    .eq("id_soal", id)
    .single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function getNextNomer(kode_soal) {
  const { data } = await supabase
    .from("butir_soal")
    .select("nomer_soal")
    .eq("kode_soal", kode_soal)
    .order("nomer_soal");

  if (!data || data.length === 0) return 1;

  for (let i = 0; i < data.length; i++) {
    const expected = i + 1;
    if (data[i].nomer_soal !== expected) return expected;
  }
  return data.length + 1;
}

export async function createButirSoal({ kode_soal, nomer_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar }) {
  // Only guru can create butir_soal
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };
  if (user.role !== "guru") return { success: false, message: "Hanya guru yang dapat mengelola butir soal" };

  // Check soal ownership
  const { data: soal } = await supabase.from("soal").select("created_by_username").eq("kode_soal", kode_soal).single();
  if (soal?.created_by_username !== user.username) {
    return { success: false, message: "Anda hanya bisa mengelola butir soal milik sendiri" };
  }

  const { data: dup } = await supabase
    .from("butir_soal")
    .select("id_soal")
    .eq("kode_soal", kode_soal)
    .eq("nomer_soal", nomer_soal)
    .maybeSingle();

  if (dup) return { success: false, message: `Nomor soal ${nomer_soal} sudah digunakan` };

  const { data, error } = await supabase.from("butir_soal").insert({
    kode_soal, nomer_soal, pertanyaan, tipe_soal,
    pilihan_1: pilihan_1 || null,
    pilihan_2: pilihan_2 || null,
    pilihan_3: pilihan_3 || null,
    pilihan_4: pilihan_4 || null,
    jawaban_benar: jawaban_benar || null,
  }).select().single();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function updateButirSoal(id, { nomer_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar }) {
  // Only guru can update butir_soal
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };
  if (user.role !== "guru") return { success: false, message: "Hanya guru yang dapat mengelola butir soal" };

  // Check butir_soal ownership via soal
  const { data: butir } = await supabase.from("butir_soal").select("kode_soal").eq("id_soal", id).single();
  if (butir) {
    const { data: soal } = await supabase.from("soal").select("created_by_username").eq("kode_soal", butir.kode_soal).single();
    if (soal?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa mengelola butir soal milik sendiri" };
    }
  }

  const updates = {};
  if (nomer_soal !== undefined) updates.nomer_soal = nomer_soal;
  if (pertanyaan !== undefined) updates.pertanyaan = pertanyaan;
  if (tipe_soal !== undefined) updates.tipe_soal = tipe_soal;
  if (pilihan_1 !== undefined) updates.pilihan_1 = pilihan_1;
  if (pilihan_2 !== undefined) updates.pilihan_2 = pilihan_2;
  if (pilihan_3 !== undefined) updates.pilihan_3 = pilihan_3;
  if (pilihan_4 !== undefined) updates.pilihan_4 = pilihan_4;
  if (jawaban_benar !== undefined) updates.jawaban_benar = jawaban_benar;

  const { data, error } = await supabase.from("butir_soal").update(updates).eq("id_soal", id).select().single();
  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

export async function deleteButirSoal(id) {
  // Only guru can delete butir_soal
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };
  if (user.role !== "guru") return { success: false, message: "Hanya guru yang dapat mengelola butir soal" };

  // Check ownership via soal
  const { data: butir } = await supabase.from("butir_soal").select("kode_soal").eq("id_soal", id).single();
  if (butir) {
    const { data: soal } = await supabase.from("soal").select("created_by_username").eq("kode_soal", butir.kode_soal).single();
    if (soal?.created_by_username !== user.username) {
      return { success: false, message: "Anda hanya bisa mengelola butir soal milik sendiri" };
    }
  }

  const { error } = await supabase.from("butir_soal").delete().eq("id_soal", id);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

export async function getSoalCounts() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  let totalQuery = supabase.from("soal").select("*", { count: "exact", head: true });
  let activeQuery = supabase.from("soal").select("*", { count: "exact", head: true }).eq("status", "Aktif");

  const filter = getRoleFilter(user.role, user.username);
  if (filter) {
    totalQuery = applyFilter(totalQuery, filter);
    activeQuery = applyFilter(activeQuery, filter);
  }

  if (user.role === "siswa") {
    const { data: profile } = await supabase
      .from("profiles")
      .select("kelas")
      .eq("id", user.id)
      .single();
    if (profile?.kelas) {
      totalQuery = totalQuery.or(`kelas.eq.${profile.kelas},semua_kelas.eq.true`);
      activeQuery = activeQuery.or(`kelas.eq.${profile.kelas},semua_kelas.eq.true`);
    }
  }

  const [totalRes, activeRes] = await Promise.all([totalQuery, activeQuery]);
  const { data: questions } = await supabase.from("butir_soal").select("*", { count: "exact", head: true });

  return {
    success: true,
    data: {
      total: totalRes.count || 0,
      active: activeRes.count || 0,
      questions: questions || 0,
    },
  };
}

export async function getDistinctKelas() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  let query = supabase.from("soal").select("kelas");
  const filter = getRoleFilter(user.role, user.username);
  if (filter) query = applyFilter(query, filter);

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  const unique = [...new Set((data || []).map((s) => s.kelas).filter(Boolean))].sort();
  return { success: true, data: unique };
}

import supabase from "../models/supabaseClient";
import { getCurrentUser } from "./AuthController";

// ───── STUDENT: Get available exams ─────

export async function getAvailableExams() {
  const user = getCurrentUser();
  if (!user || user.role !== "siswa") return { success: false, message: "Hanya untuk siswa" };

  const { data: profile } = await supabase
    .from("profiles")
    .select("kelas, student_group")
    .eq("id", user.id)
    .single();

  if (!profile) return { success: false, message: "Profil tidak ditemukan" };

  const today = new Date().toISOString().split("T")[0];

  const { data, error } = await supabase
    .from("soal")
    .select("*")
    .eq("status", "Aktif")
    .eq("kelas", profile.kelas)
    .lte("tanggal", today)
    .order("tanggal", { ascending: false });

  if (error) return { success: false, message: error.message };

  // Filter out exams already completed (have nilai record)
  const { data: existingResults } = await supabase
    .from("nilai")
    .select("kode_soal")
    .eq("id_siswa", user.id);

  const doneKode = new Set((existingResults || []).map((r) => r.kode_soal));
  const filtered = data.filter((s) => !doneKode.has(s.kode_soal));

  return { success: true, data: filtered };
}

// ───── STUDENT: Check existing session ─────

export async function getExamSession(kode_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data, error } = await supabase
    .from("jawaban_siswa")
    .select("*")
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .eq("sesi_ke", 1)
    .maybeSingle();

  if (error) return { success: false, message: error.message };
  return { success: true, data };
}

// ───── STUDENT: Verify exam eligibility ─────

export async function verifyExam(kode_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data: soal, error } = await supabase
    .from("soal")
    .select("*")
    .eq("kode_soal", kode_soal)
    .single();

  if (error) return { success: false, message: "Soal tidak ditemukan" };
  if (soal.status !== "Aktif") return { success: false, message: "Soal tidak aktif" };

  // Check exam date
  const today = new Date().toISOString().split("T")[0];
  if (!soal.tanggal_unlimited && today < soal.tanggal) {
    return { success: false, message: "Ujian belum dimulai" };
  }

  // Check class match
  const { data: profile } = await supabase
    .from("profiles")
    .select("kelas")
    .eq("id", user.id)
    .single();

  if (profile && soal.kelas !== profile.kelas) {
    return { success: false, message: "Soal ini bukan untuk kelas kamu" };
  }

  // Check if already completed
  const { data: result } = await supabase
    .from("nilai")
    .select("id")
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .maybeSingle();

  if (result) return { success: false, message: "Kamu sudah mengerjakan soal ini" };

  // Get question count
  const { count } = await supabase
    .from("butir_soal")
    .select("*", { count: "exact", head: true })
    .eq("kode_soal", kode_soal);

  // Get existing active session
  const session = await getExamSession(kode_soal);

  return {
    success: true,
    data: {
      soal,
      jumlah_soal: count || 0,
      sesi_aktif: session.success && session.data?.status_ujian === "Aktif" ? session.data : null,
    },
  };
}

// ───── STUDENT: Verify token and start exam ─────

export async function verifikasiTokenDanMulai(kode_soal, token, reset = false) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data: soal } = await supabase
    .from("soal")
    .select("*")
    .eq("kode_soal", kode_soal)
    .single();

  if (!soal) return { success: false, message: "Soal tidak ditemukan" };

  if (soal.token_required && soal.token !== token) {
    return { success: false, message: "Token tidak valid" };
  }

  // Check existing session
  const { data: existingSession } = await supabase
    .from("jawaban_siswa")
    .select("*")
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .eq("sesi_ke", 1)
    .maybeSingle();

  let waktu_sisa;
  let jawaban_awal = {};

  if (existingSession) {
    if (existingSession.status_ujian === "Aktif" && !reset) {
      // Resume: use existing session data
      waktu_sisa = existingSession.waktu_sisa;
      jawaban_awal = existingSession.jawaban || {};
      await supabase
        .from("jawaban_siswa")
        .update({ start_time: new Date().toISOString() })
        .eq("id", existingSession.id);
    } else {
      // Reset: restart with fresh time but preserve answers
      waktu_sisa = soal.waktu_ujian * 60;
      jawaban_awal = existingSession.jawaban || {};
      await supabase
        .from("jawaban_siswa")
        .update({ waktu_sisa, status_ujian: "Aktif", start_time: new Date().toISOString(), last_save: new Date().toISOString() })
        .eq("id", existingSession.id);
    }
  } else {
    waktu_sisa = soal.waktu_ujian * 60;
    const { error: insertError } = await supabase.from("jawaban_siswa").insert({
      id_siswa: user.id,
      kode_soal,
      jawaban: {},
      waktu_sisa,
      status_ujian: "Aktif",
    });
    if (insertError) return { success: false, message: insertError.message };
  }

  return { success: true, data: { waktu_sisa, jawaban: jawaban_awal } };
}

// ───── STUDENT: Get exam questions ─────

export async function getExamQuestions(kode_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data: soal } = await supabase
    .from("soal")
    .select("tampilan_soal")
    .eq("kode_soal", kode_soal)
    .single();

  const order = soal?.tampilan_soal === "Acak" ? "RANDOM" : "nomer_soal ASC";

  const { data, error } = await supabase
    .from("butir_soal")
    .select("*")
    .eq("kode_soal", kode_soal)
    .order("nomer_soal", { ascending: true });

  if (error) return { success: false, message: error.message };

  let questions = data || [];
  if (soal?.tampilan_soal === "Acak") {
    questions = [...questions].sort(() => Math.random() - 0.5);
  }

  return { success: true, data: questions };
}

// ───── STUDENT: Auto-save answers ─────

export async function autoSaveJawaban(kode_soal, jawaban, waktu_sisa) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { error } = await supabase
    .from("jawaban_siswa")
    .update({ jawaban, waktu_sisa, last_save: new Date().toISOString() })
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .eq("status_ujian", "Aktif")
    .eq("sesi_ke", 1);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── STUDENT: Submit exam ─────

export async function submitJawaban(kode_soal, jawaban, waktu_sisa) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  // Get exam data
  const { data: soal } = await supabase
    .from("soal")
    .select("*, butir_soal:butir_soal(*)")
    .eq("kode_soal", kode_soal)
    .single();

  if (!soal) return { success: false, message: "Soal tidak ditemukan" };

  // Mark session as completed
  await supabase
    .from("jawaban_siswa")
    .update({ jawaban, waktu_sisa: 0, status_ujian: "Selesai", last_save: new Date().toISOString() })
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .eq("sesi_ke", 1);

  // Calculate score
  const questions = soal.butir_soal || [];
  const hasil = koreksiOtomatis(jawaban, questions);
  const jawabanSiswaRaw = questions
    .map((q) => {
      const raw = jawaban[q.nomer_soal];
      const val = raw !== undefined && raw !== null
        ? (Array.isArray(raw) ? raw.map(toLetter).join("|") : normalizeAnswer(raw))
        : "";
      return `[${q.nomer_soal}:${val}]`;
    })
    .join(",");

  // Save result
  const { error: nilaiError } = await supabase.from("nilai").insert({
    id_siswa: user.id,
    kode_soal,
    jawaban,
    jawaban_benar: soal.kunci,
    jawaban_siswa_raw: jawabanSiswaRaw,
    jumlah_soal: hasil.total,
    jumlah_benar: hasil.benar,
    jumlah_salah: hasil.salah,
    nilai: hasil.nilai,
    detail_uraian: hasil.detail_uraian,
    status_nilai: hasil.perlu_koreksi ? "uraian" : "auto",
    waktu_mulai: new Date(Date.now() - soal.waktu_ujian * 60 * 1000).toISOString(),
    waktu_selesai: new Date().toISOString(),
  });

  if (nilaiError) return { success: false, message: nilaiError.message };

  return {
    success: true,
    data: {
      total: hasil.total,
      benar: hasil.benar,
      salah: hasil.salah,
      nilai: hasil.nilai,
      perlu_koreksi: hasil.perlu_koreksi,
    },
  };
}

// ───── SCORING ENGINE ─────

const labelMap = { pilihan_1: "A", pilihan_2: "B", pilihan_3: "C", pilihan_4: "D" };
const toLetter = (v) => labelMap[v] || v;

function normalizeAnswer(value) {
  if (typeof value === "string") return toLetter(value);
  if (Array.isArray(value)) return value.map(toLetter);
  if (value && typeof value === "object") {
    const o = {};
    for (const k of Object.keys(value)) o[k] = value[k];
    return o;
  }
  return value;
}

function koreksiOtomatis(jawaban, questions) {
  let benar = 0;
  let salah = 0;
  let total = 0;
  let detail_uraian = {};

  const getAnswer = (nomor) => {
    const v = jawaban[nomor];
    if (v === undefined || v === null || v === "") return null;
    return v;
  };

  for (const q of questions) {
    total++;
    const nomor = q.nomer_soal;
    const jawab = getAnswer(nomor);
    const kunci = q.jawaban_benar;

    if (jawab === null) {
      salah++;
      continue;
    }

    switch (q.tipe_soal) {
      case "Pilihan Ganda": {
        const jawabLabel = toLetter(jawab);
        const kunciLabel = toLetter(kunci);
        if (jawabLabel === kunciLabel) {
          benar++;
        } else {
          salah++;
        }
        break;
      }

      case "Pilihan Ganda Kompleks": {
        const jawabArr = Array.isArray(jawab) ? jawab : [jawab];
        const kunciArr = (kunci || "")
          .replace(/[\[\]]/g, "")
          .split("|")
          .map((s) => s.trim())
          .filter(Boolean);
        const jawabSet = new Set(jawabArr.map(toLetter));
        const kunciSet = new Set(kunciArr.map(toLetter));

        if (setsEqual(jawabSet, kunciSet)) {
          benar++;
        } else {
          // Partial credit: count matching
          const intersection = new Set([...jawabSet].filter((x) => kunciSet.has(x)));
          if (intersection.size > 0 && intersection.size < kunciSet.size) {
            benar += 0.5; // partial credit
            salah += 0.5;
          } else {
            salah++;
          }
        }
        break;
      }

      case "Benar/Salah": {
        if (typeof jawab === "object" && !Array.isArray(jawab)) {
          const kunciPairs = (kunci || "")
            .split("|")
            .map((p) => p.trim())
            .filter(Boolean);
          let subBenar = 0;
          let subTotal = 0;

          for (const pair of kunciPairs) {
            const [idx, val] = pair.includes(":") ? pair.split(":") : [pair, ""];
            subTotal++;
            if (jawab[idx] && jawab[idx].toLowerCase() === val.toLowerCase()) {
              subBenar++;
            }
          }

          if (subTotal > 0 && subBenar === subTotal) {
            benar++;
          } else if (subBenar > 0) {
            benar += subBenar / subTotal;
            salah += (subTotal - subBenar) / subTotal;
          } else {
            salah++;
          }
        } else {
          if (jawab.toLowerCase() === (kunci || "").toLowerCase()) {
            benar++;
          } else {
            salah++;
          }
        }
        break;
      }

      case "Menjodohkan": {
        if (typeof jawab === "object" && !Array.isArray(jawab)) {
          const kunciPairs = (kunci || "")
            .replace(/[\[\]]/g, "")
            .split("|")
            .map((p) => p.trim())
            .filter(Boolean);

          let subBenar = 0;
          let subTotal = 0;

          for (const pair of kunciPairs) {
            const [kiri, kanan] = pair.includes(":") ? pair.split(":") : [pair, ""];
            subTotal++;
            if (jawab[kiri.trim()] && jawab[kiri.trim()].toLowerCase() === kanan.trim().toLowerCase()) {
              subBenar++;
            }
          }

          if (subTotal > 0 && subBenar === subTotal) {
            benar++;
          } else if (subBenar > 0) {
            benar += subBenar / subTotal;
            salah += (subTotal - subBenar) / subTotal;
          } else {
            salah++;
          }
        } else {
          salah++;
        }
        break;
      }

      case "Uraian": {
        // Uraian: no auto-score, marked for manual grading
        detail_uraian[nomor] = typeof jawab === "string" ? jawab : "";
        break;
      }

      default:
        salah++;
    }
  }

  const perlu_koreksi = Object.keys(detail_uraian).length > 0;
  const autoTotal = total - Object.keys(detail_uraian).length;
  const nilai = autoTotal > 0 ? Math.round((benar / autoTotal) * 100 * 100) / 100 : 0;

  return {
    total,
    benar,
    salah,
    nilai,
    detail_uraian,
    perlu_koreksi,
  };
}

function setsEqual(a, b) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

// ───── STUDENT: Get results ─────

export async function getStudentResults() {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data, error } = await supabase
    .from("nilai")
    .select("*, soal:soal!kode_soal(nama_soal, mapel, kode_soal)")
    .eq("id_siswa", user.id)
    .order("waktu_selesai", { ascending: false });

  if (error) return { success: false, message: error.message };
  return { success: true, data: data || [] };
}

export async function getResultDetail(kode_soal) {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const { data, error } = await supabase
    .from("nilai")
    .select("*")
    .eq("id_siswa", user.id)
    .eq("kode_soal", kode_soal)
    .single();

  if (error) return { success: false, message: error.message };
  if (!data) return { success: false, message: "Nilai tidak ditemukan" };

  // Get questions with correct answers
  const { data: questions } = await supabase
    .from("butir_soal")
    .select("*")
    .eq("kode_soal", kode_soal)
    .order("nomer_soal", { ascending: true });

  return {
    success: true,
    data: {
      result: data,
      questions: questions || [],
    },
  };
}

// ───── STUDENT: Log activity (anti-cheat) ─────

export async function logActivity(kode_soal, aktivitas, detail = {}) {
  const user = getCurrentUser();
  if (!user) return;

  await supabase.from("activity_logs").insert({
    id_siswa: user.id,
    kode_soal,
    aktivitas,
    detail,
  });
}

// ───── STUDENT: Update activity ping ─────

export async function updateActivity(kode_soal) {
  const user = getCurrentUser();
  if (!user) return;

  const { data: profile } = await supabase
    .from("profiles")
    .select("force_logout")
    .eq("id", user.id)
    .single();

  await supabase
    .from("profiles")
    .update({ last_activity: new Date().toISOString(), page_url: `/siswa/ujian/mulai?kode_soal=${kode_soal}` })
    .eq("id", user.id);

  return { success: true, force_logout: profile?.force_logout || false };
}

// ───── STUDENT: Force save (admin) ─────

export async function forceSave(id_siswa, kode_soal) {
  const { data: session } = await supabase
    .from("jawaban_siswa")
    .select("*")
    .eq("id_siswa", id_siswa)
    .eq("kode_soal", kode_soal)
    .eq("status_ujian", "Aktif")
    .single();

  if (!session) return { success: false, message: "Tidak ada sesi aktif" };

  return await submitJawaban(kode_soal, session.jawaban, 0);
}

// ───── STUDENT: Force logout (admin) ─────

export async function setForceLogout(id_siswa) {
  const { error } = await supabase
    .from("profiles")
    .update({ force_logout: true })
    .eq("id", id_siswa);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── ADMIN/GURU: Get monitoring data ─────

export async function getMonitoringData(kelasFilter) {
  const user = getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "guru")) {
    return { success: false, message: "Akses ditolak" };
  }

  let query = supabase
    .from("jawaban_siswa")
    .select("*, siswa:profiles!id_siswa(name, username, kelas, rombel, student_group, last_activity, force_logout, page_url), soal:soal!kode_soal(nama_soal, mapel, waktu_ujian)")
    .eq("status_ujian", "Aktif")
    .order("last_save", { ascending: false });

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };

  let filtered = data || [];
  if (kelasFilter) {
    filtered = filtered.filter((s) => s.siswa?.kelas === kelasFilter);
  }

  return { success: true, data: filtered };
}

export async function getOnlineStudents() {
  const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();

  const { data, error } = await supabase
    .from("profiles")
    .select("id, name, username, kelas, role, last_activity, page_url")
    .gte("last_activity", fiveMinutesAgo)
    .eq("role", "siswa")
    .order("last_activity", { ascending: false });

  if (error) return { success: false, message: error.message };
  return { success: true, data: data || [] };
}

// ───── ADMIN/GURU: Get all results ─────

export async function getAllResults(filters = {}) {
  const user = getCurrentUser();
  if (!user || (user.role !== "admin" && user.role !== "guru")) {
    return { success: false, message: "Akses ditolak" };
  }

  let query = supabase
    .from("nilai")
    .select("*, siswa:profiles!id_siswa(name, username, kelas, student_group), soal:soal!kode_soal(nama_soal, mapel)")
    .order("waktu_selesai", { ascending: false });

  if (filters.kelas) {
    const { data: siswaIds } = await supabase
      .from("profiles")
      .select("id")
      .eq("kelas", filters.kelas);
    const ids = (siswaIds || []).map((s) => s.id);
    if (ids.length > 0) query = query.in("id_siswa", ids);
  }

  if (filters.kode_soal) {
    query = query.eq("kode_soal", filters.kode_soal);
  }

  if (filters.id_siswa) {
    query = query.eq("id_siswa", filters.id_siswa);
  }

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  return { success: true, data: data || [] };
}

// ───── ADMIN/GURU: Save essay score ─────

export async function simpanNilaiUraian(id_nilai, detail_uraian, skor_essay) {
  const { data: existing } = await supabase
    .from("nilai")
    .select("nilai, jumlah_soal, jumlah_benar, detail_uraian")
    .eq("id", id_nilai)
    .single();

  if (!existing) return { success: false, message: "Nilai tidak ditemukan" };

  const totalSoalEssay = Object.keys(skor_essay).length;
  const totalQuestions = existing.jumlah_soal;
  const autoCount = totalQuestions - totalSoalEssay;

  const autoScore = autoCount > 0
    ? (existing.jumlah_benar / autoCount) * 100
    : 0;

  const essayMax = totalSoalEssay * 100;
  const essayTotal = Object.values(skor_essay).reduce((a, b) => a + parseFloat(b), 0);
  const essayScore = essayMax > 0 ? (essayTotal / essayMax) * 100 : 0;
  const finalScore = autoCount > 0
    ? ((autoScore * autoCount) + essayScore * totalSoalEssay) / totalQuestions
    : essayScore;

  const { error } = await supabase
    .from("nilai")
    .update({
      detail_uraian,
      status_nilai: "lengkap",
      nilai: Math.round(finalScore * 100) / 100,
    })
    .eq("id", id_nilai);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── Delete result ─────

export async function deleteNilai(id_nilai) {
  const { error } = await supabase.from("nilai").delete().eq("id", id_nilai);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── Upload Image (Storage) ─────

const STORAGE_BUCKET = "gambar";

export async function uploadImage(file, folder = "umum") {
  const user = getCurrentUser();
  if (!user) return { success: false, message: "Not authenticated" };

  const ext = file.name.split(".").pop().toLowerCase();
  const allowed = ["jpg", "jpeg", "png", "gif", "webp", "svg"];
  if (!allowed.includes(ext)) return { success: false, message: "Format gambar tidak didukung" };

  if (file.size > 2 * 1024 * 1024) return { success: false, message: "Maksimal 2MB" };

  const fileName = `${Date.now()}_${Math.random().toString(36).substr(2, 6)}.${ext}`;
  const filePath = `${folder}/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from(STORAGE_BUCKET)
    .upload(filePath, file, { cacheControl: "3600", upsert: false });

  if (uploadError) return { success: false, message: uploadError.message };

  const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(filePath);

  return { success: true, url: urlData.publicUrl, path: filePath };
}

export async function getImageList(folder = "umum") {
  const { data, error } = await supabase.storage
    .from(STORAGE_BUCKET)
    .list(folder, { sortBy: { column: "created_at", order: "desc" } });

  if (error) return { success: false, message: error.message };

  const urls = (data || []).map((f) => {
    const { data: urlData } = supabase.storage.from(STORAGE_BUCKET).getPublicUrl(`${folder}/${f.name}`);
    return { name: f.name, url: urlData.publicUrl, created_at: f.created_at };
  });

  return { success: true, data: urls };
}

export async function deleteImage(path) {
  const { error } = await supabase.storage.from(STORAGE_BUCKET).remove([path]);
  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── Settings ─────

export async function getSettings() {
  const { data, error } = await supabase.from("settings").select("data").eq("id", 1).single();
  if (error) return { success: false, message: error.message };
  return { success: true, data: data?.data || {} };
}

export async function updateSettings(newData) {
  const user = getCurrentUser();
  if (!user || user.role !== "admin") return { success: false, message: "Hanya admin" };

  const { error } = await supabase
    .from("settings")
    .update({ data: newData })
    .eq("id", 1);

  if (error) return { success: false, message: error.message };
  return { success: true };
}

// ───── Activity Logs Read ─────

export async function getActivityLogs(kode_soal, id_siswa) {
  let query = supabase
    .from("activity_logs")
    .select("*, siswa:profiles!id_siswa(name, username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (kode_soal) query = query.eq("kode_soal", kode_soal);
  if (id_siswa) query = query.eq("id_siswa", id_siswa);

  const { data, error } = await query;
  if (error) return { success: false, message: error.message };
  return { success: true, data: data || [] };
}

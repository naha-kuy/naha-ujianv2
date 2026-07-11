-- Migration: Phase 4 — Sistem Ujian
-- Tables: jawaban_siswa (sessions), nilai (results), activity_logs (anti-cheat)

-- 1. Student Exam Sessions (jawaban_siswa)
CREATE TABLE IF NOT EXISTS jawaban_siswa (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id),
  kode_soal VARCHAR(200) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  jawaban JSONB DEFAULT '{}',
  waktu_sisa INTEGER NOT NULL,
  status_ujian VARCHAR(20) DEFAULT 'Aktif',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_save TIMESTAMPTZ DEFAULT NOW(),
  sesi_ke INTEGER DEFAULT 1,
  UNIQUE(id_siswa, kode_soal, sesi_ke)
);

-- 2. Exam Results (nilai)
CREATE TABLE IF NOT EXISTS nilai (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id),
  kode_soal VARCHAR(200) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  jawaban JSONB DEFAULT '{}',
  jawaban_benar TEXT,
  jawaban_siswa_raw TEXT,
  jumlah_soal INTEGER DEFAULT 0,
  jumlah_benar INTEGER DEFAULT 0,
  jumlah_salah INTEGER DEFAULT 0,
  nilai DECIMAL(5,2) DEFAULT 0,
  detail_uraian JSONB DEFAULT '{}',
  status_nilai VARCHAR(20) DEFAULT 'auto',
  waktu_mulai TIMESTAMPTZ,
  waktu_selesai TIMESTAMPTZ DEFAULT NOW(),
  sesi_ke INTEGER DEFAULT 1,
  UNIQUE(id_siswa, kode_soal)
);

-- 3. Activity Logs (anti-cheat)
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id),
  kode_soal VARCHAR(200) REFERENCES soal(kode_soal) ON DELETE CASCADE,
  aktivitas TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_jawaban_siswa ON jawaban_siswa(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_siswa ON activity_logs(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON activity_logs(created_at);

-- RLS
ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- Siswa: own sessions
CREATE POLICY "Siswa select own jawaban"
  ON jawaban_siswa FOR SELECT
  USING (id_siswa = auth.uid());

CREATE POLICY "Siswa insert own jawaban"
  ON jawaban_siswa FOR INSERT
  WITH CHECK (id_siswa = auth.uid());

CREATE POLICY "Siswa update own jawaban"
  ON jawaban_siswa FOR UPDATE
  USING (id_siswa = auth.uid());

-- Siswa: own results
CREATE POLICY "Siswa select own nilai"
  ON nilai FOR SELECT
  USING (id_siswa = auth.uid());

-- Siswa: own activity logs
CREATE POLICY "Siswa insert own activity"
  ON activity_logs FOR INSERT
  WITH CHECK (id_siswa = auth.uid());

CREATE POLICY "Siswa select own activity"
  ON activity_logs FOR SELECT
  USING (id_siswa = auth.uid());

-- Admin: full access
CREATE POLICY "Admin full on jawaban"
  ON jawaban_siswa FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full on nilai"
  ON nilai FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admin full on activity_logs"
  ON activity_logs FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Guru: read-only on exams they created
CREATE POLICY "Guru select jawaban"
  ON jawaban_siswa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guru'
    ) AND (
      EXISTS (
        SELECT 1 FROM soal
        WHERE kode_soal = jawaban_siswa.kode_soal
        AND created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
      )
    )
  );

CREATE POLICY "Guru select nilai"
  ON nilai FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guru'
    ) AND (
      EXISTS (
        SELECT 1 FROM soal
        WHERE kode_soal = nilai.kode_soal
        AND created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
      )
    )
  );

-- Add student_group to profiles if not exists
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_group VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_class VARCHAR(50) DEFAULT '';

-- Add rombel column as alias for student_group (compatibility)
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS rombel VARCHAR(50) DEFAULT '';

-- Add student profile columns
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS page_url TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS force_logout BOOLEAN DEFAULT FALSE;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kelas ON profiles(kelas);

-- Siswa can see all active exams for their class
CREATE POLICY "Siswa select active soal"
  ON soal FOR SELECT
  USING (
    status = 'Aktif' AND
    (kelas = (SELECT kelas FROM profiles WHERE id = auth.uid()) OR
     EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru')))
  );

-- Siswa can see butir_soal (needed for exam)
CREATE POLICY "Siswa select butir_soal"
  ON butir_soal FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('siswa', 'admin', 'guru'))
  );

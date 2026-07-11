-- Migration: Create soal & butir_soal tables for Phase 2 (Manajemen Soal)
-- Jalankan SQL ini di Supabase SQL Editor

-- 1. Tabel Soal (Bank Soal / Exam Package)
CREATE TABLE IF NOT EXISTS soal (
  id_soal SERIAL PRIMARY KEY,
  kode_soal VARCHAR(200) UNIQUE NOT NULL,
  nama_soal VARCHAR(255) NOT NULL,
  mapel VARCHAR(100) NOT NULL,
  kelas VARCHAR(50) NOT NULL,
  waktu_ujian INTEGER DEFAULT 60,
  tanggal DATE DEFAULT CURRENT_DATE,
  status VARCHAR(50) DEFAULT 'Nonaktif',
  tampilan_soal VARCHAR(10) DEFAULT 'Urut',
  kunci TEXT,
  token VARCHAR(6),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabel Butir Soal (Exam Questions)
CREATE TABLE IF NOT EXISTS butir_soal (
  id_soal SERIAL PRIMARY KEY,
  nomer_soal INTEGER NOT NULL,
  kode_soal VARCHAR(50) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  pertanyaan TEXT NOT NULL,
  tipe_soal VARCHAR(50) NOT NULL CHECK (tipe_soal IN ('Pilihan Ganda','Pilihan Ganda Kompleks','Benar/Salah','Uraian','Menjodohkan')),
  pilihan_1 TEXT,
  pilihan_2 TEXT,
  pilihan_3 TEXT,
  pilihan_4 TEXT,
  jawaban_benar TEXT,
  status_soal VARCHAR(20) DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kode_soal, nomer_soal)
);

-- 3. Indexes for performance
CREATE INDEX IF NOT EXISTS idx_butir_soal_kode ON butir_soal(kode_soal);
CREATE INDEX IF NOT EXISTS idx_butir_soal_nomer ON butir_soal(kode_soal, nomer_soal);
CREATE INDEX IF NOT EXISTS idx_soal_status ON soal(status);
CREATE INDEX IF NOT EXISTS idx_soal_mapel ON soal(mapel);

-- 4. Row Level Security (optional, adjust as needed)
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;
ALTER TABLE butir_soal ENABLE ROW LEVEL SECURITY;

-- Admin can do everything on soal & butir_soal
CREATE POLICY "Admin full access on soal"
  ON soal FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Admin full access on butir_soal"
  ON butir_soal FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Guru can read, insert, update soal (but not delete others)
CREATE POLICY "Guru select on soal"
  ON soal FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
  );

CREATE POLICY "Guru insert on soal"
  ON soal FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru')
  );

CREATE POLICY "Guru update own soal"
  ON soal FOR UPDATE USING (
    created_by = auth.uid() OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Guru select on butir_soal"
  ON butir_soal FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

CREATE POLICY "Guru insert on butir_soal"
  ON butir_soal FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

CREATE POLICY "Guru update on butir_soal"
  ON butir_soal FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

CREATE POLICY "Guru delete on butir_soal"
  ON butir_soal FOR DELETE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin'))
  );

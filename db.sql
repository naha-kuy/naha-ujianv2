-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard/project/cvwemzzfwrjfrnnfckch/sql/new)
-- Berisi DDL + data dummy variatif untuk semua tabel
-- Cocok dengan semua migration file + kode terbaru

-- ============================================================
-- 1. TABEL PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  name TEXT NOT NULL,
  -- Guru-specific
  mata_pelajaran TEXT,
  catatan_pendaftaran TEXT,
  -- Siswa-specific
  kelas TEXT,
  jurusan TEXT,
  nama_sekolah TEXT,
  -- Password shown on exam card
  password_shown TEXT,
  -- Status approval
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  -- Extra columns (added by migrations)
  student_class VARCHAR(50) DEFAULT '',
  student_group VARCHAR(50) DEFAULT '',
  rombel VARCHAR(50) DEFAULT '',
  page_url TEXT,
  last_activity TIMESTAMPTZ,
  force_logout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS POLICIES — PROFILES
-- ============================================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
END;
$$;

DROP POLICY IF EXISTS "users_read_own_profile" ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile" ON profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles" ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles" ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;

CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_update_all_profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

-- ============================================================
-- 3. TRIGGER: auto-create profile on signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  _role TEXT;
BEGIN
  _role := COALESCE(NEW.raw_user_meta_data->>'role', 'siswa');

  INSERT INTO public.profiles (
    id, username, email, role, name,
    mata_pelajaran, catatan_pendaftaran,
    kelas, jurusan, nama_sekolah,
    status
  ) VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    NEW.email,
    _role,
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username'),
    NEW.raw_user_meta_data->>'mata_pelajaran',
    NEW.raw_user_meta_data->>'catatan_pendaftaran',
    NEW.raw_user_meta_data->>'kelas',
    NEW.raw_user_meta_data->>'jurusan',
    NEW.raw_user_meta_data->>'nama_sekolah',
    CASE WHEN _role = 'admin' THEN 'approved' ELSE 'pending' END
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 4. SEED DATA DUMMY
-- ============================================================

-- Catatan: auth.users dan auth.identities hanya diisi jika belum ada.
-- Data dummy untuk semua tabel diisi dengan UUID tetap agar relasi konsisten.

-- Helper function: find user by email or create with desired UUID
CREATE OR REPLACE FUNCTION resolve_seed_user(
  p_fallback_id UUID,
  p_email TEXT,
  p_password TEXT,
  p_meta JSONB
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  v_id UUID;
BEGIN
  SELECT id INTO v_id FROM auth.users WHERE email = p_email;
  IF v_id IS NULL THEN
    v_id := p_fallback_id;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, aud, role, created_at, updated_at, confirmation_token, email_change, email_change_token_new, recovery_token)
    VALUES (v_id, '00000000-0000-0000-0000-000000000000', p_email, extensions.crypt(p_password, extensions.gen_salt('bf', 10)), now(), '{"provider":"email","providers":["email"]}', p_meta, 'authenticated', 'authenticated', now(), now(), '', '', '', '');
    INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
    VALUES (v_id, v_id, format('{"sub":"%s","email":"%s"}', v_id, p_email)::jsonb, 'email', v_id::text, now(), now(), now());
  END IF;
  RETURN v_id;
END;
$$;

DO $$
DECLARE
  uid_admin    UUID;
  uid_admin2   UUID;
  uid_guru_mtk UUID;
  uid_guru_bio UUID;
  uid_guru_ing UUID;
  uid_guru_pending UUID;
  uid_siswa1   UUID;
  uid_siswa2   UUID;
  uid_siswa3   UUID;
  uid_siswa4   UUID;
  uid_siswa5   UUID;
  uid_siswa6   UUID;
  uid_siswa7   UUID;
  uid_siswa8   UUID;
  uid_siswa9   UUID;
  uid_siswa10  UUID;
  uid_siswa11  UUID;
  uid_siswa12  UUID;
BEGIN
  -- ===================== AUTH USERS =====================
  uid_admin    := resolve_seed_user('00000000-0000-0000-0000-000000000001', 'admin@app.local', 'admin',        '{"username":"admin","role":"admin","name":"Administrator"}');
  uid_admin2   := resolve_seed_user('00000000-0000-0000-0000-000000000002', 'admin2@app.local', 'admin2',       '{"username":"admin2","role":"admin","name":"Operator Sekolah"}');
  uid_guru_mtk := resolve_seed_user('00000000-0000-0000-0000-000000000003', 'gurumatematika@app.local', 'guru123', '{"username":"gurumatematika","role":"guru","name":"Dr. Ahmad Syarif","mata_pelajaran":"Matematika"}');
  uid_guru_bio := resolve_seed_user('00000000-0000-0000-0000-000000000004', 'gurubiologi@app.local', 'guru123',   '{"username":"gurubiologi","role":"guru","name":"Siti Rahmawati, S.Si.","mata_pelajaran":"Biologi"}');
  uid_guru_ing := resolve_seed_user('00000000-0000-0000-0000-000000000005', 'guruinggris@app.local', 'guru123',   '{"username":"guruinggris","role":"guru","name":"John Doe, M.Pd.","mata_pelajaran":"Bahasa Inggris"}');
  uid_guru_pending := resolve_seed_user('00000000-0000-0000-0000-000000000006', 'gurubaharu@app.local', 'guru123', '{"username":"gurubaharu","role":"guru","name":"Farhan Kurniawan","mata_pelajaran":"Fisika","catatan_pendaftaran":"Saya ingin mengajar Fisika di sekolah ini"}');
  uid_siswa1  := resolve_seed_user('00000000-0000-0000-0000-000000000010', 'ahmad123@app.local', 'siswa123', '{"username":"ahmad123","role":"siswa","name":"Ahmad Rahman","kelas":"XII IPA 1"}');
  uid_siswa2  := resolve_seed_user('00000000-0000-0000-0000-000000000011', 'siti456@app.local', 'siswa123', '{"username":"siti456","role":"siswa","name":"Siti Nurhaliza","kelas":"XII IPA 1"}');
  uid_siswa3  := resolve_seed_user('00000000-0000-0000-0000-000000000012', 'budi789@app.local', 'siswa123', '{"username":"budi789","role":"siswa","name":"Budi Santoso","kelas":"XII IPS 1"}');
  uid_siswa4  := resolve_seed_user('00000000-0000-0000-0000-000000000013', 'maya101@app.local', 'siswa123', '{"username":"maya101","role":"siswa","name":"Maya Sari","kelas":"XI IPA 2"}');
  uid_siswa5  := resolve_seed_user('00000000-0000-0000-0000-000000000014', 'rizki202@app.local', 'siswa123', '{"username":"rizki202","role":"siswa","name":"Rizki Pratama","kelas":"XI IPS 2"}');
  uid_siswa6  := resolve_seed_user('00000000-0000-0000-0000-000000000015', 'dewi303@app.local', 'siswa123', '{"username":"dewi303","role":"siswa","name":"Dewi Lestari","kelas":"X IPA 1"}');
  uid_siswa7  := resolve_seed_user('00000000-0000-0000-0000-000000000016', 'fajar404@app.local', 'siswa123', '{"username":"fajar404","role":"siswa","name":"Fajar Nugroho","kelas":"X IPS 1"}');
  uid_siswa8  := resolve_seed_user('00000000-0000-0000-0000-000000000017', 'intan505@app.local', 'siswa123', '{"username":"intan505","role":"siswa","name":"Intan Permata","kelas":"XII IPA 2"}');
  uid_siswa9  := resolve_seed_user('00000000-0000-0000-0000-000000000018', 'gilang606@app.local', 'siswa123', '{"username":"gilang606","role":"siswa","name":"Gilang Ramadhan","kelas":"XII IPS 2"}');
  uid_siswa10 := resolve_seed_user('00000000-0000-0000-0000-000000000019', 'nadia707@app.local', 'siswa123', '{"username":"nadia707","role":"siswa","name":"Nadia Putri","kelas":"XI IPA 1"}');
  uid_siswa11 := resolve_seed_user('00000000-0000-0000-0000-000000000020', 'reza808@app.local', 'siswa123', '{"username":"reza808","role":"siswa","name":"Reza Pahlevi","kelas":"XII IPA 1"}');
  uid_siswa12 := resolve_seed_user('00000000-0000-0000-0000-000000000021', 'anggi909@app.local', 'siswa123', '{"username":"anggi909","role":"siswa","name":"Anggi Wijaya","kelas":"XI IPA 2"}');

  -- ===================== PROFILES =====================
  INSERT INTO profiles (id, username, email, role, name, mata_pelajaran, catatan_pendaftaran, kelas, jurusan, nama_sekolah, password_shown, status, student_class, student_group, rombel, page_url, last_activity, force_logout, created_at)
  VALUES
    (uid_admin, 'admin', 'admin@app.local', 'admin', 'Administrator', NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '', '', '', NULL, NULL, FALSE, '2025-01-01 08:00:00+07'),
    (uid_admin2, 'admin2', 'admin2@app.local', 'admin', 'Operator Sekolah', NULL, NULL, NULL, NULL, NULL, NULL, 'approved', '', '', '', NULL, NULL, FALSE, '2025-02-15 09:30:00+07')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, username, email, role, name, mata_pelajaran, catatan_pendaftaran, kelas, jurusan, nama_sekolah, password_shown, status, student_class, student_group, rombel, page_url, last_activity, force_logout, created_at)
  VALUES
    (uid_guru_mtk, 'gurumatematika', 'gurumatematika@app.local', 'guru', 'Dr. Ahmad Syarif', 'Matematika', NULL, NULL, NULL, NULL, NULL, 'approved', '', '', '', NULL, NULL, FALSE, '2025-01-10 10:00:00+07'),
    (uid_guru_bio, 'gurubiologi', 'gurubiologi@app.local', 'guru', 'Siti Rahmawati, S.Si.', 'Biologi', NULL, NULL, NULL, NULL, NULL, 'approved', '', '', '', NULL, NULL, FALSE, '2025-01-12 10:30:00+07'),
    (uid_guru_ing, 'guruinggris', 'guruinggris@app.local', 'guru', 'John Doe, M.Pd.', 'Bahasa Inggris', NULL, NULL, NULL, NULL, NULL, 'approved', '', '', '', NULL, NULL, FALSE, '2025-02-01 11:00:00+07'),
    (uid_guru_pending, 'gurubaharu', 'gurubaharu@app.local', 'guru', 'Farhan Kurniawan', 'Fisika', 'Saya ingin mengajar Fisika di sekolah ini', NULL, NULL, NULL, NULL, 'pending', '', '', '', NULL, NULL, FALSE, '2025-06-01 14:00:00+07')
  ON CONFLICT (id) DO NOTHING;

  INSERT INTO profiles (id, username, email, role, name, mata_pelajaran, catatan_pendaftaran, kelas, jurusan, nama_sekolah, password_shown, status, student_class, student_group, rombel, page_url, last_activity, force_logout, created_at)
  VALUES
    (uid_siswa1, 'ahmad123', 'ahmad123@app.local', 'siswa', 'Ahmad Rahman', NULL, NULL, 'XII IPA 1', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XII IPA 1', 'A', 'A', '/dashboard', '2025-06-10 14:30:00+07', FALSE, '2025-01-15 08:00:00+07'),
    (uid_siswa2, 'siti456', 'siti456@app.local', 'siswa', 'Siti Nurhaliza', NULL, NULL, 'XII IPA 1', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XII IPA 1', 'A', 'A', '/siswa/ujian', '2025-06-10 14:25:00+07', FALSE, '2025-01-15 08:05:00+07'),
    (uid_siswa3, 'budi789', 'budi789@app.local', 'siswa', 'Budi Santoso', NULL, NULL, 'XII IPS 1', 'IPS', 'SMA Negeri 2 Bandung', 'siswa123', 'approved', 'XII IPS 1', 'B', 'B', '/dashboard', '2025-06-10 13:00:00+07', FALSE, '2025-01-16 09:00:00+07'),
    (uid_siswa4, 'maya101', 'maya101@app.local', 'siswa', 'Maya Sari', NULL, NULL, 'XI IPA 2', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XI IPA 2', 'C', 'C', '/dashboard', '2025-06-10 12:00:00+07', FALSE, '2025-01-20 10:00:00+07'),
    (uid_siswa5, 'rizki202', 'rizki202@app.local', 'siswa', 'Rizki Pratama', NULL, NULL, 'XI IPS 2', 'IPS', 'SMA Negeri 2 Bandung', 'siswa123', 'approved', 'XI IPS 2', 'D', 'D', '/dashboard', '2025-06-09 16:00:00+07', FALSE, '2025-02-01 08:00:00+07'),
    (uid_siswa6, 'dewi303', 'dewi303@app.local', 'siswa', 'Dewi Lestari', NULL, NULL, 'X IPA 1', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'X IPA 1', 'A', 'A', '/dashboard', '2025-06-10 10:00:00+07', FALSE, '2025-02-10 09:00:00+07'),
    (uid_siswa7, 'fajar404', 'fajar404@app.local', 'siswa', 'Fajar Nugroho', NULL, NULL, 'X IPS 1', 'IPS', 'SMA Negeri 2 Bandung', 'siswa123', 'approved', 'X IPS 1', 'B', 'B', '/dashboard', '2025-06-10 09:00:00+07', FALSE, '2025-02-15 10:00:00+07'),
    (uid_siswa8, 'intan505', 'intan505@app.local', 'siswa', 'Intan Permata', NULL, NULL, 'XII IPA 2', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XII IPA 2', 'C', 'C', '/siswa/ujian', '2025-06-10 14:00:00+07', FALSE, '2025-01-18 08:30:00+07'),
    (uid_siswa9, 'gilang606', 'gilang606@app.local', 'siswa', 'Gilang Ramadhan', NULL, NULL, 'XII IPS 2', 'IPS', 'SMA Negeri 2 Bandung', 'siswa123', 'approved', 'XII IPS 2', 'D', 'D', '/dashboard', '2025-06-09 15:00:00+07', FALSE, '2025-01-22 09:15:00+07'),
    (uid_siswa10, 'nadia707', 'nadia707@app.local', 'siswa', 'Nadia Putri', NULL, NULL, 'XI IPA 1', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XI IPA 1', 'A', 'A', '/dashboard', '2025-06-10 11:00:00+07', FALSE, '2025-02-05 08:00:00+07'),
    (uid_siswa11, 'reza808', 'reza808@app.local', 'siswa', 'Reza Pahlevi', NULL, NULL, 'XII IPA 1', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XII IPA 1', 'A', 'A', '/dashboard', '2025-06-10 14:20:00+07', FALSE, '2025-01-15 08:10:00+07'),
    (uid_siswa12, 'anggi909', 'anggi909@app.local', 'siswa', 'Anggi Wijaya', NULL, NULL, 'XI IPA 2', 'IPA', 'SMA Negeri 1 Jakarta', 'siswa123', 'approved', 'XI IPA 2', 'C', 'C', '/dashboard', '2025-06-10 12:30:00+07', FALSE, '2025-02-08 09:00:00+07')
  ON CONFLICT (id) DO NOTHING;
END;
$$;

-- ============================================================
-- 5. RPC: get email by username (bypass RLS untuk login flow)
-- ============================================================
CREATE OR REPLACE FUNCTION get_email_by_username(p_username TEXT)
RETURNS TEXT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN (SELECT email FROM public.profiles WHERE username = p_username LIMIT 1);
END;
$$;

GRANT EXECUTE ON FUNCTION get_email_by_username TO anon;
GRANT EXECUTE ON FUNCTION get_email_by_username TO authenticated;

-- ============================================================
-- 6. TABEL SOAL (Bank Soal)
-- ============================================================
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  token_required BOOLEAN DEFAULT false,
  tanggal_unlimited BOOLEAN DEFAULT false,
  tampilan_jawaban VARCHAR(10) DEFAULT 'Urut',
  created_by_username TEXT
);

ALTER TABLE soal ENABLE ROW LEVEL SECURITY;

INSERT INTO soal (kode_soal, nama_soal, mapel, kelas, waktu_ujian, tanggal, status, tampilan_soal, kunci, token, created_by, created_at, token_required, tanggal_unlimited, tampilan_jawaban, created_by_username)
SELECT * FROM (VALUES
  ('MTK-2025-01', 'Matematika Dasar XII IPA', 'Matematika', 'XII IPA 1', 90, '2025-11-20'::date, 'Aktif', 'Acak', '[1:A],[2:C],[3:D],[4:B],[5:A],[6:B],[7:B],[8:C]', 'ABC123', (SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), '2025-10-01 08:00:00+07'::timestamptz, TRUE, FALSE, 'Acak', 'gurumatematika'),
  ('MTK-2025-02', 'Trigonometri Lanjutan', 'Matematika', 'XI IPA 1', 75, '2025-11-25'::date, 'Aktif', 'Urut', '[1:B],[2:A],[3:A],[4:B],[5:D]', NULL, (SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), '2025-10-05 09:00:00+07'::timestamptz, FALSE, FALSE, 'Urut', 'gurumatematika'),
  ('BIO-2025-01', 'Biologi Sel & Genetika', 'Biologi', 'XII IPA 1', 80, '2025-11-21'::date, 'Aktif', 'Acak', '[1:B],[2:B],[3:B],[4:B],[5:C],[6:A],[7:Salah]', 'DEF456', (SELECT id FROM profiles WHERE email = 'gurubiologi@app.local'), '2025-10-10 10:00:00+07'::timestamptz, TRUE, FALSE, 'Urut', 'gurubiologi'),
  ('BIO-2025-02', 'Ekologi & Lingkungan', 'Biologi', 'X IPA 1', 60, '2025-11-28'::date, 'Nonaktif', 'Urut', NULL, NULL, (SELECT id FROM profiles WHERE email = 'gurubiologi@app.local'), '2025-10-12 11:00:00+07'::timestamptz, FALSE, TRUE, 'Urut', 'gurubiologi'),
  ('ING-2025-01', 'English Grammar & Composition', 'Bahasa Inggris', 'XII IPA 1', 60, '2025-11-22'::date, 'Aktif', 'Acak', '[1:B],[2:B],[3:A],[4:B],[5:C],[6:B],[7:A],[8:C]', NULL, (SELECT id FROM profiles WHERE email = 'guruinggris@app.local'), '2025-10-15 08:30:00+07'::timestamptz, FALSE, FALSE, 'Acak', 'guruinggris'),
  ('ING-2025-02', 'Reading Comprehension', 'Bahasa Inggris', 'X IPS 1', 45, '2025-11-29'::date, 'Nonaktif', 'Urut', NULL, NULL, (SELECT id FROM profiles WHERE email = 'guruinggris@app.local'), '2025-10-20 09:00:00+07'::timestamptz, FALSE, TRUE, 'Urut', 'guruinggris'),
  ('MTK-2025-03', 'Statistika & Probabilitas', 'Matematika', 'XII IPS 1', 60, '2025-12-01'::date, 'Aktif', 'Urut', '[1:C],[2:C],[3:C],[4:A],[5:C],[6:A]', 'GHI789', (SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), '2025-10-25 10:00:00+07'::timestamptz, TRUE, FALSE, 'Urut', 'gurumatematika'),
  ('BIO-2025-03', 'Anatomi Tumbuhan', 'Biologi', 'XI IPA 2', 50, '2025-12-05'::date, 'Aktif', 'Acak', '[1:B],[2:A],[3:B],[4:A],[5:B]', NULL, (SELECT id FROM profiles WHERE email = 'gurubiologi@app.local'), '2025-11-01 11:00:00+07'::timestamptz, FALSE, FALSE, 'Acak', 'gurubiologi')
) AS v(kode_soal, nama_soal, mapel, kelas, waktu_ujian, tanggal, status, tampilan_soal, kunci, token, created_by, created_at, token_required, tanggal_unlimited, tampilan_jawaban, created_by_username)
WHERE NOT EXISTS (SELECT 1 FROM soal WHERE soal.kode_soal = v.kode_soal);

-- ============================================================
-- 7. TABEL BUTIR SOAL
-- ============================================================
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

ALTER TABLE butir_soal ENABLE ROW LEVEL SECURITY;

-- Soal MTK-2025-01 (10 butir: 8 PG + 2 Uraian)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'MTK-2025-01', 'Berapakah hasil dari 2 + 2 × 3?', 'Pilihan Ganda', '8', '10', '12', '6', 'A'),
(2, 'MTK-2025-01', 'Nilai dari sin 90° adalah...', 'Pilihan Ganda', '0', '0.5', '1', 'Tidak terdefinisi', 'C'),
(3, 'MTK-2025-01', 'Jika f(x) = 2x + 3, maka f(5) = ...', 'Pilihan Ganda', '10', '11', '12', '13', 'D'),
(4, 'MTK-2025-01', 'Bilangan prima antara 10 dan 20 adalah...', 'Pilihan Ganda', '11,13,15,17', '11,13,17,19', '13,17,19,23', '11,17,19,23', 'B'),
(5, 'MTK-2025-01', 'Akar dari persamaan x² - 5x + 6 = 0 adalah...', 'Pilihan Ganda', '2 dan 3', '-2 dan -3', '2 dan -3', '-2 dan 3', 'A'),
(6, 'MTK-2025-01', 'Luas lingkaran dengan jari-jari 7 cm adalah... (π = 22/7)', 'Pilihan Ganda', '144 cm²', '154 cm²', '164 cm²', '174 cm²', 'B'),
(7, 'MTK-2025-01', 'Dalam sebuah kantong ada 3 bola merah dan 5 bola biru. Peluang terambil bola merah adalah...', 'Pilihan Ganda', '3/5', '3/8', '5/8', '5/3', 'B'),
(8, 'MTK-2025-01', 'Nilai dari ³log 81 adalah...', 'Pilihan Ganda', '2', '3', '4', '5', 'C'),
(9, 'MTK-2025-01', 'Jelaskan langkah-langkah menyelesaikan sistem persamaan linear dua variabel dengan metode eliminasi! Berikan contoh.', 'Uraian', NULL, NULL, NULL, NULL, NULL),
(10, 'MTK-2025-01', 'Sebuah perusahaan memiliki biaya produksi C(x) = 5000 + 250x dan pendapatan R(x) = 500x. Tentukan titik impas (BEP) dan jelaskan artinya!', 'Uraian', NULL, NULL, NULL, NULL, NULL);

-- Soal MTK-2025-02 (5 butir PG)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'MTK-2025-02', 'Nilai dari sin 120° adalah...', 'Pilihan Ganda', '1/2', '(√3)/2', '-1/2', '-(√3)/2', 'B'),
(2, 'MTK-2025-02', 'Jika tan θ = 3/4, maka sin θ = ...', 'Pilihan Ganda', '3/5', '4/5', '3/4', '5/3', 'A'),
(3, 'MTK-2025-02', 'Himpunan penyelesaian dari sin x = 1/2 untuk 0° ≤ x ≤ 360° adalah...', 'Pilihan Ganda', '{30°,150°}', '{30°,210°}', '{30°,330°}', '{150°,210°}', 'A'),
(4, 'MTK-2025-02', 'Identitas trigonometri: sin² x + cos² x = ...', 'Pilihan Ganda', '0', '1', '2', 'sin x', 'B'),
(5, 'MTK-2025-02', 'Tentukan nilai dari cos 150°!', 'Pilihan Ganda', '1/2', '(√3)/2', '-1/2', '-(√3)/2', 'D');

-- Soal BIO-2025-01 (7 butir: 6 PG + 1 Benar/Salah)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'BIO-2025-01', 'Organel sel yang berfungsi sebagai pusat respirasi sel adalah...', 'Pilihan Ganda', 'Nukleus', 'Mitokondria', 'Ribosom', 'RE', 'B'),
(2, 'BIO-2025-01', 'Proses pembelahan sel yang menghasilkan 4 sel anak dengan kromosom haploid disebut...', 'Pilihan Ganda', 'Mitosis', 'Meiosis', 'Amitosis', 'Fragmentasi', 'B'),
(3, 'BIO-2025-01', 'DNA berbentuk heliks ganda, sedangkan RNA berbentuk...', 'Pilihan Ganda', 'Heliks ganda', 'Tunggal', 'Rantai melingkar', 'Pita lurus', 'B'),
(4, 'BIO-2025-01', 'Kodon AUG pada mRNA mengkode asam amino...', 'Pilihan Ganda', 'Valin', 'Metionin', 'Glisin', 'Alanin', 'B'),
(5, 'BIO-2025-01', 'Fase siklus sel yang paling panjang adalah...', 'Pilihan Ganda', 'Profase', 'Metafase', 'Interfase', 'Telofase', 'C'),
(6, 'BIO-2025-01', 'Hukum Mendel I dikenal sebagai hukum...', 'Pilihan Ganda', 'Segregasi', 'Asortasi', 'Dominansi', 'Backcross', 'A'),
(7, 'BIO-2025-01', 'Kloroplas hanya ditemukan pada sel hewan', 'Benar/Salah', 'Benar', 'Salah', NULL, NULL, '0:Salah');

-- Soal BIO-2025-02 (5 butir: 4 PG + 1 Uraian)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'BIO-2025-02', 'Komponen ekosistem yang terdiri dari produsen, konsumen, dan dekomposer adalah...', 'Pilihan Ganda', 'Biotik', 'Abiotik', 'Populasi', 'Komunitas', 'A'),
(2, 'BIO-2025-02', 'Peristiwa masuknya zat polutan ke dalam rantai makanan disebut...', 'Pilihan Ganda', 'Eutrofikasi', 'Bioakumulasi', 'Biomagnifikasi', 'Dekomposisi', 'C'),
(3, 'BIO-2025-02', 'Lapisan ozon berada di...', 'Pilihan Ganda', 'Troposfer', 'Stratosfer', 'Mesosfer', 'Termosfer', 'B'),
(4, 'BIO-2025-02', 'Contoh simbiosis mutualisme adalah...', 'Pilihan Ganda', 'Benalu dengan pohon', 'Kupu-kupu dengan bunga', 'Cacing dengan manusia', 'Anggrek dengan pohon', 'B'),
(5, 'BIO-2025-02', 'Apa yang dimaksud dengan efek rumah kaca? Sebutkan 3 gas penyebabnya!', 'Uraian', NULL, NULL, NULL, NULL, NULL);

-- Soal ING-2025-01 (8 butir PG)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'ING-2025-01', 'She ___ to school every day.', 'Pilihan Ganda', 'go', 'goes', 'going', 'gone', 'B'),
(2, 'ING-2025-01', 'They have ___ finished their homework.', 'Pilihan Ganda', 'yet', 'already', 'since', 'for', 'B'),
(3, 'ING-2025-01', '"I will call you tomorrow." Change to passive voice:', 'Pilihan Ganda', 'You will be called by me tomorrow', 'You will called by me tomorrow', 'You will be call by me tomorrow', 'You are called by me tomorrow', 'A'),
(4, 'ING-2025-01', '___ apple a day keeps the doctor away.', 'Pilihan Ganda', 'A', 'An', 'The', 'No article', 'B'),
(5, 'ING-2025-01', 'If I ___ rich, I would travel the world.', 'Pilihan Ganda', 'am', 'was', 'were', 'be', 'C'),
(6, 'ING-2025-01', 'The book ___ is on the table belongs to John.', 'Pilihan Ganda', 'who', 'which', 'whom', 'whose', 'B'),
(7, 'ING-2025-01', 'Arrange: always / she / coffee / drinks / morning / in / the', 'Pilihan Ganda', 'She always drinks coffee in the morning', 'Always she drinks coffee in the morning', 'She drinks always coffee in the morning', 'In the morning she always coffee drinks', 'A'),
(8, 'ING-2025-01', 'What is the correct plural form of "child"?', 'Pilihan Ganda', 'childs', 'childes', 'children', 'childrens', 'C');

-- Soal ING-2025-02 (5 butir: 4 PG + 1 Uraian)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'ING-2025-02', 'Read the text: "Jakarta is the capital city of Indonesia. It is located on the northwest coast of Java." What is the main idea?', 'Pilihan Ganda', 'Java is an island', 'Jakarta is the capital of Indonesia', 'Jakarta is on a coast', 'Indonesia has a capital', 'B'),
(2, 'ING-2025-02', 'The word "beautiful" in the sentence "What a beautiful view!" is...', 'Pilihan Ganda', 'Noun', 'Verb', 'Adjective', 'Adverb', 'C'),
(3, 'ING-2025-02', 'Synonym of "happy" is...', 'Pilihan Ganda', 'Sad', 'Angry', 'Glad', 'Tired', 'C'),
(4, 'ING-2025-02', 'Antonym of "expensive" is...', 'Pilihan Ganda', 'Cheap', 'Costly', 'Valuable', 'Pricey', 'A'),
(5, 'ING-2025-02', 'Write a short paragraph (3-5 sentences) describing your daily routine!', 'Uraian', NULL, NULL, NULL, NULL, NULL);

-- Soal MTK-2025-03 (6 butir PG)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'MTK-2025-03', 'Mean dari data 4, 6, 8, 10, 12 adalah...', 'Pilihan Ganda', '6', '7', '8', '9', 'C'),
(2, 'MTK-2025-03', 'Median dari data 3, 7, 9, 12, 15, 20 adalah...', 'Pilihan Ganda', '9', '10', '10.5', '11', 'C'),
(3, 'MTK-2025-03', 'Modus dari data 2, 3, 3, 4, 5, 5, 5, 6 adalah...', 'Pilihan Ganda', '3', '4', '5', '6', 'C'),
(4, 'MTK-2025-03', 'Peluang muncul mata dadu berjumlah 7 pada pelemparan dua dadu adalah...', 'Pilihan Ganda', '1/6', '1/12', '5/36', '1/9', 'A'),
(5, 'MTK-2025-03', 'Jika P(A) = 0.4 dan P(B) = 0.3 dengan A dan B saling lepas, maka P(A∪B) = ...', 'Pilihan Ganda', '0.1', '0.12', '0.7', '0.58', 'C'),
(6, 'MTK-2025-03', 'Dalam sebuah kotak ada 4 bola merah dan 6 bola putih. Diambil 2 bola sekaligus. Peluang terambil keduanya merah adalah...', 'Pilihan Ganda', '2/15', '4/15', '6/15', '8/15', 'A');

-- Soal BIO-2025-03 (5 butir: 4 PG + 1 Menjodohkan)
INSERT INTO butir_soal (nomer_soal, kode_soal, pertanyaan, tipe_soal, pilihan_1, pilihan_2, pilihan_3, pilihan_4, jawaban_benar) VALUES
(1, 'BIO-2025-03', 'Jaringan tumbuhan yang berfungsi sebagai pengangkut air dan mineral adalah...', 'Pilihan Ganda', 'Floem', 'Xilem', 'Kambium', 'Epidermis', 'B'),
(2, 'BIO-2025-03', 'Jaringan yang berfungsi mengangkut hasil fotosintesis adalah...', 'Pilihan Ganda', 'Floem', 'Xilem', 'Korteks', 'Endodermis', 'A'),
(3, 'BIO-2025-03', 'Stomata berfungsi sebagai...', 'Pilihan Ganda', 'Tempat fotosintesis', 'Alat pernapasan', 'Alat reproduksi', 'Alat pengangkut', 'B'),
(4, 'BIO-2025-03', 'Jaringan meristem terdapat pada...', 'Pilihan Ganda', 'Ujung akar dan ujung batang', 'Daun dan bunga', 'Batang dan daun', 'Akar dan daun', 'A'),
(5, 'BIO-2025-03', 'Pasangkan jaringan tumbuhan berikut dengan fungsinya: Epidermis → a.pelindung, Kolenkim → b.penguat, Palisade → c.fotosintesis', 'Menjodohkan', 'a.penguat, b.fotosintesis, c.pelindung', 'a.pelindung, b.penguat, c.fotosintesis', 'a.fotosintesis, b.pelindung, c.penguat', 'a.penguat, b.pelindung, c.fotosintesis', 'B');

-- ============================================================
-- 8. TABEL JAWABAN SISWA (sesi ujian)
-- ============================================================
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

ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;

INSERT INTO jawaban_siswa (id_siswa, kode_soal, jawaban, waktu_sisa, status_ujian, start_time, last_save, sesi_ke)
SELECT * FROM (VALUES
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', '{"1":"A","2":"C","3":"D","4":"B","5":"A","6":"B","7":"B","8":"C","9":"Jawaban uraian nomor 9","10":"Jawaban uraian nomor 10"}'::jsonb, 1200, 'Selesai', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 09:30:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'MTK-2025-01', '{"1":"A","2":"C","3":"D","4":"B","5":"A","6":"C","7":"B","8":"C","9":"Uraian Siti","10":"Uraian Siti"}'::jsonb, 1800, 'Selesai', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 09:15:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'budi789@app.local'), 'MTK-2025-01', '{"1":"B","2":"C","3":"D","4":"A","5":"A","6":"B","7":"C","8":"C"}'::jsonb, 2400, 'Aktif', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 08:45:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'dewi303@app.local'), 'MTK-2025-01', NULL::jsonb, 5400, 'Aktif', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 08:00:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-02', '{"1":"B","2":"A","3":"A","4":"B","5":"D"}'::jsonb, 3600, 'Selesai', '2025-11-25 10:00:00+07'::timestamptz, '2025-11-25 11:00:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'intan505@app.local'), 'MTK-2025-02', '{"1":"A","2":"A","3":"A","4":"B","5":"C"}'::jsonb, 4200, 'Aktif', '2025-11-25 10:00:00+07'::timestamptz, '2025-11-25 10:30:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'BIO-2025-01', '{"1":"B","2":"B","3":"B","4":"B","5":"C","6":"A","7":{"0":"Salah"},"8":"DNA double helix, RNA single strand"}'::jsonb, 2400, 'Selesai', '2025-11-21 08:00:00+07'::timestamptz, '2025-11-21 09:20:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'BIO-2025-01', '{"1":"A","2":"B","3":"A","4":"B","5":"C","6":"A","7":{"0":"Benar"},"8":"DNA vs RNA explanation"}'::jsonb, 3600, 'Selesai', '2025-11-21 08:00:00+07'::timestamptz, '2025-11-21 09:00:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'intan505@app.local'), 'BIO-2025-01', '{"1":"B","2":"B","3":"B","4":"C","5":"C","6":"A","7":{"0":"Salah"},"8":"DNA is double stranded"}'::jsonb, 1800, 'Aktif', '2025-11-21 08:00:00+07'::timestamptz, '2025-11-21 08:30:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'ING-2025-01', '{"1":"B","2":"B","3":"A","4":"B","5":"C","6":"B","7":"A","8":"C"}'::jsonb, 3000, 'Selesai', '2025-11-22 08:00:00+07'::timestamptz, '2025-11-22 08:50:00+07'::timestamptz, 1),
  ((SELECT id FROM profiles WHERE email = 'gilang606@app.local'), 'ING-2025-01', '{"1":"B","2":"A","3":"B","4":"B","5":"C","6":"A","7":"A","8":"C"}'::jsonb, 4200, 'Aktif', '2025-11-22 08:00:00+07'::timestamptz, '2025-11-22 09:00:00+07'::timestamptz, 1)
) AS v(id_siswa, kode_soal, jawaban, waktu_sisa, status_ujian, start_time, last_save, sesi_ke)
WHERE NOT EXISTS (
  SELECT 1 FROM jawaban_siswa j
  WHERE j.id_siswa = v.id_siswa AND j.kode_soal = v.kode_soal AND j.sesi_ke = v.sesi_ke
);

-- ============================================================
-- 9. TABEL NILAI (hasil ujian)
-- ============================================================
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

ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

INSERT INTO nilai (id_siswa, kode_soal, jawaban, jawaban_benar, jawaban_siswa_raw, jumlah_soal, jumlah_benar, jumlah_salah, nilai, detail_uraian, status_nilai, waktu_mulai, waktu_selesai)
SELECT * FROM (VALUES
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', '{"1":"A","2":"C","3":"D","4":"B","5":"A","6":"B","7":"B","8":"C","9":"Jawaban uraian nomor 9","10":"Jawaban uraian nomor 10"}'::jsonb, '[1:A],[2:C],[3:D],[4:B],[5:A],[6:B],[7:B],[8:C]', '[1:A],[2:C],[3:D],[4:B],[5:A],[6:B],[7:B],[8:C],[9:Jawaban uraian nomor 9],[10:Jawaban uraian nomor 10]', 10, 8, 0, 85.00, '{"9":80,"10":90}'::jsonb, 'uraian', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 09:30:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'MTK-2025-01', '{"1":"A","2":"C","3":"D","4":"B","5":"A","6":"C","7":"B","8":"C","9":"Uraian Siti","10":"Uraian Siti"}'::jsonb, '[1:A],[2:C],[3:D],[4:B],[5:A],[6:B],[7:B],[8:C]', '[1:A],[2:C],[3:D],[4:B],[5:A],[6:C],[7:B],[8:C],[9:Uraian Siti],[10:Uraian Siti]', 10, 7, 1, 72.00, '{"9":70,"10":60}'::jsonb, 'uraian', '2025-11-20 08:00:00+07'::timestamptz, '2025-11-20 09:15:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-02', '{"1":"B","2":"A","3":"A","4":"B","5":"D"}'::jsonb, '[1:B],[2:A],[3:A],[4:B],[5:D]', '[1:B],[2:A],[3:A],[4:B],[5:D]', 5, 5, 0, 100.00, '{}'::jsonb, 'lengkap', '2025-11-25 10:00:00+07'::timestamptz, '2025-11-25 11:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'BIO-2025-01', '{"1":"B","2":"B","3":"B","4":"B","5":"C","6":"A","7":{"0":"Salah"},"8":"DNA double helix, RNA single strand"}'::jsonb, '[1:B],[2:B],[3:B],[4:B],[5:C],[6:A],[7:0:Salah]', '[1:B],[2:B],[3:B],[4:B],[5:C],[6:A],[7:{"0":"Salah"}],[8:DNA double helix, RNA single strand]', 7, 6, 0, 85.71, '{"7":80}'::jsonb, 'uraian', '2025-11-21 08:00:00+07'::timestamptz, '2025-11-21 09:20:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'BIO-2025-01', '{"1":"A","2":"B","3":"A","4":"B","5":"C","6":"A","7":{"0":"Benar"},"8":"DNA vs RNA explanation"}'::jsonb, '[1:B],[2:B],[3:B],[4:B],[5:C],[6:A],[7:0:Salah]', '[1:A],[2:B],[3:A],[4:B],[5:C],[6:A],[7:{"0":"Benar"}],[8:DNA vs RNA explanation]', 7, 6, 1, 70.00, '{"7":50}'::jsonb, 'uraian', '2025-11-21 08:00:00+07'::timestamptz, '2025-11-21 09:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'ING-2025-01', '{"1":"B","2":"B","3":"A","4":"B","5":"C","6":"B","7":"A","8":"C"}'::jsonb, '[1:B],[2:B],[3:A],[4:B],[5:C],[6:B],[7:A],[8:C]', '[1:B],[2:B],[3:A],[4:B],[5:C],[6:B],[7:A],[8:C]', 8, 8, 0, 100.00, '{}'::jsonb, 'lengkap', '2025-11-22 08:00:00+07'::timestamptz, '2025-11-22 08:50:00+07'::timestamptz)
) AS v(id_siswa, kode_soal, jawaban, jawaban_benar, jawaban_siswa_raw, jumlah_soal, jumlah_benar, jumlah_salah, nilai, detail_uraian, status_nilai, waktu_mulai, waktu_selesai)
WHERE NOT EXISTS (
  SELECT 1 FROM nilai n
  WHERE n.id_siswa = v.id_siswa AND n.kode_soal = v.kode_soal
);

-- ============================================================
-- 10. TABEL ACTIVITY LOGS (anti-cheat)
-- ============================================================
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id),
  kode_soal VARCHAR(200) REFERENCES soal(kode_soal) ON DELETE CASCADE,
  aktivitas TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

INSERT INTO activity_logs (id_siswa, kode_soal, aktivitas, detail, created_at)
SELECT * FROM (VALUES
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', 'memulai_ujian', '{"browser":"Chrome 125","os":"Windows 10"}'::jsonb, '2025-11-20 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', 'menjawab_soal', '{"nomer":1,"jawaban":"A"}'::jsonb, '2025-11-20 08:02:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', 'pindah_tab', '{"durasi_detik":3}'::jsonb, '2025-11-20 08:15:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', 'menjawab_soal', '{"nomer":8,"jawaban":"C"}'::jsonb, '2025-11-20 08:50:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'MTK-2025-01', 'menyelesaikan_ujian', '{"waktu_tempuh":5400}'::jsonb, '2025-11-20 09:30:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'MTK-2025-01', 'memulai_ujian', '{"browser":"Firefox 130","os":"Windows 11"}'::jsonb, '2025-11-20 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'budi789@app.local'), 'MTK-2025-01', 'memulai_ujian', '{"browser":"Chrome 126","os":"macOS 14"}'::jsonb, '2025-11-20 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'budi789@app.local'), 'MTK-2025-01', 'curang_detected', '{"tipe":"multiple_tab","detail":"Terdeteksi membuka tab baru"}'::jsonb, '2025-11-20 08:10:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'budi789@app.local'), 'MTK-2025-01', 'pindah_tab', '{"durasi_detik":8}'::jsonb, '2025-11-20 08:20:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'intan505@app.local'), 'BIO-2025-01', 'memulai_ujian', '{"browser":"Edge 125","os":"Windows 10"}'::jsonb, '2025-11-21 08:00:00+07'::timestamptz)
) AS v(id_siswa, kode_soal, aktivitas, detail, created_at);

-- ============================================================
-- 11. TABEL NOTIFICATIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS notifications (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL DEFAULT 'info' CHECK (type IN ('info', 'warning', 'success', 'error', 'exam')),
  link TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

INSERT INTO notifications (user_id, role, title, message, type, link, is_read, created_at)
SELECT * FROM (VALUES
  ((SELECT id FROM profiles WHERE email = 'admin@app.local'), 'admin', 'Guru Baru Mendaftar', 'Farhan Kurniawan mendaftar sebagai guru Fisika. Silakan review.', 'info', '/admin/guru', FALSE, '2025-06-01 14:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'admin@app.local'), 'admin', 'Ujian Akan Dimulai', 'Ujian Matematika Dasar akan dimulai besok.', 'exam', '/admin/monitoring', FALSE, '2025-11-19 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'admin@app.local'), 'admin', 'Siswa Selesai Ujian', '10 siswa telah menyelesaikan ujian Matematika Dasar.', 'success', '/admin/hasil', TRUE, '2025-11-20 10:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'admin2@app.local'), 'admin', 'Selamat Datang', 'Akun Operator Sekolah berhasil dibuat.', 'success', '/admin', TRUE, '2025-02-15 09:30:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), 'guru', 'Ujian Dibuat', 'Soal "Matematika Dasar XII IPA" berhasil dibuat dan diaktifkan.', 'success', '/guru/bank-soal', TRUE, '2025-10-01 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), 'guru', 'Token Diperbarui', 'Token untuk MTK-2025-01 telah diperbarui menjadi ABC123.', 'info', '/guru/bank-soal', FALSE, '2025-11-01 10:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'gurumatematika@app.local'), 'guru', 'Hasil Ujian Tersedia', 'Hasil ujian Matematika Dasar sudah siap dilihat.', 'exam', '/guru/hasil', FALSE, '2025-11-20 10:30:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'gurubiologi@app.local'), 'guru', 'Peringatan Penyimpanan', 'Kapasitas penyimpanan gambar hampir penuh.', 'warning', '/guru/upload-gambar', FALSE, '2025-11-15 09:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'guruinggris@app.local'), 'guru', 'Soal Nonaktif', 'Soal "Reading Comprehension" otomatis dinonaktifkan karena sudah lewat tanggal.', 'warning', '/guru/bank-soal', TRUE, '2025-11-30 00:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'guruinggris@app.local'), 'guru', 'Selamat Datang', 'Akun guru Bahasa Inggris berhasil diaktivasi.', 'success', '/guru', TRUE, '2025-02-01 11:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'siswa', 'Ujian Tersedia', 'Ujian Matematika Dasar telah tersedia untuk Anda.', 'exam', '/siswa/ujian', TRUE, '2025-11-15 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'ahmad123@app.local'), 'siswa', 'Hasil Ujian', 'Nilai ujian Matematika Dasar Anda: 85.', 'success', '/siswa/hasil', FALSE, '2025-11-20 10:30:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'siswa', 'Ujian Tersedia', 'Ujian Biologi Sel & Genetika telah tersedia.', 'exam', '/siswa/ujian', TRUE, '2025-11-16 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'siswa', 'Hasil Ujian', 'Nilai ujian Biologi Sel & Genetika Anda: 70.', 'success', '/siswa/hasil', FALSE, '2025-11-21 10:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'dewi303@app.local'), 'siswa', 'Peringatan!', 'Anda terdeteksi membuka tab lain saat ujian. Harap fokus pada ujian!', 'warning', '/siswa/ujian', FALSE, '2025-11-20 08:20:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'budi789@app.local'), 'siswa', 'Peringatan!', 'Aktivitas mencurigakan terdeteksi saat ujian Matematika.', 'error', '/siswa/ujian', FALSE, '2025-11-20 08:10:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'siti456@app.local'), 'siswa', 'Info Akademik', 'Jadwal ujian semester ganjil telah dirilis.', 'info', NULL, FALSE, '2025-11-10 08:00:00+07'::timestamptz),
  ((SELECT id FROM profiles WHERE email = 'intan505@app.local'), 'siswa', 'Nilai Diperbarui', 'Nilai ujian Biologi Anda telah diperbarui oleh guru.', 'info', '/siswa/hasil', FALSE, '2025-11-22 14:00:00+07'::timestamptz)
) AS v(user_id, role, title, message, type, link, is_read, created_at);

-- ============================================================
-- 12. TABEL SETTINGS (single row)
-- ============================================================
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER DEFAULT 1 PRIMARY KEY,
  data JSONB NOT NULL DEFAULT '{
    "app_name": "CBT-Eschool",
    "school_logo": "",
    "theme_color": "#0d6efd",
    "sync_interval_seconds": 60,
    "hide_scores": false,
    "allow_multiple_login": false,
    "app_version": "2.0.0"
  }'
);

ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

INSERT INTO settings (id, data)
VALUES (1, '{
  "app_name": "Mathematalk CBT",
  "school_logo": "",
  "theme_color": "#b89440",
  "sync_interval_seconds": 30,
  "hide_scores": false,
  "allow_multiple_login": true,
  "app_version": "2.1.0"
}')
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- 13. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_butir_soal_kode ON butir_soal(kode_soal);
CREATE INDEX IF NOT EXISTS idx_butir_soal_nomer ON butir_soal(kode_soal, nomer_soal);
CREATE INDEX IF NOT EXISTS idx_soal_status ON soal(status);
CREATE INDEX IF NOT EXISTS idx_soal_mapel ON soal(mapel);
CREATE INDEX IF NOT EXISTS idx_jawaban_siswa ON jawaban_siswa(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa ON nilai(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_siswa ON activity_logs(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kelas ON profiles(kelas);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_unread ON notifications(user_id) WHERE NOT is_read;

-- ============================================================
-- 14. RLS POLICIES FOR ALL TABLES
-- ============================================================

-- Soal policies
DROP POLICY IF EXISTS "Admin full access on soal" ON soal;
DROP POLICY IF EXISTS "Guru select on soal" ON soal;
DROP POLICY IF EXISTS "Guru insert on soal" ON soal;
DROP POLICY IF EXISTS "Guru update own soal" ON soal;
DROP POLICY IF EXISTS "Siswa select active soal" ON soal;

CREATE POLICY "Admin full access on soal" ON soal FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru select on soal" ON soal FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru'));
CREATE POLICY "Guru insert on soal" ON soal FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru'));
CREATE POLICY "Guru update own soal" ON soal FOR UPDATE USING (
  created_by = auth.uid() OR EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Siswa select active soal" ON soal FOR SELECT USING (
  status = 'Aktif' AND
  (kelas = (SELECT kelas FROM profiles WHERE id = auth.uid()) OR
   EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))));

-- Butir soal policies
DROP POLICY IF EXISTS "Admin full access on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Guru select on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Guru insert on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Guru update on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Guru delete on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Siswa select butir_soal" ON butir_soal;

CREATE POLICY "Admin full access on butir_soal" ON butir_soal FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru select on butir_soal" ON butir_soal FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin')));
CREATE POLICY "Guru insert on butir_soal" ON butir_soal FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin')));
CREATE POLICY "Guru update on butir_soal" ON butir_soal FOR UPDATE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin')));
CREATE POLICY "Guru delete on butir_soal" ON butir_soal FOR DELETE USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('guru', 'admin')));
CREATE POLICY "Siswa select butir_soal" ON butir_soal FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('siswa', 'admin', 'guru')));

-- Jawaban siswa policies
DROP POLICY IF EXISTS "Siswa select own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Siswa insert own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Siswa update own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Admin full on jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Guru select jawaban" ON jawaban_siswa;

CREATE POLICY "Siswa select own jawaban" ON jawaban_siswa FOR SELECT USING (id_siswa = auth.uid());
CREATE POLICY "Siswa insert own jawaban" ON jawaban_siswa FOR INSERT WITH CHECK (id_siswa = auth.uid());
CREATE POLICY "Siswa update own jawaban" ON jawaban_siswa FOR UPDATE USING (id_siswa = auth.uid());
CREATE POLICY "Admin full on jawaban" ON jawaban_siswa FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru select jawaban" ON jawaban_siswa FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru') AND (
    kode_soal IN (
      SELECT kode_soal FROM soal WHERE created_by_username = (
        SELECT username FROM profiles WHERE id = auth.uid()
      )
    )
  )
);

-- Nilai policies
DROP POLICY IF EXISTS "Siswa select own nilai" ON nilai;
DROP POLICY IF EXISTS "Admin full on nilai" ON nilai;
DROP POLICY IF EXISTS "Guru select nilai" ON nilai;

CREATE POLICY "Siswa select own nilai" ON nilai FOR SELECT USING (id_siswa = auth.uid());
CREATE POLICY "Admin full on nilai" ON nilai FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru select nilai" ON nilai FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru') AND (
    kode_soal IN (
      SELECT kode_soal FROM soal WHERE created_by_username = (
        SELECT username FROM profiles WHERE id = auth.uid()
      )
    )
  )
);

-- Activity logs policies
DROP POLICY IF EXISTS "Siswa insert own activity" ON activity_logs;
DROP POLICY IF EXISTS "Siswa select own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admin full on activity_logs" ON activity_logs;

CREATE POLICY "Siswa insert own activity" ON activity_logs FOR INSERT WITH CHECK (id_siswa = auth.uid());
CREATE POLICY "Siswa select own activity" ON activity_logs FOR SELECT USING (id_siswa = auth.uid());
CREATE POLICY "Admin full on activity_logs" ON activity_logs FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Notifications policies
DROP POLICY IF EXISTS "users_read_own_notifications" ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications" ON notifications;

CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- Settings policies
DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON settings;
DROP POLICY IF EXISTS "Only admins can update settings" ON settings;
DROP POLICY IF EXISTS "Only admins can insert settings" ON settings;

CREATE POLICY "Anyone authenticated can read settings" ON settings FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can update settings" ON settings FOR UPDATE TO authenticated
  USING ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin')
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');
CREATE POLICY "Only admins can insert settings" ON settings FOR INSERT TO authenticated
  WITH CHECK ((SELECT role FROM profiles WHERE id = auth.uid()) = 'admin');

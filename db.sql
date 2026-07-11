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

CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT
  USING (public.is_admin());

CREATE POLICY "admin_update_all_profiles"
  ON profiles FOR UPDATE
  USING (public.is_admin());

CREATE POLICY "admin_insert_all_profiles"
  ON profiles FOR INSERT
  WITH CHECK (public.is_admin());

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
    student_group, status
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
    NEW.raw_user_meta_data->>'student_group',
    CASE WHEN _role IN ('admin','siswa') THEN 'approved' ELSE 'pending' END
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
-- 4. RPC: get email by username (bypass RLS untuk login flow)
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
  created_by_username TEXT,
  semua_kelas BOOLEAN DEFAULT false
);

ALTER TABLE soal ENABLE ROW LEVEL SECURITY;

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
DROP POLICY IF EXISTS "Guru delete own soal" ON soal;
DROP POLICY IF EXISTS "Siswa select active soal" ON soal;

CREATE POLICY "Admin full access on soal" ON soal FOR ALL USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru select on soal" ON soal FOR SELECT USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru'));
CREATE POLICY "Guru insert on soal" ON soal FOR INSERT WITH CHECK (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'guru'));
CREATE POLICY "Guru update own soal" ON soal FOR UPDATE USING (
  created_by_username = (SELECT username FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Guru delete own soal" ON soal FOR DELETE USING (
  created_by_username = (SELECT username FROM profiles WHERE id = auth.uid()) OR
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));
CREATE POLICY "Siswa select active soal" ON soal FOR SELECT USING (
  status = 'Aktif' AND
  (kelas = (SELECT kelas FROM profiles WHERE id = auth.uid()) OR
   semua_kelas = true OR
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

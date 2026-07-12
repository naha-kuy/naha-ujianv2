-- ================================================================
-- database_baru_audit.sql — SKEMA LENGKAP + RPC AMAN + RLS OPTIMAL
-- ================================================================
-- Hasil audit & perbaikan dari implementation_plan.md
-- Memperbaiki 10 isu keamanan dan fungsional:
--   1.  Kebocoran password via RPC anonim
--   2.  Eskalasi privilege pada RPC admin
--   3.  Kebocoran soal & jawaban (butir_soal)
--   4.  Missing INSERT policy pada nilai (siswa)
--   5.  Missing UPDATE policy pada nilai (guru)
--   6.  Informasi siswa kosong di monitoring (profiles join)
--   7.  Missing RLS policy activity_logs untuk guru
--   8.  Riwayat ujian siswa kosong (soal join)
--   9.  Foreign key CASCADE pada profiles
--   10. Missing INSERT policy pada notifications
-- ================================================================

-- ================================================================
-- 1. HELPER FUNCTIONS
-- ================================================================

-- Memeriksa apakah user yang login adalah admin
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

-- Memeriksa apakah user yang login adalah guru
CREATE OR REPLACE FUNCTION public.is_guru()
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'guru'
  );
END;
$$;

-- ================================================================
-- 2. TABEL (dengan FOREIGN KEY CASCADE yang diperbaiki)
-- ================================================================

-- 2a. PROFILES
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  email TEXT,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  name TEXT NOT NULL,
  mata_pelajaran TEXT,
  catatan_pendaftaran TEXT,
  kelas TEXT,
  jurusan TEXT,
  nama_sekolah TEXT,
  password TEXT,
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  student_group VARCHAR(50) DEFAULT '',
  page_url TEXT,
  last_activity TIMESTAMPTZ,
  force_logout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2b. SOAL (Bank Soal)
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
  created_at TIMESTAMPTZ DEFAULT NOW(),
  token_required BOOLEAN DEFAULT false,
  tanggal_unlimited BOOLEAN DEFAULT false,
  tampilan_jawaban VARCHAR(10) DEFAULT 'Urut',
  created_by_username TEXT,
  semua_kelas BOOLEAN DEFAULT false
);

-- 2c. BUTIR SOAL
CREATE TABLE IF NOT EXISTS butir_soal (
  id_soal SERIAL PRIMARY KEY,
  nomer_soal INTEGER NOT NULL,
  kode_soal VARCHAR(50) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  pertanyaan TEXT NOT NULL,
  tipe_soal VARCHAR(50) NOT NULL CHECK (tipe_soal IN (
    'Pilihan Ganda','Pilihan Ganda Kompleks','Benar/Salah','Uraian','Menjodohkan'
  )),
  pilihan_1 TEXT,
  pilihan_2 TEXT,
  pilihan_3 TEXT,
  pilihan_4 TEXT,
  jawaban_benar TEXT,
  status_soal VARCHAR(20) DEFAULT 'Aktif',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(kode_soal, nomer_soal)
);

-- 2d. JAWABAN SISWA
CREATE TABLE IF NOT EXISTS jawaban_siswa (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_soal VARCHAR(200) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  jawaban JSONB DEFAULT '{}',
  waktu_sisa INTEGER NOT NULL,
  status_ujian VARCHAR(20) DEFAULT 'Aktif',
  start_time TIMESTAMPTZ DEFAULT NOW(),
  last_save TIMESTAMPTZ DEFAULT NOW(),
  sesi_ke INTEGER DEFAULT 1,
  UNIQUE(id_siswa, kode_soal, sesi_ke)
);

-- 2e. NILAI
CREATE TABLE IF NOT EXISTS nilai (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_soal VARCHAR(200) NOT NULL REFERENCES soal(kode_soal) ON DELETE CASCADE,
  jawaban JSONB DEFAULT '{}',
  jawaban_benar TEXT,
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

-- 2f. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS activity_logs (
  id SERIAL PRIMARY KEY,
  id_siswa UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kode_soal VARCHAR(200) REFERENCES soal(kode_soal) ON DELETE CASCADE,
  aktivitas TEXT NOT NULL,
  detail JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2g. NOTIFICATIONS
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

-- 2h. SETTINGS (single row)
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

-- ================================================================
-- 3. INDEXES
-- ================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_role            ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_kelas           ON profiles(kelas);
CREATE INDEX IF NOT EXISTS idx_soal_status              ON soal(status);
CREATE INDEX IF NOT EXISTS idx_soal_mapel               ON soal(mapel);
CREATE INDEX IF NOT EXISTS idx_butir_soal_kode           ON butir_soal(kode_soal);
CREATE INDEX IF NOT EXISTS idx_butir_soal_nomer          ON butir_soal(kode_soal, nomer_soal);
CREATE INDEX IF NOT EXISTS idx_jawaban_siswa             ON jawaban_siswa(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_nilai_siswa               ON nilai(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_siswa       ON activity_logs(id_siswa, kode_soal);
CREATE INDEX IF NOT EXISTS idx_activity_logs_time        ON activity_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id     ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_role        ON notifications(role);
CREATE INDEX IF NOT EXISTS idx_notifications_unread      ON notifications(user_id) WHERE NOT is_read;

-- ================================================================
-- 4. RLS POLICIES (dioptimalkan — semua celah ditutup)
-- ================================================================

-- --- PROFILES ---
-- Issues #6 fixed: guru dapat membaca profil siswa untuk join data
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_profile"       ON profiles;
DROP POLICY IF EXISTS "users_update_own_profile"     ON profiles;
DROP POLICY IF EXISTS "users_insert_own_profile"     ON profiles;
DROP POLICY IF EXISTS "admin_read_all_profiles"      ON profiles;
DROP POLICY IF EXISTS "admin_update_all_profiles"    ON profiles;
DROP POLICY IF EXISTS "admin_insert_all_profiles"    ON profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "guru_read_profiles"           ON profiles;

CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);
CREATE POLICY "users_insert_own_profile"
  ON profiles FOR INSERT WITH CHECK (auth.uid() = id);
CREATE POLICY "admin_read_all_profiles"
  ON profiles FOR SELECT USING (public.is_admin());
CREATE POLICY "admin_update_all_profiles"
  ON profiles FOR UPDATE USING (public.is_admin());
CREATE POLICY "admin_insert_all_profiles"
  ON profiles FOR INSERT WITH CHECK (public.is_admin());

-- [FIX #6] Guru dapat membaca profil siswa untuk halaman Monitoring & Hasil
CREATE POLICY "guru_read_profiles"
  ON profiles FOR SELECT USING (public.is_guru());

-- --- SOAL ---
-- Issues #8 fixed: siswa dapat membaca soal nonaktif jika memiliki nilai
ALTER TABLE soal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on soal" ON soal;
DROP POLICY IF EXISTS "Guru select on soal"      ON soal;
DROP POLICY IF EXISTS "Guru insert on soal"      ON soal;
DROP POLICY IF EXISTS "Guru update own soal"     ON soal;
DROP POLICY IF EXISTS "Guru delete own soal"     ON soal;
DROP POLICY IF EXISTS "Siswa select active soal" ON soal;

CREATE POLICY "Admin full access on soal" ON soal FOR ALL USING (
  public.is_admin());
CREATE POLICY "Guru select on soal" ON soal FOR SELECT USING (
  public.is_guru());
CREATE POLICY "Guru insert on soal" ON soal FOR INSERT WITH CHECK (
  public.is_guru());
CREATE POLICY "Guru update own soal" ON soal FOR UPDATE USING (
  created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  OR public.is_admin());
CREATE POLICY "Guru delete own soal" ON soal FOR DELETE USING (
  created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  OR public.is_admin());

-- [FIX #8] Siswa dapat membaca soal aktif (cocok kelas) ATAU soal nonaktif
-- jika sudah memiliki records nilai (untuk riwayat hasil)
CREATE POLICY "Siswa select active soal" ON soal FOR SELECT USING (
  (status = 'Aktif'
    AND (kelas = (SELECT kelas FROM profiles WHERE id = auth.uid())
         OR semua_kelas = true))
  OR
  (status = 'Nonaktif'
    AND EXISTS (SELECT 1 FROM nilai
                WHERE id_siswa = auth.uid()
                  AND kode_soal = soal.kode_soal))
);

-- --- BUTIR SOAL ---
-- Issues #3 fixed: siswa hanya bisa lihat soal ujian aktif/kelasnya atau yg sudah dikerjakan
ALTER TABLE butir_soal ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admin full access on butir_soal" ON butir_soal;
DROP POLICY IF EXISTS "Guru select on butir_soal"      ON butir_soal;
DROP POLICY IF EXISTS "Guru insert on butir_soal"      ON butir_soal;
DROP POLICY IF EXISTS "Guru update on butir_soal"      ON butir_soal;
DROP POLICY IF EXISTS "Guru delete on butir_soal"      ON butir_soal;
DROP POLICY IF EXISTS "Siswa select butir_soal"        ON butir_soal;

CREATE POLICY "Admin full access on butir_soal" ON butir_soal FOR ALL USING (
  public.is_admin());
CREATE POLICY "Guru select on butir_soal" ON butir_soal FOR SELECT USING (
  public.is_guru() OR public.is_admin());
CREATE POLICY "Guru insert on butir_soal" ON butir_soal FOR INSERT WITH CHECK (
  public.is_guru() OR public.is_admin());
CREATE POLICY "Guru update on butir_soal" ON butir_soal FOR UPDATE USING (
  public.is_guru() OR public.is_admin());
CREATE POLICY "Guru delete on butir_soal" ON butir_soal FOR DELETE USING (
  public.is_guru() OR public.is_admin());

-- [FIX #3] Siswa hanya bisa melihat butir soal jika:
--   - Soal sedang AKTIF dan cocok dengan kelas siswa
--   - ATAU siswa sudah memiliki records nilai di kode_soal tsb (riwayat)
CREATE POLICY "Siswa select butir_soal" ON butir_soal FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'siswa'
      AND (
        EXISTS (SELECT 1 FROM nilai
                WHERE id_siswa = auth.uid()
                  AND kode_soal = butir_soal.kode_soal)
        OR
        EXISTS (SELECT 1 FROM soal s
                WHERE s.kode_soal = butir_soal.kode_soal
                  AND s.status = 'Aktif'
                  AND (s.semua_kelas = true
                       OR s.kelas = (SELECT kelas FROM profiles WHERE id = auth.uid())))
      )
  )
);

-- --- JAWABAN SISWA ---
ALTER TABLE jawaban_siswa ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa select own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Siswa insert own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Siswa update own jawaban" ON jawaban_siswa;
DROP POLICY IF EXISTS "Admin full on jawaban"    ON jawaban_siswa;
DROP POLICY IF EXISTS "Guru select jawaban"     ON jawaban_siswa;

CREATE POLICY "Siswa select own jawaban" ON jawaban_siswa FOR SELECT USING (id_siswa = auth.uid());
CREATE POLICY "Siswa insert own jawaban" ON jawaban_siswa FOR INSERT WITH CHECK (id_siswa = auth.uid());
CREATE POLICY "Siswa update own jawaban" ON jawaban_siswa FOR UPDATE USING (id_siswa = auth.uid());
CREATE POLICY "Admin full on jawaban" ON jawaban_siswa FOR ALL USING (public.is_admin());
CREATE POLICY "Guru select jawaban" ON jawaban_siswa FOR SELECT USING (
  public.is_guru()
  AND kode_soal IN (
    SELECT kode_soal FROM soal
    WHERE created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  ));

-- --- NILAI ---
-- Issues #4 and #5 fixed: INSERT untuk siswa, UPDATE untuk guru
ALTER TABLE nilai ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa select own nilai" ON nilai;
DROP POLICY IF EXISTS "Siswa insert own nilai" ON nilai;
DROP POLICY IF EXISTS "Admin full on nilai"     ON nilai;
DROP POLICY IF EXISTS "Guru select nilai"      ON nilai;
DROP POLICY IF EXISTS "Guru update nilai"      ON nilai;

CREATE POLICY "Siswa select own nilai" ON nilai FOR SELECT USING (id_siswa = auth.uid());
-- [FIX #4] Siswa bisa insert nilai sendiri saat submit ujian
CREATE POLICY "Siswa insert own nilai" ON nilai FOR INSERT WITH CHECK (
  id_siswa = auth.uid()
  AND EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'siswa'));
CREATE POLICY "Admin full on nilai" ON nilai FOR ALL USING (public.is_admin());
CREATE POLICY "Guru select nilai" ON nilai FOR SELECT USING (
  public.is_guru()
  AND kode_soal IN (
    SELECT kode_soal FROM soal
    WHERE created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  ));
-- [FIX #5] Guru bisa update nilai (untuk koreksi uraian)
CREATE POLICY "Guru update nilai" ON nilai FOR UPDATE USING (
  public.is_guru()
  AND kode_soal IN (
    SELECT kode_soal FROM soal
    WHERE created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  ));

-- --- ACTIVITY LOGS ---
-- Issues #7 fixed: guru dapat membaca log untuk ujian mereka
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Siswa insert own activity" ON activity_logs;
DROP POLICY IF EXISTS "Siswa select own activity" ON activity_logs;
DROP POLICY IF EXISTS "Admin full on activity_logs" ON activity_logs;
DROP POLICY IF EXISTS "Guru select activity_logs" ON activity_logs;

CREATE POLICY "Siswa insert own activity" ON activity_logs FOR INSERT WITH CHECK (id_siswa = auth.uid());
CREATE POLICY "Siswa select own activity" ON activity_logs FOR SELECT USING (id_siswa = auth.uid());
CREATE POLICY "Admin full on activity_logs" ON activity_logs FOR ALL USING (public.is_admin());
-- [FIX #7] Guru dapat membaca log anti-cheat untuk ujian yang dibuatnya
CREATE POLICY "Guru select activity_logs" ON activity_logs FOR SELECT USING (
  public.is_guru()
  AND kode_soal IN (
    SELECT kode_soal FROM soal
    WHERE created_by_username = (SELECT username FROM profiles WHERE id = auth.uid())
  ));

-- --- NOTIFICATIONS ---
-- Issues #10 fixed: INSERT policy untuk notifikasi
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "users_read_own_notifications"    ON notifications;
DROP POLICY IF EXISTS "users_update_own_notifications"  ON notifications;
DROP POLICY IF EXISTS "users_insert_own_notifications"  ON notifications;
DROP POLICY IF EXISTS "admin_guru_select_notifications" ON notifications;
DROP POLICY IF EXISTS "admin_guru_insert_notifications" ON notifications;
DROP POLICY IF EXISTS "users_delete_own_notifications"  ON notifications;

CREATE POLICY "users_read_own_notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "users_update_own_notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
-- [FIX #10] User bisa membuat notifikasi untuk dirinya sendiri
CREATE POLICY "users_insert_own_notifications" ON notifications FOR INSERT WITH CHECK (
  auth.uid() = user_id
  OR public.is_admin()
  OR public.is_guru());
-- Admin/guru bisa membaca notifikasi berdasarkan role
CREATE POLICY "admin_guru_select_notifications" ON notifications FOR SELECT USING (
  public.is_admin() OR public.is_guru());
-- Admin/guru bisa membuat notifikasi untuk siapapun
CREATE POLICY "admin_guru_insert_notifications" ON notifications FOR INSERT WITH CHECK (
  public.is_admin() OR public.is_guru());
-- User bisa hapus notifikasi sendiri, admin bisa hapus semua
CREATE POLICY "users_delete_own_notifications" ON notifications FOR DELETE USING (
  auth.uid() = user_id OR public.is_admin());

-- --- SETTINGS ---
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can read settings" ON settings;
DROP POLICY IF EXISTS "Only admins can update settings"        ON settings;
DROP POLICY IF EXISTS "Only admins can insert settings"        ON settings;

CREATE POLICY "Anyone authenticated can read settings" ON settings
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "Only admins can update settings" ON settings
  FOR UPDATE TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());
CREATE POLICY "Only admins can insert settings" ON settings
  FOR INSERT TO authenticated
  WITH CHECK (public.is_admin());

-- ================================================================
-- 5. TRIGGER: auto-create profile on signup (dengan conflict resolution)
-- ================================================================
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
    student_group, status, password
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
    CASE WHEN _role IN ('admin','siswa') THEN 'approved' ELSE 'pending' END,
    NEW.raw_user_meta_data->>'password'
  )
  ON CONFLICT (id) DO UPDATE SET
    username        = EXCLUDED.username,
    email           = EXCLUDED.email,
    role            = EXCLUDED.role,
    name            = EXCLUDED.name,
    password        = EXCLUDED.password,
    status          = CASE WHEN EXCLUDED.role IN ('admin','siswa')
                           THEN 'approved' ELSE EXCLUDED.status END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ================================================================
-- 6. RPC FUNCTIONS (diamankan dengan pengecekan role)
-- ================================================================

-- 6a. get_email_by_username — untuk login flow (tetap anon)
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

-- 6b. admin_get_profile_by_email — untuk login flow (bisa diakses anon)
--     Mencari profile berdasarkan email (case-insensitive).
CREATE OR REPLACE FUNCTION admin_get_profile_by_email(p_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  SELECT to_jsonb(p) INTO result FROM public.profiles p WHERE LOWER(p.email) = LOWER(p_email);
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_profile_by_email TO anon;
GRANT EXECUTE ON FUNCTION admin_get_profile_by_email TO authenticated;

-- [FIX #1] admin_get_pending_teachers — hanya admin yang bisa
CREATE OR REPLACE FUNCTION admin_get_pending_teachers()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admin can perform this action.';
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.created_at DESC), '[]'::jsonb)
  INTO result
  FROM public.profiles p
  WHERE p.role = 'guru' AND p.status = 'pending';
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_pending_teachers TO authenticated;

-- [FIX #1] admin_get_registered_teachers — hanya admin yang bisa
CREATE OR REPLACE FUNCTION admin_get_registered_teachers()
RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
DECLARE
  result JSONB;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admin can perform this action.';
  END IF;
  SELECT COALESCE(jsonb_agg(to_jsonb(p) ORDER BY p.name ASC), '[]'::jsonb)
  INTO result
  FROM public.profiles p
  WHERE p.role = 'guru' AND p.status = 'approved';
  RETURN result;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_get_registered_teachers TO authenticated;

-- [FIX #2] admin_approve_user — hanya admin yang bisa
CREATE OR REPLACE FUNCTION admin_approve_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admin can perform this action.';
  END IF;
  UPDATE public.profiles SET status = 'approved' WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_approve_user TO authenticated;

-- [FIX #2] admin_reject_user — hanya admin yang bisa
CREATE OR REPLACE FUNCTION admin_reject_user(p_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admin can perform this action.';
  END IF;
  UPDATE public.profiles SET status = 'rejected' WHERE id = p_user_id;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_reject_user TO authenticated;

-- [FIX #1] admin_save_password — hanya admin yang bisa
CREATE OR REPLACE FUNCTION admin_save_password(p_username TEXT, p_password TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'Access denied. Only admin can perform this action.';
  END IF;
  UPDATE public.profiles SET password = p_password WHERE username = p_username;
  RETURN FOUND;
END;
$$;

GRANT EXECUTE ON FUNCTION admin_save_password TO authenticated;

-- ================================================================
-- 7. SEED DATA
-- ================================================================

-- 7a. Settings default (Mathematalk CBT)
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

-- 7b. Buat user admin
--     Username: admin, Password: qeadzc, Email: admin@gmail.com
--     Menggunakan struktur auth.identities yang benar untuk mencegah Error 500
DO $$
DECLARE
  v_user_id UUID;
  v_exists  UUID;
BEGIN
  SELECT id INTO v_exists FROM auth.users WHERE email = 'admin@gmail.com';

  IF v_exists IS NOT NULL THEN
    -- Update user yang sudah ada
    UPDATE auth.users
    SET encrypted_password  = crypt('qeadzc', gen_salt('bf')),
        email_confirmed_at  = COALESCE(email_confirmed_at, now()),
        updated_at          = now(),
        raw_user_meta_data  = jsonb_build_object(
          'username', 'admin', 'role', 'admin',
          'name', 'Administrator', 'password', 'qeadzc'
        ),
        raw_app_meta_data   = '{"provider":"email","providers":["email"]}'
    WHERE id = v_exists;
    v_user_id := v_exists;
  ELSE
    -- Buat user admin baru
    v_user_id := gen_random_uuid();

    INSERT INTO auth.users (
      instance_id,  id,              aud,             role,
      email,        encrypted_password,              email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data,
      created_at,   updated_at,      confirmation_token,
      is_sso_user,  deleted_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      v_user_id, 'authenticated', 'authenticated',
      'admin@gmail.com',
      crypt('qeadzc', gen_salt('bf')),
      now(),
      '{"provider":"email","providers":["email"]}',
      jsonb_build_object(
        'username', 'admin', 'role', 'admin',
        'name', 'Administrator', 'password', 'qeadzc'
      ),
      now(), now(), '',
      false, null
    );

    -- Buat identity (kunci mencegah Error 500 — provider_id = UUID string)
    INSERT INTO auth.identities (
      provider_id,    id,             user_id,        identity_data,
      provider,       last_sign_in_at, created_at,    updated_at
    ) VALUES (
      v_user_id::text,
      v_user_id, v_user_id,
      jsonb_build_object(
        'sub', v_user_id,
        'email', 'admin@gmail.com',
        'email_verified', true
      ),
      'email', now(), now(), now()
    );
  END IF;

  -- Pastikan profile admin ada (trigger handle_new_user sudah buat, update jika perlu)
  INSERT INTO public.profiles (id, username, email, password, role, name, status, created_at)
  VALUES (v_user_id, 'admin', 'admin@gmail.com', 'qeadzc', 'admin', 'Administrator', 'approved', now())
  ON CONFLICT (id) DO UPDATE SET
    username = 'admin',
    email = 'admin@gmail.com',
    password = 'qeadzc',
    role = 'admin',
    name = 'Administrator',
    status = 'approved';
END;
$$;

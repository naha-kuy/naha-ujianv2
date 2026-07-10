-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard/project/cvwemzzfwrjfrnnfckch/sql/new)

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
  -- Status approval (guru: pending | approved | rejected)
  status TEXT NOT NULL DEFAULT 'approved' CHECK (status IN ('pending', 'approved', 'rejected')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 2. RLS POLICIES
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

CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

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
-- 4. SEED DEMO USERS (jalankan satu per satu jika perlu)
-- ============================================================
-- Buat 3 akun demo agar login via Supabase juga berfungsi.
-- Jika auth.create_user() tidak tersedia, buat manual via Dashboard.
--
-- Cara via Dashboard:
--   Authentication > Users > Invite user
--   admin@app.local / admin (role: admin)
--   guru@app.local  / guru  (role: guru)
--   siswa@app.local / siswa (role: siswa)
--   lalu Confirm email masing-masing.

DO $$
DECLARE
  _uid UUID;
BEGIN
  -- Admin
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'admin@app.local') THEN
    _uid := extensions.uuid_generate_v4();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      _uid, '00000000-0000-0000-0000-000000000000',
      'admin@app.local',
      crypt('admin', gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}',
      '{"username":"admin","role":"admin","name":"Administrator"}',
      'authenticated', 'authenticated',
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      _uid, _uid,
      format('{"sub":"%s","email":"admin@app.local"}', _uid)::jsonb,
      'email', _uid::text,
      now(), now(), now()
    );
  END IF;

  -- Guru
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'guru@app.local') THEN
    _uid := extensions.uuid_generate_v4();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      _uid, '00000000-0000-0000-0000-000000000000',
      'guru@app.local',
      crypt('guru', gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}',
      '{"username":"guru","role":"guru","name":"Guru"}',
      'authenticated', 'authenticated',
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      _uid, _uid,
      format('{"sub":"%s","email":"guru@app.local"}', _uid)::jsonb,
      'email', _uid::text,
      now(), now(), now()
    );
  END IF;

  -- Siswa
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'siswa@app.local') THEN
    _uid := extensions.uuid_generate_v4();
    INSERT INTO auth.users (
      id, instance_id, email, encrypted_password,
      email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
      aud, role, created_at, updated_at,
      confirmation_token, email_change, email_change_token_new, recovery_token
    ) VALUES (
      _uid, '00000000-0000-0000-0000-000000000000',
      'siswa@app.local',
      crypt('siswa', gen_salt('bf', 10)),
      now(), '{"provider":"email","providers":["email"]}',
      '{"username":"siswa","role":"siswa","name":"Siswa"}',
      'authenticated', 'authenticated',
      now(), now(), '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id,
      last_sign_in_at, created_at, updated_at
    ) VALUES (
      _uid, _uid,
      format('{"sub":"%s","email":"siswa@app.local"}', _uid)::jsonb,
      'email', _uid::text,
      now(), now(), now()
    );
  END IF;
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

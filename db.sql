-- Jalankan SQL ini di Supabase SQL Editor (https://supabase.com/dashboard/project/cvwemzzfwrjfrnnfckch/sql/new)

-- ============================================================
-- 1. TABEL PROFILES (data tambahan pengguna selain auth)
-- ============================================================
CREATE TABLE profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'guru', 'siswa')),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Policy: users can read own profile
CREATE POLICY "users_read_own_profile"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Policy: users can update own profile
CREATE POLICY "users_update_own_profile"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- ============================================================
-- 2. TRIGGER: auto-create profile after signup
-- ============================================================
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, username, role, name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'username',
    COALESCE(NEW.raw_user_meta_data->>'role', 'siswa'),
    COALESCE(NEW.raw_user_meta_data->>'name', NEW.raw_user_meta_data->>'username')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- 3. FUNCTION: get profile by user ID (for easier queries)
-- ============================================================
CREATE OR REPLACE FUNCTION get_profile(user_id UUID)
RETURNS TABLE (
  id UUID,
  username TEXT,
  role TEXT,
  name TEXT,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = ''
AS $$
BEGIN
  RETURN QUERY
  SELECT p.id, p.username, p.role, p.name, p.created_at
  FROM public.profiles p
  WHERE p.id = user_id;
END;
$$;

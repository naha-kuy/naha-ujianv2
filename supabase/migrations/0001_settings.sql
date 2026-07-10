-- Migration: Add settings table and update profiles for profile editing

-- Settings table (JSONB for flexibility, single row)
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

-- Insert default settings row
INSERT INTO settings (id, data)
VALUES (1, '{
  "app_name": "CBT-Eschool",
  "school_logo": "",
  "theme_color": "#0d6efd",
  "sync_interval_seconds": 60,
  "hide_scores": false,
  "allow_multiple_login": false,
  "app_version": "2.0.0"
}')
ON CONFLICT (id) DO NOTHING;

-- Add student_class and student_group columns to profiles if not exist
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_class VARCHAR(50) DEFAULT '';
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS student_group VARCHAR(50) DEFAULT '';

-- Enable RLS on settings
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;

-- Policies: only authenticated users can read, only admin can write
CREATE POLICY "Anyone authenticated can read settings"
  ON settings FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Only admins can update settings"
  ON settings FOR UPDATE
  TO authenticated
  USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

CREATE POLICY "Only admins can insert settings"
  ON settings FOR INSERT
  TO authenticated
  WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'admin'
  );

-- Policy for profile updates: users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile"
  ON profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

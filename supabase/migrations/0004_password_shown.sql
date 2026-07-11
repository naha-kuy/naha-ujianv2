-- Add password_shown column to profiles for printing on exam cards
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS password_shown TEXT;

-- Backfill existing students with placeholder
UPDATE profiles SET password_shown = 'reset123' WHERE role = 'siswa' AND password_shown IS NULL;

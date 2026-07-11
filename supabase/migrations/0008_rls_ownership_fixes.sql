-- Migration: Fix RLS policies — add missing DELETE policy for guru, fix ownership to use created_by_username, fix semua_kelas check

-- 1. Fix "Guru update own soal" — was using dead column `created_by`, change to `created_by_username`
DROP POLICY IF EXISTS "Guru update own soal" ON soal;
CREATE POLICY "Guru update own soal"
  ON soal FOR UPDATE
  USING (
    created_by_username = (SELECT username FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 2. Add missing "Guru delete own soal" policy — gurus could never delete soal via RLS
DROP POLICY IF EXISTS "Guru delete own soal" ON soal;
CREATE POLICY "Guru delete own soal"
  ON soal FOR DELETE
  USING (
    created_by_username = (SELECT username FROM profiles WHERE id = auth.uid()) OR
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 3. Fix "Siswa select active soal" — was missing semua_kelas check, so siswa couldn't see all-class exams
DROP POLICY IF EXISTS "Siswa select active soal" ON soal;
CREATE POLICY "Siswa select active soal"
  ON soal FOR SELECT
  USING (
    status = 'Aktif' AND
    (
      kelas = (SELECT kelas FROM profiles WHERE id = auth.uid()) OR
      semua_kelas = true OR
      EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('admin', 'guru'))
    )
  );

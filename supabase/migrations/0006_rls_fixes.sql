-- Migration: Fix RLS policies — restrict guru access to own soal's data

-- Guru can only SELECT jawaban_siswa for exams they created
DROP POLICY IF EXISTS "Guru select jawaban" ON jawaban_siswa;
CREATE POLICY "Guru select jawaban"
  ON jawaban_siswa FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guru'
    ) AND (
      kode_soal IN (
        SELECT kode_soal FROM soal WHERE created_by_username = (
          SELECT username FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Guru can only SELECT nilai for exams they created
DROP POLICY IF EXISTS "Guru select nilai" ON nilai;
CREATE POLICY "Guru select nilai"
  ON nilai FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE id = auth.uid() AND role = 'guru'
    ) AND (
      kode_soal IN (
        SELECT kode_soal FROM soal WHERE created_by_username = (
          SELECT username FROM profiles WHERE id = auth.uid()
        )
      )
    )
  );

-- Admin can INSERT/UPDATE jawaban_siswa (needed for force-save etc.)
DROP POLICY IF EXISTS "Admin full on jawaban" ON jawaban_siswa;
CREATE POLICY "Admin full on jawaban"
  ON jawaban_siswa FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

-- Admin can INSERT/UPDATE nilai (needed for manual grading)
DROP POLICY IF EXISTS "Admin full on nilai" ON nilai;
CREATE POLICY "Admin full on nilai"
  ON nilai FOR ALL
  USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'));

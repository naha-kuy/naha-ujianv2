-- Migration: Add new columns to soal table for Phase 2 enhancements
-- Jalankan SQL ini di Supabase SQL Editor

ALTER TABLE soal ADD COLUMN IF NOT EXISTS token_required BOOLEAN DEFAULT false;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tanggal_unlimited BOOLEAN DEFAULT false;
ALTER TABLE soal ADD COLUMN IF NOT EXISTS tampilan_jawaban VARCHAR(10) DEFAULT 'Urut';
ALTER TABLE soal ADD COLUMN IF NOT EXISTS created_by_username TEXT;

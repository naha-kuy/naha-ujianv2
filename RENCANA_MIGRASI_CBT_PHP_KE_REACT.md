# Rencana Migrasi CBT: PHP (Native) → Vite React + Node.js + PostgreSQL

> **Dokumen ini merangkum hasil analisis mendalam terhadap folder referensi (`referensi cbtphpbaru`) 
> dan rencana migrasi penuh ke arsitektur modern berbasis JavaScript.**

---

## Daftar Isi

1. [Ringkasan Aplikasi Saat Ini](#1-ringkasan-aplikasi-saat-ini)
2. [Target Arsitektur Baru](#2-target-arsitektur-baru)
3. [Peta Fitur Lengkap (Feature Mapping)](#3-peta-fitur-lengkap)
4. [Struktur Database Baru](#4-struktur-database-baru)
5. [Rencana Tahapan Migrasi (2-3 Bulan)](#5-rencana-tahapan-migrasi)
6. [Detail Per Komponen](#6-detail-per-komponen)
7. [Estimasi dan Prioritas](#7-estimasi-dan-prioritas)
8. [Catatan Teknis](#8-catatan-teknis)

---

## 1. Ringkasan Aplikasi Saat Ini

### Tecnologi Lama
| Komponen | Teknologi |
|----------|-----------|
| Frontend | PHP Native + HTML + CSS + jQuery |
| CSS Framework | Bootstrap 5 + AdminKit |
| JavaScript | jQuery, DataTables, SweetAlert2, GSAP |
| Backend | PHP Native (prosedural) |
| Database | MySQL (`cbt_db`) |
| Autentikasi | Sesi PHP (`$_SESSION`) |
| Enkripsi | AES-256-CBC (OpenSSL) |

### Struktur Folder
```
referensi cbtphpbaru/
├── admin/          # 30+ halaman admin
├── siswa/          # 12+ halaman siswa
├── inc/            # include (functions, css, js, encrypt)
├── koneksi/        # koneksi database
├── assets/         # JS, CSS, font, library pihak ketiga
├── db/             # SQL dump
├── gambar/         # upload gambar
└── *.php           # halaman utama
```

### Fitur Teridentifikasi

#### A. Modul Admin (30+ halaman)
| # | Fitur | File PHP | Keterangan |
|---|-------|----------|------------|
| A1 | **Login Multi-Role** | `login2.php`, `login2_handler.php` | Tab login Admin & Siswa dengan AJAX |
| A2 | **Dashboard Admin** | `admin/dashboard.php` | Statistik ringkas |
| A3 | **Manajemen Soal (CRUD)** | `admin/soal.php` | DataTables bank soal |
| A4 | **Tambah Soal Baru** | `admin/tambah_soal.php` | Form input detail soal |
| A5 | **Edit Soal** | `admin/edit_soal.php` | Edit data soal eksisting |
| A6 | **Duplikasi Soal** | `admin/duplicate_soal.php` | AJAX duplicate dengan kode baru |
| A7 | **Hapus Soal** | `admin/hapus_soal.php` | Konfirmasi SweetAlert2 |
| A8 | **Aktif/Nonaktif Soal** | `admin/ubah_status_soal.php` | Toggle status |
| A9 | **Preview Soal** | `admin/preview_soal.php` | Lihat detail soal |
| A10 | **Generate Token** | `admin/generate_token.php` | Token 6 karakter acak |
| A11 | **Manajemen Butir Soal** | `admin/daftar_butir_soal.php` | List pertanyaan per soal |
| A12 | **Tambah Butir Soal** | `admin/tambah_butir_soal.php` | Input pertanyaan & opsi |
| A13 | **Edit Butir Soal** | `admin/edit_butir_soal.php` | Edit pertanyaan |
| A14 | **Hapus Butir Soal** | `admin/hapus_butir_soal.php` | Hapus pertanyaan |
| A15 | **Import Soal Excel** | `admin/import_soal.php` | PhpSpreadsheet, validasi duplikat |
| A16 | **Manajemen Siswa (CRUD)** | `admin/siswa.php` | CRUD siswa |
| A17 | **Tambah Siswa** | `admin/tambah_siswa.php` | Form input siswa |
| A18 | **Edit Siswa** | `admin/edit_siswa.php` | Edit data siswa |
| A19 | **Hapus Siswa** | `admin/hapus_siswa.php` | Hapus siswa |
| A20 | **Import Siswa Excel** | `admin/import_siswa.php`, `admin/proses_import_siswa.php` | Batch import |
| A21 | **Search Siswa** | `admin/search_siswa.php` | AJAX search |
| A22 | **Preview Siswa** | `admin/preview_siswa.php` | Detail + jawaban siswa |
| A23 | **Monitoring Ujian Real-time** | `admin/monitor.php`, `admin/monitor_data.php` | Server-side DataTables, auto-refresh 60 detik |
| A24 | **Force Logout Siswa** | `admin/simpan_paksa.php`, `admin/force_logout.php` | Paksa simpan & logout |
| A25 | **Online Status** | `admin/online.php`, `admin/get_online.php` | Lihat siswa online |
| A26 | **Hasil Ujian** | `admin/hasil.php` | Filter by kelas/soal/siswa, DataTables |
| A27 | **Koreksi Uraian** | `admin/koreksi_uraian.php`, `admin/simpan_nilai_uraian.php` | Slider interaktif, simpan nilai |
| A28 | **Kartu Peserta** | `admin/kartu_siswa.php`, `admin/print_kartu.php` | Cetak kartu |
| A29 | **Export Excel Hasil** | `admin/export_excel.php` | PhpSpreadsheet |
| A30 | **Pengaturan Aplikasi** | `admin/setting.php` | Nama, logo, warna tema, sinkronisasi, login ganda, sembunyikan nilai |
| A31 | **Edit Profil Admin** | `admin/simpan_profil.php` | Ganti password & username |
| A32 | **Upload Gambar** | `admin/upload-gambar.php`, `admin/proses_upload_gambar.php`, `admin/data_gambar.php`, `admin/hapus_gambar.php`, `admin/hapus_gambar_editor.php` | Manajemen gambar untuk soal |
| A33 | **Logout** | `admin/logout.php` | Hapus sesi |

#### B. Modul Siswa (12+ halaman)
| # | Fitur | File PHP | Keterangan |
|---|-------|----------|------------|
| B1 | **Dashboard Siswa** | `siswa/dashboard.php` | Info profil & jadwal |
| B2 | **Daftar Ujian Tersedia** | `siswa/ujian.php` | AJAX load kartu ujian, live search, auto-refresh |
| B3 | **Konfirmasi Ujian** | `siswa/konfirmasi_ujian.php` | Input token, validasi |
| B4 | **Mulai Ujian** | `siswa/mulaiujian.php` | Validasi token, kelas, tanggal, reset/baru |
| B5 | **Ujian Berjalan** | `siswa/ujian.php` (utama), `inc/script_ujian.php` | Soal per halaman, navigasi, timer |
| B6 | **Auto-save Jawaban** | `siswa/autosave_jawaban.php` | Periodic AJAX save |
| B7 | **Simpan Jawaban (Final)** | `siswa/simpan_jawaban.php` | Koreksi otomatis, simpan nilai |
| B8 | **Preview Hasil** | `siswa/preview_hasil.php` | Lihat jawaban & kunci |
| B9 | **Lihat Nilai** | `siswa/hasil.php`, `siswa/get_nilai.php` | Nilai setelah ujian |
| B10 | **Tracking Activity** | `siswa/update_activity.php` | Ping server tiap 60 detik |
| B11 | **Logout** | `siswa/logout.php` | Hapus sesi + token |

#### C. Sistem & Infrastruktur
| # | Fitur | File | Keterangan |
|---|-------|------|------------|
| C1 | **Koneksi Database** | `koneksi/koneksi.php` | MySQLi koneksi manual |
| C2 | **Enkripsi Simetris** | `inc/encrypt.php` | AES-256-CBC (tidak dipakai penuh) |
| C3 | **CAPTCHA** | `inc/captcha.php` | GD image CAPTCHA |
| C4 | **CSS Global** | `inc/css.php` | Bootstrap 5, FontAwesome, AdminKit, DataTables |
| C5 | **JS Global** | `inc/js.php` | jQuery, SweetAlert2, AdminKit, DataTables, sidebar collapsible, toast, audio notif, copyright protection |
| C6 | **Activity Check** | `inc/check_activity.php` | JS ping tiap 60 detik, kirim page_url |
| C7 | **CSS Ujian** | `inc/cssujian.php` | Gaya khusus halaman ujian |
| C8 | **Error Page** | `error_page.php` | Halaman error umum |
| C9 | **Anti-Cheat** | Inline di `siswa/ujian.php` & `mulaiujian.php` | Blokir klik kanan, Ctrl+C/V, F12, Ctrl+Shift+I, visibility change |
| C10 | **PhpSpreadsheet** | `assets/PhpSpreadsheet/` | Library Excel |
| C11 | **Font Size Control** | Inline JS | Perbesar/perkecil font soal |

### Tipe Soal yang Didukung
1. **Pilihan Ganda** - 4 opsi (A, B, C, D)
2. **Pilihan Ganda Kompleks** - checkbox multi-jawab
3. **Benar/Salah** - tabel pernyataan
4. **Menjodohkan** - dropdown pasangan
5. **Uraian** - textarea (dinilai manual)

---

## 2. Target Arsitektur Baru

### Database: Supabase (PostgreSQL Managed)

Supabase akan digunakan sebagai penyedia database PostgreSQL sekaligus menyediakan layanan autentikasi, storage, dan API real-time bawaan.

| Layanan Supabase | Fungsi dalam Aplikasi |
|-----------------|-----------------------|
| **PostgreSQL Database** | Semua data aplikasi (soal, siswa, nilai, dll) |
| **Supabase Auth** | Opsional — bisa dipakai sebagai alternatif JWT manual |
| **Supabase Storage** | Upload gambar soal, logo sekolah |
| **Supabase Realtime** | Alternatif Socket.IO untuk monitoring live |

### Koneksi Supabase

```
Supabase URL:      https://fohlvsrvyzoepyjfcvej.supabase.co
Database URL:      postgresql://postgres:[PASSWORD]@db.fohlvsrvyzoepyjfcvej.supabase.co:5432/postgres
```

> ⚠️ **KEAMANAN:** Jangan pernah mengekspos `service_role` key.
> - **Anon Key** → untuk client-side (aman dibatasi Row Level Security)
> - **Service Role Key** → HANYA untuk server-side (admin penuh, RAHASIA)
> - Simpan di environment variable backend (`.env`), bukan di kode atau dokumen.

### Environment Variables

```env
# Backend (.env)
SUPABASE_URL=https://fohlvsrvyzoepyjfcvej.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaGx2c3J2eXpvZXB5amZjdmVqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODM2MjQxMjAsImV4cCI6MjA5OTIwMDEyMH0.t4hThWKafYwXte-yzczQFcg2OMyXVXztc8g0X4S3kbs
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImZvaGx2c3J2eXpvZXB5amZjdmVqIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MzYyNDEyMCwiZXhwIjoyMDk5MjAwMTIwfQ.DbrdVUuPkeOMJo8cUGX_SyEqvvD0jy0VgAwtQqKbtpA
DATABASE_URL=postgresql://postgres:[PASSWORD-POSTGRES]@db.fohlvsrvyzoepyjfcvej.supabase.co:5432/postgres

# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=https://fohlvsrvyzoepyjfcvej.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_O8EBx8ox8XLE06GC_HH2hg_34GgTvIV
```

> 🔒 `SUPABASE_SERVICE_ROLE_KEY` bersifat rahasia dan sensitif — hanya digunakan di backend server, jangan pernah di-commit ke repository.

---

```
┌─────────────────────────────────────────────────────┐
│                    Frontend (Vite + React)           │
│  ┌───────────────────────────────────────────────┐  │
│  │  React 19 + TypeScript + Tailwind CSS v4       │  │
│  │  React Router v7 + Zustand (state)            │  │
│  │  Axios + React Query (data fetching)          │  │
│  │  React Hook Form + Zod (validasi)             │  │
│  │  Recharts (grafik) + react-pdf (print)        │  │
│  └───────────────────┬───────────────────────────┘  │
│                      │ HTTP/HTTPS                    │
│                      ▼                               │
│  ┌───────────────────────────────────────────────┐  │
│  │         Backend (Node.js + Express)            │  │
│  │  REST API + JWT Autentikasi                   │  │
│  │  Supabase PostgreSQL + Drizzle ORM             │  │
│  │  Supabase Storage (gambar)                    │  │
│  │  Supabase Realtime / Socket.IO (monitoring)   │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘
```

### Stack Detail

| Lapisan | Teknologi | Alasan |
|---------|-----------|--------|
| **Build Tool** | Vite 6 | Cepat, modern, optimal untuk React SPA |
| **Frontend** | React 19 + TypeScript | Type safety, ekosistem kuat |
| **Routing** | React Router v7 | Nested routes, loader/action |
| **State Global** | Zustand | Ringan, tanpa boilerplate |
| **Data Fetching** | TanStack React Query | Caching, auto-refresh, mutation |
| **Form** | React Hook Form + Zod | Performant + validasi skema |
| **CSS** | Tailwind CSS v4 | Utility-first, kustomisasi mudah |
| **UI Components** | shadcn/ui (Radix Primitives) | Aksesibel, reusable, Tailwind-based |
| **Chart** | Recharts | Ringan, React-native |
| **Table** | TanStack Table | Headless, fleksibel |
| **PDF** | react-pdf / jsPDF | Print kartu & laporan |
| **Backend** | Node.js + Express.js | JavaScript full-stack |
| **Database** | Supabase PostgreSQL 15 | Managed PostgreSQL + Realtime + Auth + Storage |
| **ORM** | Drizzle ORM | Type-safe, lightweight, performant |
| **Auth** | JWT (access + refresh token) | Stateless, aman |
| **Upload** | Multer | Middleware upload file |
| **Realtime** | Socket.IO | Monitoring live, notifikasi |
| **Validation** | Zod | Backend & frontend pakai skema sama |
| **Testing** | Vitest + Playwright | Unit + E2E |

---

## 3. Peta Fitur Lengkap (Feature Mapping)

### Fase 1: Foundation (Minggu 1-3)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 1.1 | Setup Project & Struktur | P0 | - | ✅ | Vite + React + TypeScript + Tailwind |
| 1.2 | Setup Backend Express | P0 | - | ✅ | API skeleton, middleware, error handler |
| 1.3 | Database PostgreSQL + Drizzle | P0 | MySQL | ✅ | Migrasi skema MySQL → PostgreSQL |
| 1.4 | Autentikasi JWT | P0 | Session | ✅ | Login, refresh token, logout, protected routes |
| 1.5 | Login Page Multi-Role | P0 | `login2.php` | ✅ | Tab Admin/Siswa, validasi, CAPTCHA (reworked) |
| 1.6 | Layout Admin (Sidebar + Navbar) | P0 | `admin/sidebar.php`, `admin/navbar.php` | ✅ | Responsive sidebar collapsible |
| 1.7 | Layout Siswa (Sidebar + Navbar) | P0 | `siswa/sidebar.php`, `siswa/navbar.php` | ✅ | Layout ringan untuk siswa |
| 1.8 | Dashboard Admin | P1 | `admin/dashboard.php` | ✅ | Statistik, grafik, notifikasi |
| 1.9 | Dashboard Siswa | P1 | `siswa/dashboard.php` | ✅ | Info profil, jadwal, nilai |

### Fase 2: Manajemen Soal (Minggu 4-6)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 2.1 | Bank Soal (CRUD) | P0 | `admin/soal.php` | ✅ | DataTable dengan filter, search, sort |
| 2.2 | Tambah/Edit Soal | P0 | `admin/tambah_soal.php`, `admin/edit_soal.php` | ✅ | Form multi-step, drag & drop |
| 2.3 | Duplikasi Soal | P1 | `admin/duplicate_soal.php` | ✅ | Modal input kode baru, AJAX |
| 2.4 | Hapus Soal | P0 | `admin/hapus_soal.php` | ✅ | Konfirmasi dialog |
| 2.5 | Toggle Status Soal | P0 | `admin/ubah_status_soal.php` | ✅ | Switch component |
| 2.6 | Generate Token | P0 | `admin/generate_token.php` | ✅ | Auto-generate 6 karakter |
| 2.7 | Preview Soal | P1 | `admin/preview_soal.php` | ✅ | Modal preview |
| 2.8 | Butir Soal CRUD | P0 | `admin/daftar_butir_soal.php` | ✅ | Manage questions per exam |
| 2.9 | Editor Pertanyaan (Rich Text) | P1 | `admin/tambah_butir_soal.php` | ✅ | TipTap/Quill editor, support gambar |
| 2.10 | Import Soal Excel | P2 | `admin/import_soal.php` | ✅ | Drag & drop file, preview, validasi |
| 2.11 | Manajemen Gambar | P2 | `admin/upload-gambar.php` | ✅ | Gallery view, upload, delete |

### Fase 3: Manajemen Siswa & Peserta (Minggu 5-7)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 3.1 | CRUD Siswa | P0 | `admin/siswa.php` | ✅ | DataTable, filter kelas |
| 3.2 | Tambah/Edit Siswa | P0 | `admin/tambah_siswa.php`, `admin/edit_siswa.php` | ✅ | Form validasi |
| 3.3 | Import Siswa Excel | P2 | `admin/import_siswa.php` | ✅ | Batch import dengan preview |
| 3.4 | Preview & Detail Siswa | P1 | `admin/preview_siswa.php` | ✅ | Riwayat ujian siswa |
| 3.5 | Kartu Peserta (Print) | P2 | `admin/print_kartu.php` | ✅ | Generate printable card |

### Fase 4: Sistem Ujian (Minggu 6-9)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 4.1 | Daftar Ujian (Siswa) | P0 | `siswa/ujian.php` | ✅ | Card view, live search, auto-refresh |
| 4.2 | Konfirmasi & Token | P0 | `siswa/konfirmasi_ujian.php` | ✅ | Input token, validasi |
| 4.3 | Engine Ujian Utama | P0 | `siswa/mulaiujian.php` | ✅ | **Komponen paling kompleks** |
| 4.4 | Tipe Soal: Pilihan Ganda | P0 | inline | ✅ | Radio button, 4 opsi |
| 4.5 | Tipe Soal: PG Kompleks | P0 | inline | ✅ | Checkbox multi-pilih |
| 4.6 | Tipe Soal: Benar/Salah | P0 | inline | ✅ | Tabel pernyataan, radio |
| 4.7 | Tipe Soal: Menjodohkan | P0 | inline | ✅ | Dropdown/shuffle, drag & drop |
| 4.8 | Tipe Soal: Uraian | P0 | inline | ✅ | Textarea, bisa rich text |
| 4.9 | Navigasi Soal | P0 | inline | ✅ | Next/Prev, nomor navigasi, status warna |
| 4.10 | Timer Countdown | P0 | `inc/script_ujian.php` | ✅ | Auto-submit saat habis |
| 4.11 | Auto-save Jawaban | P0 | `siswa/autosave_jawaban.php` | ✅ | Periodic save via API, configurable interval |
| 4.12 | Simpan & Koreksi Akhir | P0 | `siswa/simpan_jawaban.php` | ✅ | Koreksi otomatis per tipe soal |
| 4.13 | Font Size Control | P1 | inline JS | ✅ | Tombol zoom in/out/reset |
| 4.14 | Image Preview Modal | P1 | inline | ✅ | Zoom-in gambar soal |
| 4.15 | Anti-Cheat: Blokir Klik Kanan | P0 | inline | ✅ | contextmenu event |
| 4.16 | Anti-Cheat: Blokir Shortcut | P0 | inline | ✅ | F12, Ctrl+Shift+I, Ctrl+U, Ctrl+C, Ctrl+V |
| 4.17 | Anti-Cheat: Visibility Detection | P0 | inline | ✅ | Tab switch warning + log pelanggaran |
| 4.18 | Copyright Protection (footer) | P2 | `inc/js.php` | ✅ | Footer checking |

### Fase 5: Penilaian & Monitoring (Minggu 8-10)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 5.1 | Monitoring Ujian Real-time | P0 | `admin/monitor.php` | ✅ | Socket.IO live update, server-side table |
| 5.2 | Data Monitoring (AJAX) | P0 | `admin/monitor_data.php` | ✅ | API endpoint monitoring |
| 5.3 | Force Simpan Paksa | P1 | `admin/simpan_paksa.php` | ✅ | Paksa selesai ujian siswa |
| 5.4 | Lihat Siswa Online | P1 | `admin/online.php`, `admin/get_online.php` | ✅ | Status online/offline |
| 5.5 | Hasil Ujian (Admin) | P0 | `admin/hasil.php` | ✅ | Filter multi-kriteria, DataTable |
| 5.6 | Koreksi Uraian Interaktif | P0 | `admin/koreksi_uraian.php` | ✅ | Slider + input nilai, per soal |
| 5.7 | Simpan Nilai Uraian | P0 | `admin/simpan_nilai_uraian.php` | ✅ | API simpan nilai |
| 5.8 | Preview Jawaban Siswa | P1 | `admin/preview_siswa.php` | ✅ | Lihat jawaban vs kunci |
| 5.9 | Hasil Ujian (Siswa) | P1 | `siswa/hasil.php`, `siswa/get_nilai.php` | ✅ | Lihat nilai, sembunyikan jika disetting |
| 5.10 | Hapus Nilai | P2 | `admin/hapus_nilai.php` | ✅ | Hapus data nilai |
| 5.11 | Export Excel Hasil | P2 | `admin/export_excel.php` | ✅ | Export filter-based |

### Fase 6: Pengaturan & Penyempurnaan (Minggu 9-12)

| ID | Fitur | Prioritas | Status PHP | Target React | Keterangan |
|----|-------|-----------|------------|--------------|------------|
| 6.1 | Pengaturan Aplikasi | P1 | `admin/setting.php` | ✅ | Tab pengaturan + profil, logo upload, tema, sinkronisasi, login ganda, sembunyikan nilai |
| 6.2 | Edit Profil Admin | P1 | `admin/simpan_profil.php` | ✅ | Ganti nama, username, password |
| 6.3 | Tracking Activity | P1 | `inc/check_activity.php` | ✅ | Ping tiap 60 detik, last_activity |
| 6.4 | Notifikasi Toast Ujian | P2 | `inc/js.php` | ✅ | Pemberitahuan jadwal ujian mendatang |
| 6.5 | Force Logout | P1 | `admin/force_logout.php` | ✅ | Logout paksa dari admin |
| 6.6 | Error Page | P1 | `error_page.php` | ✅ | 404, 403, 500 pages |

---

## 4. Struktur Database Baru

### Migrasi MySQL → PostgreSQL

**Tabel MySQL Saat Ini** → **Tabel PostgreSQL Baru**:

| MySQL | PostgreSQL | Perubahan |
|-------|------------|-----------|
| `admins` | `admins` | `id` → SERIAL, `created_at` → TIMESTAMPTZ, password → bcrypt hash |
| `siswa` | `students` | Rename, `id_siswa` → `id`, `last_activity` → TIMESTAMPTZ, tambah `refresh_token` |
| `soal` | `exams` | Rename, `kode_soal` UNIQUE, tambah `created_by`, `updated_at` |
| `butir_soal` | `exam_questions` | Rename, `id_soal` → FK ke `exam_questions.id` | 
| `jawaban_siswa` | `student_answers` | Rename, simpan parsed JSON instead of string format |
| `nilai` | `exam_results` | Rename, `nilai` → `score`, `detail_uraian` → JSONB |
| `pengaturan` | `settings` | Ganti kolom individual ke JSONB `settings` |
| `profil` | - | Dihapus (diganti system encrypt di env) |

### Schema PostgreSQL Baru (Dengan Drizzle ORM)

```sql
-- Tabel inti
CREATE TABLE users (                  -- Unified: admin & siswa
  id SERIAL PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('admin', 'teacher', 'student')),
  full_name VARCHAR(100) NOT NULL,
  student_class VARCHAR(50),         -- null untuk admin
  student_group VARCHAR(50),         -- null untuk admin
  status VARCHAR(20) DEFAULT 'active',
  session_token TEXT,
  refresh_token TEXT,
  last_activity TIMESTAMPTZ,
  page_url TEXT,
  force_logout BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exams (
  id SERIAL PRIMARY KEY,
  exam_code VARCHAR(200) UNIQUE NOT NULL,
  exam_name VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  target_class VARCHAR(50) NOT NULL,
  duration_minutes INTEGER DEFAULT 60,
  exam_date DATE DEFAULT CURRENT_DATE,
  status VARCHAR(20) DEFAULT 'inactive',
  display_mode VARCHAR(10) DEFAULT 'urut', -- 'urut' atau 'acak'
  answer_key TEXT NOT NULL,
  token VARCHAR(6) NOT NULL,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE exam_questions (
  id SERIAL PRIMARY KEY,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  question_number INTEGER NOT NULL,
  question_text TEXT NOT NULL,
  question_type VARCHAR(30) NOT NULL CHECK (
    question_type IN ('multiple_choice', 'complex_multiple_choice', 'true_false', 'matching', 'essay')
  ),
  option_1 VARCHAR(255),
  option_2 VARCHAR(255),
  option_3 VARCHAR(255),
  option_4 VARCHAR(255),
  correct_answer TEXT,
  question_status VARCHAR(20) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(exam_id, question_number)
);

CREATE TABLE student_exam_sessions (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  remaining_seconds INTEGER NOT NULL,
  answers JSONB DEFAULT '{}',         -- { "1": "A", "2": ["A","B"], "3": { "left1": "right2" } }
  status VARCHAR(20) DEFAULT 'active',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

CREATE TABLE exam_results (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id),
  exam_id INTEGER NOT NULL REFERENCES exams(id),
  total_questions INTEGER NOT NULL,
  correct_count INTEGER DEFAULT 0,
  wrong_count INTEGER DEFAULT 0,
  partial_count INTEGER DEFAULT 0,
  answers JSONB DEFAULT '{}',
  answer_key TEXT NOT NULL,
  auto_score DECIMAL(5,2) DEFAULT 0,
  essay_score DECIMAL(5,2) DEFAULT 0,
  final_score DECIMAL(5,2) DEFAULT 0,
  essay_details JSONB DEFAULT '{}',   -- { "1": 8.5, "2": 10 }
  grading_status VARCHAR(20) DEFAULT 'auto',
  exam_date TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, exam_id)
);

CREATE TABLE settings (
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

CREATE TABLE activity_logs (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id),
  action VARCHAR(50) NOT NULL,
  details JSONB,
  ip_address VARCHAR(45),
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

---

## 5. Rencana Tahapan Migrasi (2-3 Bulan)

### Bulan 1: Foundation & Core Features

| Minggu | Sprint | Deliverables |
|--------|--------|--------------|
| **1** | **Setup** | Inisialisasi Vite + React + TypeScript + Tailwind. Setup Express backend + Drizzle ORM + PostgreSQL. CI/CD pipeline. |
| **2** | **Auth & Layout** | Halaman login multi-role dengan JWT. Layout admin & siswa (sidebar, navbar, breadcrumbs). Protected routes. |
| **3** | **Dashboard & CRUD Dasar** | Dashboard admin (statistik). Dashboard siswa. Struktur halaman admin (soal, siswa, hasil). |
| **4** | **Manajemen Soal** | CRUD bank soal. Tabel dengan filter/search/sort. Form tambah & edit soal. |

### Bulan 2: Ujian & Penilaian

| Minggu | Sprint | Deliverables |
|--------|--------|--------------|
| **5** | **Butir Soal** | CRUD pertanyaan. Rich text editor (TipTap). Support gambar dalam soal. Import Excel. |
| **6** | **Engine Ujian (Bagian 1)** | Halaman daftar ujian siswa. Konfirmasi + token. Engine ujian: timer, navigasi soal, 5 tipe soal. |
| **7** | **Engine Ujian (Bagian 2)** | Auto-save periodic. Final submit + koreksi otomatis. Anti-cheat (block right-click, keyboard shortcuts, tab switch detection). |
| **8** | **Penilaian & Monitoring** | Koreksi uraian interaktif (slider). Hasil ujian admin (multi-filter). Preview jawaban siswa. Monitoring real-time (Socket.IO). |

### Bulan 3: Penyempurnaan & Finalisasi

| Minggu | Sprint | Deliverables |
|--------|--------|--------------|
| **9** | **Export & Print** | Export Excel hasil ujian. Kartu peserta (PDF). Print-friendly pages. |
| **10** | **Pengaturan & Profil** | Settings page (appearance, sync, login policy, hide scores). Edit profil admin + ganti password. Manajemen gambar. |
| **11** | **Siswa Features** | Dashboard siswa: lihat nilai, riwayat ujian, preview hasil. Activity tracking. Notification toasts. |
| **12** | **Testing, Polish & Deploy** | E2E testing (Playwright). Performance optimization. Security audit. Bug fixes. Production deployment. |

---

## 6. Detail Per Komponen

### 6.1 Struktur Folder Frontend (React)

```
cbt-frontend/
├── public/
│   └── images/
├── src/
│   ├── api/                    # Axios instance + API functions
│   │   ├── client.ts           # Axios dengan interceptor JWT
│   │   ├── auth.ts             # login, logout, refresh
│   │   ├── exams.ts            # CRUD soal
│   │   ├── questions.ts        # CRUD butir soal
│   │   ├── students.ts         # CRUD siswa
│   │   ├── monitoring.ts       # Monitoring endpoints
│   │   ├── results.ts          # Nilai & hasil
│   │   └── settings.ts         # Pengaturan
│   ├── components/             # Shared components
│   │   ├── ui/                 # shadcn/ui components
│   │   ├── layout/             # AdminLayout, StudentLayout
│   │   ├── forms/              # Form components
│   │   └── tables/             # DataTable wrapper
│   ├── features/               # Feature-based modules
│   │   ├── auth/               # Login page + hooks
│   │   ├── admin/
│   │   │   ├── dashboard/
│   │   │   ├── exams/          # Bank soal CRUD
│   │   │   ├── questions/      # Butir soal
│   │   │   ├── students/       # Manajemen siswa
│   │   │   ├── monitoring/     # Live monitoring
│   │   │   ├── results/        # Hasil & koreksi
│   │   │   └── settings/       # Pengaturan
│   │   └── student/
│   │       ├── dashboard/
│   │       ├── exams/          # Daftar ujian
│   │       ├── exam-engine/    # **Ujian utama**
│   │       └── results/        # Lihat nilai
│   ├── hooks/                  # Custom hooks
│   ├── lib/                    # Utility functions
│   ├── stores/                 # Zustand stores
│   │   ├── authStore.ts
│   │   ├── examStore.ts
│   │   └── uiStore.ts
│   ├── types/                  # TypeScript types
│   │   └── index.ts
│   └── App.tsx
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── tsconfig.json
```

### 6.2 Struktur Folder Backend (Express)

```
cbt-backend/
├── src/
│   ├── index.ts                # Entry point
│   ├── app.ts                  # Express app setup
│   ├── config/                 # Environment & DB config
│   │   ├── database.ts         # Drizzle connection
│   │   └── env.ts              # Zod validated env vars
│   ├── db/                     # Database schema & migrations
│   │   ├── schema/             # Drizzle schema files
│   │   │   ├── users.ts
│   │   │   ├── exams.ts
│   │   │   ├── questions.ts
│   │   │   ├── sessions.ts
│   │   │   ├── results.ts
│   │   │   └── settings.ts
│   │   ├── migrations/
│   │   └── seed.ts             # Seed data
│   ├── modules/                # Feature modules
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   └── auth.routes.ts
│   │   ├── exams/
│   │   ├── questions/
│   │   ├── students/
│   │   ├── monitoring/
│   │   ├── results/
│   │   ├── settings/
│   │   └── uploads/
│   ├── middleware/
│   │   ├── auth.middleware.ts  # JWT verification
│   │   ├── role.middleware.ts  # Role-based access
│   │   ├── validate.ts         # Zod validation
│   │   └── upload.ts           # Multer config
│   ├── utils/
│   │   ├── scoring.ts          # Koreksi otomatis
│   │   ├── token.ts            # Token generator
│   │   └── encryption.ts       # AES utility
│   └── types/
│       └── index.ts
├── uploads/                    # Uploaded files
├── package.json
├── tsconfig.json
└── .env
```

### 6.3 API Endpoint Design

```
# Autentikasi
POST   /api/auth/login                 # Login (admin/siswa)
POST   /api/auth/refresh               # Refresh token
POST   /api/auth/logout                # Logout
GET    /api/auth/me                    # Profil user saat ini

# Admin: Soal
GET    /api/exams                      # List soal (paginated, filterable)
POST   /api/exams                      # Tambah soal
GET    /api/exams/:id                  # Detail soal
PUT    /api/exams/:id                  # Edit soal
DELETE /api/exams/:id                  # Hapus soal
PUT    /api/exams/:id/toggle-status    # Aktif/nonaktif
POST   /api/exams/:id/duplicate        # Duplikasi
POST   /api/exams/:id/generate-token   # Generate token

# Admin: Butir Soal
GET    /api/exams/:examId/questions    # Daftar pertanyaan
POST   /api/exams/:examId/questions    # Tambah pertanyaan
PUT    /api/questions/:id              # Edit pertanyaan
DELETE /api/questions/:id              # Hapus pertanyaan
POST   /api/exams/:examId/import       # Import Excel

# Admin: Siswa
GET    /api/students                   # List siswa
POST   /api/students                   # Tambah siswa
GET    /api/students/:id               # Detail + riwayat
PUT    /api/students/:id               # Edit siswa
DELETE /api/students/:id               # Hapus siswa
POST   /api/students/import            # Import Excel

# Admin: Monitoring (WebSocket + REST)
GET    /api/monitoring                 # Data monitoring
GET    /api/monitoring/online          # Siswa online
POST   /api/monitoring/force-save      # Simpan paksa
POST   /api/monitoring/force-logout    # Logout paksa
WS     /ws/monitoring                  # Real-time updates via Socket.IO

# Admin: Hasil & Koreksi
GET    /api/results                    # Filter hasil
GET    /api/results/:studentId/:examId # Preview jawaban
PUT    /api/results/essay-score        # Simpan nilai uraian
DELETE /api/results/:id                # Hapus nilai
GET    /api/results/export             # Export Excel

# Admin: Pengaturan
GET    /api/settings                   # Ambil pengaturan
PUT    /api/settings                   # Update pengaturan
PUT    /api/settings/profile           # Update profil admin
POST   /api/upload/logo                # Upload logo
POST   /api/upload/image               # Upload gambar soal

# Siswa: Ujian
GET    /api/student/exams              # Daftar ujian tersedia
POST   /api/student/exams/verify       # Verifikasi token + mulai
GET    /api/student/exams/:id/start    # Ambil soal
POST   /api/student/exams/auto-save    # Auto-save jawaban
POST   /api/student/exams/submit       # Submit akhir
POST   /api/student/activity           # Update activity

# Siswa: Hasil
GET    /api/student/results            # Riwayat nilai
GET    /api/student/results/:examId    # Detail hasil
```

---

## 7. Estimasi dan Prioritas

### Prioritas Berdasarkan Risiko & Kompleksitas

| Komponen | Kompleksitas | Risiko | Prioritas | Estimasi |
|----------|-------------|--------|-----------|----------|
| Auth + JWT | Medium | Tinggi | P0 | 5 hari |
| Layout Admin/Siswa | Rendah | Rendah | P0 | 3 hari |
| CRUD Bank Soal | Medium | Rendah | P0 | 5 hari |
| CRUD Butir Soal | Medium | Rendah | P0 | 5 hari |
| Import Excel | Medium | Medium | P2 | 3 hari |
| **Engine Ujian Utama** | **Tinggi** | **Tinggi** | **P0** | **15 hari** |
| 5 Tipe Soal | Tinggi | Tinggi | P0 | 10 hari |
| Timer + Auto-save | Medium | Tinggi | P0 | 4 hari |
| Koreksi Otomatis | Tinggi | Tinggi | P0 | 5 hari |
| Anti-Cheat | Medium | Medium | P0 | 3 hari |
| Monitoring (Socket.IO) | Tinggi | Medium | P1 | 7 hari |
| Koreksi Uraian | Medium | Medium | P1 | 3 hari |
| Export Excel | Rendah | Rendah | P2 | 2 hari |
| Kartu Peserta (PDF) | Rendah | Rendah | P2 | 2 hari |
| Pengaturan | Medium | Rendah | P1 | 3 hari |
| **Total (working days)** | | | | **~75 hari** |

### Kritis Path
```
Setup → Auth → Layout → CRUD Soal → Butir Soal → Engine Ujian → Monitoring & Koreksi
```

---

## 8. Catatan Teknis

### 8.1 Migrasi Anti-Cheat PHP → JavaScript

| Fitur PHP (JS inline) | Implementasi React |
|-----------------------|-------------------|
| `contextmenu` block | `document.addEventListener('contextmenu', e => e.preventDefault())` di `useEffect` |
| F12 / Ctrl+Shift+I block | Keyboard event listener di `useEffect` |
| Ctrl+C / Ctrl+V block | `copy` + `paste` event prevention |
| `visibilitychange` warning | `document.addEventListener('visibilitychange', ...)` + log via API |
| Copyright footer check | `setInterval` check DOM element existence |

### 8.2 Migrasi Tipe Soal ke React Components

```typescript
// Types
type QuestionType = 'multiple_choice' | 'complex_multiple_choice' | 'true_false' | 'matching' | 'essay';

interface Question {
  id: number;
  examId: number;
  questionNumber: number;
  questionType: QuestionType;
  questionText: string; // HTML string from rich editor
  options: { key: string; value: string }[];
  correctAnswer: string | string[] | Record<string, string>;
}

// Component mapping
const QuestionRenderer: Record<QuestionType, React.FC<QuestionProps>> = {
  multiple_choice: MultipleChoiceQuestion,
  complex_multiple_choice: ComplexMultipleChoiceQuestion,
  true_false: TrueFalseQuestion,
  matching: MatchingQuestion,
  essay: EssayQuestion,
};
```

### 8.3 Scoring Logic (Javascript)

Fungsi koreksi akan di-port dari PHP ke TypeScript sebagai pure function:

```typescript
// src/lib/scoring.ts
function calculateScore(
  answers: Record<string, string | string[] | Record<string, string>>,
  answerKey: string,
  questions: Question[]
): ScoreResult {
  // Logic equivalent to simpan_jawaban.php
  // - Multiple choice: exact match
  // - Complex multiple choice: set comparison with partial credit
  // - True/False & Matching: per-item scoring
  // - Essay: skip (manual grading)
}
```

### 8.4 Keamanan

- JWT dengan access token (15 menit) + refresh token (7 hari)
- HTTP-only cookies untuk refresh token
- bcrypt untuk password hashing
- Rate limiting pada endpoint login
- CORS strict origin
- Input validation dengan Zod (frontend + backend)
- SQL injection prevention via Drizzle ORM (parameterized queries)
- File upload validation (type, size, virus scanning)
- XSS prevention: sanitasi HTML dari rich text editor
- CSRF protection via double-submit cookie pattern

### 8.5 Environment Variables (.env)

```env
# Backend
DATABASE_URL=postgresql://user:password@localhost:5432/cbt_db
JWT_ACCESS_SECRET=your-access-secret
JWT_REFRESH_SECRET=your-refresh-secret
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d
UPLOAD_DIR=./uploads
MAX_FILE_SIZE=2097152
CORS_ORIGIN=http://localhost:5173
PORT=3001

# Frontend
VITE_API_URL=http://localhost:3001/api
VITE_WS_URL=ws://localhost:3001
```

---

### 8.6 Deployment ke Vercel

#### Monorepo Structure
```
root/
├── cbt-frontend/     → Vite React SPA (static)
├── cbt-backend/       → Express API (serverless functions)
├── vercel.json        # Root config: routing frontend + backend
└── .gitignore
```

#### Vercel Configuration (Root `vercel.json`)
```json
{
  "installCommand": "cd cbt-backend && npm install && cd ../cbt-frontend && npm install",
  "buildCommand": "cd cbt-frontend && npm run build",
  "outputDirectory": "cbt-frontend/dist",
  "rewrites": [
    { "source": "/api/(.*)", "destination": "/api/$1" },
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "functions": {
    "api/*.js": { "maxDuration": 30 }
  }
}
```

#### Env Vars di Vercel Dashboard
| Key | Value |
|-----|-------|
| `SUPABASE_URL` | `https://fohlvsrvyzoepyjfcvej.supabase.co` |
| `SUPABASE_ANON_KEY` | `eyJhbGciOi...` |
| `SUPABASE_SERVICE_ROLE_KEY` | (rahasia) |
| `JWT_ACCESS_SECRET` | (rahasia) |
| `JWT_REFRESH_SECRET` | (rahasia) |
| `CORS_ORIGIN` | `https://cbt-frontend.vercel.app` |

---

## 9. Status Implementasi Fase 1 (Foundation)

✅ =已完成 (Selesai)  |  ⏳ = Dalam Progres  |  ⬜ = Belum Dimulai

### 9.1 File yang Telah Dibuat

#### Root Configuration
| File | Status | Fungsi |
|------|--------|--------|
| `.gitignore` | ✅ | Ignore node_modules, .env, dist, dll untuk monorepo |
| `vercel.json` | ✅ | Root Vercel config: routing frontend + API |
| `package.json` | ✅ | Root workspace dengan scripts `dev`, `build`, `lint`, `typecheck` |
| `.github/workflows/deploy.yml` | ✅ | CI/CD: lint, typecheck, deploy frontend & backend ke Vercel |

#### Database & Supabase
| File | Status | Fungsi |
|------|--------|--------|
| `supabase/migrations/0000_initial.sql` | ✅ | Full DDL: users, exams, exam_questions, sessions, results, settings, activity_logs + seed data |

#### Frontend (`cbt-frontend/`)
| File | Status | Fungsi |
|------|--------|--------|
| `package.json` | ✅ | Dependencies: React 19, React Router v7, TanStack Query, Zustand, Recharts, shadcn/ui, Tailwind v4 |
| `vite.config.ts` | ✅ | Vite 6 + React + Tailwind + path alias `@/` + proxy `/api` |
| `tsconfig.json` | ✅ | TypeScript strict dengan path alias |
| `index.html` | ✅ | Entry HTML |
| `vercel.json` | ✅ | Vercel SPA deployment config |
| `.env.local.example` | ✅ | Template env variables |
| `src/main.tsx` | ✅ | Entry point: BrowserRouter + QueryClientProvider |
| `src/index.css` | ✅ | Tailwind v4 + CSS variables + dark mode |
| `src/App.tsx` | ✅ | Routes: Login, Admin/* (6 pages placeholder), Student/* (3 pages placeholder) |
| `src/vite-env.d.ts` | ✅ | TypeScript env type declarations |
| `src/types/index.ts` | ✅ | All TypeScript interfaces: User, Auth, Exam, Question, Session, Result, DashboardStats |
| `src/lib/utils.ts` | ✅ | Utility: cn(), formatDate(), formatTime(), generateToken() |
| `src/lib/supabase.ts` | ✅ | Supabase client initialization |
| `src/api/client.ts` | ✅ | Axios instance + JWT interceptor + auto-refresh + all API functions |
| `src/stores/authStore.ts` | ✅ | Zustand auth store: login, logout, checkAuth, JWT cookies |
| `src/hooks/useAuth.ts` | ✅ | Auth hook dengan auto-redirect & role guard |
| `src/components/ui/button.tsx` | ✅ | Button component (primary/secondary/outline/ghost/danger) + sizes |
| `src/components/ui/input.tsx` | ✅ | Input component with label + error state |
| `src/components/ui/card.tsx` | ✅ | Card, CardHeader, CardTitle, CardContent |
| `src/components/ui/badge.tsx` | ✅ | Badge component (default/success/warning/danger/info) |
| `src/components/layout/AdminSidebar.tsx` | ✅ | Collapsible sidebar: Dashboard, Bank Soal, Siswa, Monitoring, Hasil, Pengaturan |
| `src/components/layout/AdminNavbar.tsx` | ✅ | Admin navbar: user info + logout button |
| `src/components/layout/AdminLayout.tsx` | ✅ | Admin layout: Sidebar + Navbar + Outlet |
| `src/components/layout/StudentSidebar.tsx` | ✅ | Student sidebar: Dashboard, Daftar Ujian, Hasil |
| `src/components/layout/StudentNavbar.tsx` | ✅ | Student navbar: name + class + logout |
| `src/components/layout/StudentLayout.tsx` | ✅ | Student layout: Sidebar + Navbar + Outlet |
| `src/features/auth/LoginPage.tsx` | ✅ | Login multi-role (Admin/Siswa tab) + form validation + error handling + show/hide password |
| `src/features/admin/dashboard/AdminDashboard.tsx` | ✅ | Admin dashboard: 4 stat cards + bar chart + recent results list |
| `src/features/student/dashboard/StudentDashboard.tsx` | ✅ | Student dashboard: 3 stat cards + exams list + results list |

#### Backend (`cbt-backend/`)
| File | Status | Fungsi |
|------|--------|--------|
| `package.json` | ✅ | Dependencies: Express, Drizzle ORM, Supabase, JWT, bcrypt, Zod, Multer, Helmet, Rate-limit |
| `tsconfig.json` | ✅ | TypeScript config |
| `drizzle.config.ts` | ✅ | Drizzle Kit config |
| `vercel.json` | ✅ | Vercel serverless config |
| `api/index.ts` | ✅ | Vercel serverless entry point |
| `.env.example` | ✅ | Template env dengan Supabase + JWT config |
| `src/config/env.ts` | ✅ | Zod-validated environment variables |
| `src/db/index.ts` | ✅ | Drizzle ORM + Postgres.js client |
| `src/db/schema/users.ts` | ✅ | Users table schema (Drizzle ORM) |
| `src/db/schema/exams.ts` | ✅ | Exams table schema |
| `src/db/schema/questions.ts` | ✅ | Exam questions table schema |
| `src/db/schema/sessions.ts` | ✅ | Student exam sessions table schema |
| `src/db/schema/results.ts` | ✅ | Exam results table schema |
| `src/db/schema/settings.ts` | ✅ | Settings table schema (JSONB) |
| `src/db/schema/activityLogs.ts` | ✅ | Activity logs table schema |
| `src/db/schema/index.ts` | ✅ | Schema barrel export |
| `src/db/seed.ts` | ✅ | Seed script: admin + student users, default settings |
| `src/types/index.ts` | ✅ | Backend type definitions |
| `src/utils/jwt.ts` | ✅ | JWT sign/verify for access + refresh tokens |
| `src/middleware/auth.ts` | ✅ | JWT authentication middleware + optional auth |
| `src/middleware/role.ts` | ✅ | Role-based authorization middleware |
| `src/middleware/validate.ts` | ✅ | Zod validation middleware |
| `src/modules/auth/auth.schema.ts` | ✅ | Zod schemas: login, refresh |
| `src/modules/auth/auth.service.ts` | ✅ | Auth service: login, refresh, logout, getMe |
| `src/modules/auth/auth.controller.ts` | ✅ | Auth controller with error handling |
| `src/modules/auth/auth.routes.ts` | ✅ | Auth routes: POST /login, /refresh, /logout, GET /me |
| `src/app.ts` | ✅ | Express app: CORS, Helmet, Rate-limit, Morgan, routes, error handler |
| `src/index.ts` | ✅ | Server entry point |

### 9.2 Arsitektur yang Terimplementasi

```
root/
├── vercel.json                # Monorepo routing frontend + backend
├── .gitignore
├── package.json               # Root workspace
├── .github/workflows/         # CI/CD
├── supabase/migrations/       # Database DDL
│
├── cbt-frontend/              # Vite React SPA
│   ├── src/
│   │   ├── api/               # Axios + JWT interceptor
│   │   ├── components/
│   │   │   ├── ui/            # Button, Input, Card, Badge
│   │   │   └── layout/        # AdminLayout, StudentLayout
│   │   ├── features/
│   │   │   ├── auth/          # LoginPage (multi-role)
│   │   │   ├── admin/         # AdminDashboard
│   │   │   └── student/       # StudentDashboard
│   │   ├── hooks/             # useAuth
│   │   ├── lib/               # utils, supabase
│   │   ├── stores/            # authStore (Zustand)
│   │   └── types/             # TypeScript interfaces
│   └── vite.config.ts
│
└── cbt-backend/               # Express API (Vercel Serverless)
    ├── api/index.ts           # Serverless entry
    └── src/
        ├── config/            # Environment validation
        ├── db/schema/         # Drizzle ORM schemas
        ├── middleware/        # auth, role, validate
        ├── modules/auth/      # Login, refresh, logout
        └── utils/             # JWT utilities
```

### 9.3 Cara Menjalankan

```bash
# 1. Clone repo
git clone <repo-url>
cd cbt-eschool

# 2. Setup database
#    Buka supabase/migrations/0000_initial.sql
#    Jalankan di Supabase SQL Editor

# 3. Backend
cd cbt-backend
cp .env.example .env
# Edit .env: isi SUPABASE_SERVICE_ROLE_KEY + JWT secrets
npm install
npm run dev          # http://localhost:3001

# 4. Frontend (terminal baru)
cd cbt-frontend
cp .env.local.example .env.local
npm install
npm run dev          # http://localhost:5173

# 5. Buka browser → http://localhost:5173
#    Login Admin:  gludug / password
#    Login Siswa:  ahmad123 / password
```

### 9.4 Yang Perlu Disiapkan Sebelum Push ke GitHub

| No | Item | Keterangan |
|----|------|------------|
| 1 | Buat repo GitHub baru | Contoh: `cbt-eschool` |
| 2 | Generate JWT secrets | Jalankan `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"` |
| 3 | Dapatkan `SUPABASE_SERVICE_ROLE_KEY` | Dari Supabase Dashboard → Settings → API |
| 4 | Setup Vercel projects | Buat 2 project: `cbt-frontend` & `cbt-backend` |
| 5 | Tambahkan secrets ke GitHub | `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_FRONTEND_PROJECT_ID`, `VERCEL_BACKEND_PROJECT_ID` |
| 6 | Push ke `main` branch | CI/CD akan otomatis deploy |

---

## Catatan Akhir

Dokumen ini akan terus diperbarui seiring diskusi lebih lanjut. 
Beberapa hal yang masih perlu didiskusikan:

1. **Fitur tambahan** setelah migrasi dasar selesai
2. **Backup & rollback plan** saat cut-over
3. **Training pengguna** (admin/guru/siswa) untuk antarmuka baru

---

*Dokumen dibuat: 10 Juli 2026*  
*Oleh: OpenCode AI - Berdasarkan analisis folder `referensi cbtphpbaru`*

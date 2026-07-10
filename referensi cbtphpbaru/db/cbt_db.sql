SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE DATABASE IF NOT EXISTS `cbt_db`;
USE `cbt_db`;

CREATE TABLE IF NOT EXISTS `admins` (
  `id` int(11) NOT NULL,
  `username` varchar(50) NOT NULL,
  `nama_admin` text NOT NULL,
  `password` varchar(255) NOT NULL,
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `admins` (`id`, `username`, `nama_admin`, `password`, `created_at`) VALUES
(1, 'gludug', 'Betara', 'admin123', '2025-05-05 09:13:31'),
(2, 'admin1', 'Administrator 1', 'admin123', '2025-01-15 08:00:00'),
(3, 'admin2', 'Administrator 2', 'admin123', '2025-02-20 09:30:00');

CREATE TABLE IF NOT EXISTS `butir_soal` (
  `id_soal` int(11) NOT NULL,
  `nomer_soal` int(11) NOT NULL,
  `kode_soal` varchar(50) NOT NULL,
  `pertanyaan` text NOT NULL,
  `tipe_soal` enum('Pilihan Ganda','Pilihan Ganda Kompleks','Benar/Salah','Uraian','Menjodohkan') NOT NULL,
  `pilihan_1` varchar(255) DEFAULT NULL,
  `pilihan_2` varchar(255) DEFAULT NULL,
  `pilihan_3` varchar(255) DEFAULT NULL,
  `pilihan_4` varchar(255) DEFAULT NULL,
  `jawaban_benar` text DEFAULT NULL,
  `status_soal` enum('Aktif','Tidak Aktif') DEFAULT 'Aktif',
  `created_at` timestamp NOT NULL DEFAULT current_timestamp()
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `jawaban_siswa` (
  `id_jawaban` int(11) NOT NULL,
  `id_siswa` int(11) NOT NULL,
  `nama_siswa` text NOT NULL,
  `kode_soal` varchar(50) NOT NULL,
  `total_soal` text NOT NULL,
  `jawaban_siswa` text DEFAULT NULL,
  `waktu_sisa` text NOT NULL,
  `waktu_dijawab` timestamp NOT NULL DEFAULT current_timestamp(),
  `status_ujian` enum('Aktif','Non-Aktif','Selesai') DEFAULT 'Aktif'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `nilai` (
  `id_nilai` int(11) NOT NULL,
  `id_siswa` int(11) NOT NULL,
  `nama_siswa` text NOT NULL,
  `kode_soal` varchar(250) NOT NULL,
  `total_soal` int(11) NOT NULL,
  `jawaban_benar` varchar(100) NOT NULL,
  `jawaban_salah` varchar(100) NOT NULL,
  `jawaban_kurang` varchar(100) NOT NULL,
  `jawaban_siswa` text NOT NULL,
  `kunci` text NOT NULL,
  `nilai` decimal(5,2) NOT NULL,
  `nilai_uraian` decimal(5,2) DEFAULT 0.00,
  `detail_uraian` text NOT NULL,
  `tanggal_ujian` datetime NOT NULL,
  `status_penilaian` enum('otomatis','perlu_dinilai','selesai') DEFAULT 'otomatis'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

CREATE TABLE IF NOT EXISTS `pengaturan` (
  `id` int(11) NOT NULL DEFAULT 1,
  `nama_aplikasi` varchar(100) DEFAULT 'CBT Siswa',
  `logo_sekolah` varchar(255) DEFAULT '',
  `warna_tema` varchar(10) DEFAULT '#0d6efd',
  `waktu_sinkronisasi` int(11) DEFAULT 60,
  `sembunyikan_nilai` tinyint(1) DEFAULT 0,
  `login_ganda` enum('izinkan','blokir') DEFAULT 'blokir',
  `chat` varchar(100) NOT NULL,
  `versi_aplikasi` varchar(20) DEFAULT '1.0.0'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `pengaturan` (`id`, `nama_aplikasi`, `logo_sekolah`, `warna_tema`, `waktu_sinkronisasi`, `sembunyikan_nilai`, `login_ganda`, `chat`, `versi_aplikasi`) VALUES
(1, 'CBT-Eschool', 'logo_1747650742.png', '#2f90c1', 60, 0, 'izinkan', 'izinkan', '1.1.7');

CREATE TABLE IF NOT EXISTS `profil` (
  `id` int(11) NOT NULL,
  `encrypt` varchar(50) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `profil` (`id`, `encrypt`) VALUES
(1, 'QCAgMjAyNSBOYWhh');

CREATE TABLE IF NOT EXISTS `siswa` (
  `id_siswa` int(11) NOT NULL,
  `nama_siswa` varchar(100) NOT NULL,
  `password` text NOT NULL,
  `username` varchar(200) NOT NULL,
  `kelas` varchar(100) NOT NULL,
  `rombel` varchar(100) NOT NULL,
  `status` varchar(50) DEFAULT 'Nonaktif',
  `session_token` varchar(255) NOT NULL,
  `last_activity` datetime DEFAULT NULL,
  `page_url` text NOT NULL,
  `force_logout` tinyint(1) DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `siswa` (`id_siswa`, `nama_siswa`, `password`, `username`, `kelas`, `rombel`, `status`, `session_token`, `last_activity`, `page_url`, `force_logout`) VALUES
(1, 'Ahmad Rahman', 'siswa123', 'ahmad123', 'XII IPA 1', 'A', 'Aktif', 'token123', '2025-11-17 14:00:00', '/dashboard', 0),
(2, 'Siti Nurhaliza', 'siswa123', 'siti456', 'XII IPA 1', 'A', 'Aktif', 'token456', '2025-11-17 13:30:00', '/dashboard', 0),
(3, 'Budi Santoso', 'siswa123', 'budi789', 'XII IPS 1', 'B', 'Aktif', 'token789', '2025-11-17 12:45:00', '/dashboard', 0),
(4, 'Maya Sari', 'siswa123', 'maya101', 'XI IPA 2', 'C', 'Aktif', 'token101', '2025-11-17 11:20:00', '/dashboard', 0),
(5, 'Rizki Pratama', 'siswa123', 'rizki202', 'XI IPS 2', 'D', 'Aktif', 'token202', '2025-11-17 10:15:00', '/dashboard', 0),
(6, 'Dewi Lestari', 'siswa123', 'dewi303', 'X IPA 1', 'A', 'Aktif', 'token303', '2025-11-17 09:00:00', '/dashboard', 0),
(7, 'Fajar Nugroho', 'siswa123', 'fajar404', 'X IPS 1', 'B', 'Aktif', 'token404', '2025-11-17 08:30:00', '/dashboard', 0),
(8, 'Intan Permata', 'siswa123', 'intan505', 'XII IPA 2', 'C', 'Aktif', 'token505', '2025-11-17 07:45:00', '/dashboard', 0),
(9, 'Gilang Ramadhan', 'siswa123', 'gilang606', 'XII IPS 2', 'D', 'Aktif', 'token606', '2025-11-17 06:20:00', '/dashboard', 0),
(10, 'Nadia Putri', 'siswa123', 'nadia707', 'XI IPA 1', 'A', 'Aktif', 'token707', '2025-11-17 05:10:00', '/dashboard', 0);

CREATE TABLE `soal` (
  `id_soal` int(11) NOT NULL,
  `kode_soal` varchar(200) NOT NULL,
  `nama_soal` varchar(255) NOT NULL,
  `mapel` varchar(100) NOT NULL,
  `kelas` varchar(50) NOT NULL,
  `waktu_ujian` int(11) DEFAULT 60,
  `tanggal` date DEFAULT (CURDATE()),
  `status` varchar(50) DEFAULT 'Nonaktif',
  `tampilan_soal` varchar(10) NOT NULL,
  `kunci` text NOT NULL,
  `token` varchar(6) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

INSERT INTO `soal` (`id_soal`, `kode_soal`, `nama_soal`, `mapel`, `kelas`, `waktu_ujian`, `tanggal`, `status`, `tampilan_soal`, `kunci`, `token`) VALUES
(1, 'MTK001', 'Matematika Dasar', 'Matematika', 'XII IPA 1', 90, '2025-11-20', 'Aktif', 'acak', 'A,B,C,D,A,B,C,D,A,B', 'ABC123'),
(2, 'BIO001', 'Biologi Sel', 'Biologi', 'XII IPA 1', 75, '2025-11-21', 'Aktif', 'acak', 'A,B,C,A,B,C,A,B,C,A', 'DEF456'),
(3, 'FIS001', 'Fisika Mekanika', 'Fisika', 'XII IPA 2', 80, '2025-11-22', 'Aktif', 'acak', 'B,C,D,A,B,C,D,A,B,C', 'GHI789'),
(4, 'KIM001', 'Kimia Organik', 'Kimia', 'XI IPA 1', 70, '2025-11-23', 'Aktif', 'acak', 'C,D,A,B,C,D,A,B,C,D', 'JKL012'),
(5, 'SOS001', 'Sejarah Indonesia', 'Sejarah', 'XII IPS 1', 60, '2025-11-24', 'Aktif', 'acak', 'A,C,B,D,A,C,B,D,A,C', 'MNO345'),
(6, 'GEO001', 'Geografi Regional', 'Geografi', 'XI IPS 2', 65, '2025-11-25', 'Aktif', 'acak', 'B,D,C,A,B,D,C,A,B,D', 'PQR678'),
(7, 'EKO001', 'Ekonomi Mikro', 'Ekonomi', 'XII IPS 2', 55, '2025-11-26', 'Aktif', 'acak', 'C,A,D,B,C,A,D,B,C,A', 'STU901'),
(8, 'ING001', 'English Grammar', 'Bahasa Inggris', 'X IPA 1', 50, '2025-11-27', 'Aktif', 'acak', 'A,B,C,D,A,B,C,D,A,B', 'VWX234');

INSERT INTO `butir_soal` (`id_soal`, `nomer_soal`, `kode_soal`, `pertanyaan`, `tipe_soal`, `pilihan_1`, `pilihan_2`, `pilihan_3`, `pilihan_4`, `jawaban_benar`, `status_soal`, `created_at`) VALUES
(1, 1, 'MTK001', 'Berapakah hasil dari 2 + 2?', 'Pilihan Ganda', '2', '3', '4', '5', 'C', 'Aktif', '2025-11-15 10:00:00'),
(2, 2, 'MTK001', 'Berapakah akar kuadrat dari 16?', 'Pilihan Ganda', '2', '4', '6', '8', 'B', 'Aktif', '2025-11-15 10:05:00'),
(3, 3, 'MTK001', 'Berapakah hasil dari 10 x 5?', 'Pilihan Ganda', '40', '45', '50', '55', 'C', 'Aktif', '2025-11-15 10:10:00'),
(4, 4, 'MTK001', 'Berapakah nilai dari π (pi) secara umum?', 'Pilihan Ganda', '3.14', '3.1416', '22/7', 'Semua benar', 'D', 'Aktif', '2025-11-15 10:15:00'),
(5, 5, 'MTK001', 'Berapakah hasil dari 100 ÷ 4?', 'Pilihan Ganda', '20', '25', '30', '35', 'B', 'Aktif', '2025-11-15 10:20:00'),
(6, 1, 'BIO001', 'Apa yang merupakan unit terkecil kehidupan?', 'Pilihan Ganda', 'Atom', 'Molekul', 'Sel', 'Jaringan', 'C', 'Aktif', '2025-11-15 11:00:00'),
(7, 2, 'BIO001', 'Dimana terletak kloroplas pada tumbuhan?', 'Pilihan Ganda', 'Akar', 'Batang', 'Daun', 'Bunga', 'C', 'Aktif', '2025-11-15 11:05:00'),
(8, 3, 'BIO001', 'Apa fungsi utama mitokondria?', 'Pilihan Ganda', 'Penyimpanan makanan', 'Pembuat energi', 'Pengatur osmosis', 'Sintesis protein', 'B', 'Aktif', '2025-11-15 11:10:00'),
(9, 4, 'BIO001', 'Berapakah jumlah kromosom pada manusia normal?', 'Pilihan Ganda', '22', '23', '44', '46', 'D', 'Aktif', '2025-11-15 11:15:00'),
(10, 5, 'BIO001', 'Apa yang dimaksud dengan fotosintesis?', 'Pilihan Ganda', 'Proses pembentukan energi dari cahaya', 'Proses pembentukan energi dari makanan', 'Proses pembentukan energi dari oksigen', 'Proses pembentukan energi dari air', 'A', 'Aktif', '2025-11-15 11:20:00'),
(11, 1, 'FIS001', 'Apa satuan dari gaya?', 'Pilihan Ganda', 'Newton', 'Joule', 'Watt', 'Pascal', 'A', 'Aktif', '2025-11-15 12:00:00'),
(12, 2, 'FIS001', 'Rumus kecepatan adalah...', 'Pilihan Ganda', 'v = s/t', 'v = m/s²', 'v = F/m', 'v = P/F', 'A', 'Aktif', '2025-11-15 12:05:00'),
(13, 3, 'FIS001', 'Apa yang dimaksud dengan hukum Newton pertama?', 'Pilihan Ganda', 'Gaya = massa x percepatan', 'Benda diam akan tetap diam, benda bergerak akan tetap bergerak', 'Gaya aksi-reaksi', 'Semua benda jatuh dengan percepatan sama', 'B', 'Aktif', '2025-11-15 12:10:00'),
(14, 4, 'FIS001', 'Berapakah percepatan gravitasi bumi?', 'Pilihan Ganda', '8 m/s²', '9.8 m/s²', '10 m/s²', '11 m/s²', 'B', 'Aktif', '2025-11-15 12:15:00'),
(15, 5, 'FIS001', 'Apa rumus energi kinetik?', 'Pilihan Ganda', 'EK = 1/2 mv', 'EK = mgh', 'EK = mc²', 'EK = F x s', 'A', 'Aktif', '2025-11-15 12:20:00'),
(16, 1, 'KIM001', 'Apa simbol unsur karbon?', 'Pilihan Ganda', 'Ca', 'C', 'Co', 'Cu', 'B', 'Aktif', '2025-11-15 13:00:00'),
(17, 2, 'KIM001', 'Berapakah nomor atom oksigen?', 'Pilihan Ganda', '6', '7', '8', '9', 'C', 'Aktif', '2025-11-15 13:05:00'),
(18, 3, 'KIM001', 'Apa yang dimaksud dengan pH?', 'Pilihan Ganda', 'Tingkat keasaman', 'Tingkat kebasaan', 'Tingkat kelembaban', 'Tingkat kekerasan', 'A', 'Aktif', '2025-11-15 13:10:00'),
(19, 4, 'KIM001', 'Rumus kimia air adalah...', 'Pilihan Ganda', 'H2', 'O2', 'CO2', 'H2O', 'D', 'Aktif', '2025-11-15 13:15:00'),
(20, 5, 'KIM001', 'Apa yang terjadi pada suhu didih air di gunung tinggi?', 'Pilihan Ganda', 'Meningkat', 'Menurun', 'Tetap sama', 'Bergantung pada tekanan', 'B', 'Aktif', '2025-11-15 13:20:00'),
(21, 1, 'SOS001', 'Tahun berapakah Indonesia merdeka?', 'Pilihan Ganda', '1944', '1945', '1946', '1947', 'B', 'Aktif', '2025-11-15 14:00:00'),
(22, 2, 'SOS001', 'Siapa proklamator kemerdekaan Indonesia?', 'Pilihan Ganda', 'Soekarno saja', 'Hatta saja', 'Soekarno dan Hatta', 'Sukarno dan Suharto', 'C', 'Aktif', '2025-11-15 14:05:00'),
(23, 3, 'SOS001', 'Apa nama ibukota Indonesia sebelum Jakarta?', 'Pilihan Ganda', 'Bandung', 'Yogyakarta', 'Surabaya', 'Batavia', 'D', 'Aktif', '2025-11-15 14:10:00'),
(24, 4, 'SOS001', 'Berapakah jumlah provinsi di Indonesia saat ini?', 'Pilihan Ganda', '32', '33', '34', '35', 'C', 'Aktif', '2025-11-15 14:15:00'),
(25, 5, 'SOS001', 'Apa nama kerajaan Hindu-Buddha terbesar di Indonesia?', 'Pilihan Ganda', 'Sriwijaya', 'Majapahit', 'Mataram', 'Singasari', 'B', 'Aktif', '2025-11-15 14:20:00'),
(26, 1, 'GEO001', 'Apa ibukota Indonesia?', 'Pilihan Ganda', 'Bandung', 'Jakarta', 'Surabaya', 'Medan', 'B', 'Aktif', '2025-11-15 15:00:00'),
(27, 2, 'GEO001', 'Dimana letak Gunung Everest?', 'Pilihan Ganda', 'Asia', 'Afrika', 'Amerika', 'Eropa', 'A', 'Aktif', '2025-11-15 15:05:00'),
(28, 3, 'GEO001', 'Apa nama benua terbesar?', 'Pilihan Ganda', 'Afrika', 'Amerika', 'Asia', 'Australia', 'C', 'Aktif', '2025-11-15 15:10:00'),
(29, 4, 'GEO001', 'Berapakah jumlah samudra di dunia?', 'Pilihan Ganda', '3', '4', '5', '6', 'C', 'Aktif', '2025-11-15 15:15:00'),
(30, 5, 'GEO001', 'Apa yang dimaksud dengan iklim?', 'Pilihan Ganda', 'Cuaca harian', 'Cuaca jangka panjang', 'Suhu udara', 'Kelembaban udara', 'B', 'Aktif', '2025-11-15 15:20:00'),
(31, 1, 'EKO001', 'Apa yang dimaksud dengan ekonomi?', 'Pilihan Ganda', 'Ilmu tentang uang', 'Ilmu tentang produksi dan konsumsi', 'Ilmu tentang perdagangan', 'Ilmu tentang pertanian', 'B', 'Aktif', '2025-11-15 16:00:00'),
(32, 2, 'EKO001', 'Apa fungsi uang?', 'Pilihan Ganda', 'Alat tukar', 'Alat simpan', 'Alat ukur nilai', 'Semua benar', 'D', 'Aktif', '2025-11-15 16:05:00'),
(33, 3, 'EKO001', 'Apa yang dimaksud dengan inflasi?', 'Pilihan Ganda', 'Kenaikan harga', 'Penurunan harga', 'Stabilitas harga', 'Fluktuasi harga', 'A', 'Aktif', '2025-11-15 16:10:00'),
(34, 4, 'EKO001', 'Apa contoh barang substitusi?', 'Pilihan Ganda', 'Beras dan gula', 'Beras dan nasi', 'Mobil dan bensin', 'Rumah dan apartemen', 'D', 'Aktif', '2025-11-15 16:15:00'),
(35, 5, 'EKO001', 'Apa yang dimaksud dengan PDB?', 'Pilihan Ganda', 'Produk Domestik Bruto', 'Produk Dalam Negeri', 'Pendapatan Dalam Negeri', 'Produk Daerah Bruto', 'A', 'Aktif', '2025-11-15 16:20:00'),
(36, 1, 'ING001', 'What is the correct form: "She ___ to school every day."', 'Pilihan Ganda', 'go', 'goes', 'going', 'gone', 'B', 'Aktif', '2025-11-15 17:00:00'),
(37, 2, 'ING001', 'Choose the correct article: "___ apple a day keeps the doctor away."', 'Pilihan Ganda', 'A', 'An', 'The', 'No article', 'B', 'Aktif', '2025-11-15 17:05:00'),
(38, 3, 'ING001', 'What is the past tense of "eat"?', 'Pilihan Ganda', 'eated', 'ate', 'eaten', 'eating', 'B', 'Aktif', '2025-11-15 17:10:00'),
(39, 4, 'ING001', 'Which sentence is correct?', 'Pilihan Ganda', 'I have a book red', 'I have a red book', 'I have book a red', 'I have red a book', 'B', 'Aktif', '2025-11-15 17:15:00'),
(40, 5, 'ING001', 'What does "happy" mean?', 'Pilihan Ganda', 'Sedih', 'Marah', 'Senang', 'Takut', 'C', 'Aktif', '2025-11-15 17:20:00');

ALTER TABLE `admins`
  ADD PRIMARY KEY (`id`),
  ADD UNIQUE KEY `username` (`username`);

INSERT INTO `jawaban_siswa` (`id_jawaban`, `id_siswa`, `nama_siswa`, `kode_soal`, `total_soal`, `jawaban_siswa`, `waktu_sisa`, `waktu_dijawab`, `status_ujian`) VALUES
(1, 1, 'Ahmad Rahman', 'MTK001', '10', 'C,B,C,D,B,A,B,C,D,A', '00:15:30', '2025-11-20 10:45:00', 'Selesai'),
(2, 2, 'Siti Nurhaliza', 'MTK001', '10', 'C,B,C,A,B,C,B,C,D,A', '00:20:15', '2025-11-20 11:10:00', 'Selesai'),
(3, 3, 'Budi Santoso', 'SOS001', '10', 'B,C,D,C,B,A,C,B,D,A', '00:25:45', '2025-11-24 14:35:00', 'Selesai'),
(4, 4, 'Maya Sari', 'KIM001', '10', 'B,C,A,D,B,C,D,A,C,D', '00:18:20', '2025-11-23 13:42:00', 'Selesai'),
(5, 5, 'Rizki Pratama', 'GEO001', '10', 'B,A,C,C,B,D,C,A,B,D', '00:22:10', '2025-11-25 15:38:00', 'Selesai'),
(6, 6, 'Dewi Lestari', 'ING001', '10', 'B,B,B,B,C,A,B,C,D,C', '00:12:05', '2025-11-27 17:48:00', 'Selesai'),
(7, 7, 'Fajar Nugroho', 'EKO001', '10', 'B,D,A,D,A,C,A,D,B,C', '00:16:30', '2025-11-26 16:44:00', 'Selesai'),
(8, 8, 'Intan Permata', 'FIS001', '10', 'A,A,B,B,A,B,C,D,A,C', '00:19:55', '2025-11-22 12:41:00', 'Selesai'),
(9, 9, 'Gilang Ramadhan', 'BIO001', '10', 'C,C,B,D,A,B,C,A,D,C', '00:14:40', '2025-11-21 11:46:00', 'Selesai'),
(10, 10, 'Nadia Putri', 'MTK001', '10', 'C,B,C,D,A,B,C,D,A,B', '00:10:25', '2025-11-20 10:50:00', 'Aktif');

ALTER TABLE `butir_soal`
  ADD PRIMARY KEY (`id_soal`);

INSERT INTO `nilai` (`id_nilai`, `id_siswa`, `nama_siswa`, `kode_soal`, `total_soal`, `jawaban_benar`, `jawaban_salah`, `jawaban_kurang`, `jawaban_siswa`, `kunci`, `nilai`, `nilai_uraian`, `detail_uraian`, `tanggal_ujian`, `status_penilaian`) VALUES
(1, 1, 'Ahmad Rahman', 'MTK001', 10, '8', '2', '0', 'C,B,C,D,B,A,B,C,D,A', 'A,B,C,D,A,B,C,D,A,B', 80.00, 0.00, 'Tidak ada soal uraian', '2025-11-20 10:45:00', 'otomatis'),
(2, 2, 'Siti Nurhaliza', 'MTK001', 10, '7', '3', '0', 'C,B,C,A,B,C,B,C,D,A', 'A,B,C,D,A,B,C,D,A,B', 70.00, 0.00, 'Tidak ada soal uraian', '2025-11-20 11:10:00', 'otomatis'),
(3, 3, 'Budi Santoso', 'SOS001', 10, '6', '4', '0', 'B,C,D,C,B,A,C,B,D,A', 'A,C,B,D,A,C,B,D,A,C', 60.00, 0.00, 'Tidak ada soal uraian', '2025-11-24 14:35:00', 'otomatis'),
(4, 4, 'Maya Sari', 'KIM001', 10, '9', '1', '0', 'B,C,A,D,B,C,D,A,C,D', 'C,D,A,B,C,D,A,B,C,D', 90.00, 0.00, 'Tidak ada soal uraian', '2025-11-23 13:42:00', 'otomatis'),
(5, 5, 'Rizki Pratama', 'GEO001', 10, '5', '5', '0', 'B,A,C,C,B,D,C,A,B,D', 'B,D,C,A,B,D,C,A,B,D', 50.00, 0.00, 'Tidak ada soal uraian', '2025-11-25 15:38:00', 'otomatis'),
(6, 6, 'Dewi Lestari', 'ING001', 10, '4', '6', '0', 'B,B,B,B,C,A,B,C,D,C', 'A,B,C,D,A,B,C,D,A,B', 40.00, 0.00, 'Tidak ada soal uraian', '2025-11-27 17:48:00', 'otomatis'),
(7, 7, 'Fajar Nugroho', 'EKO001', 10, '7', '3', '0', 'B,D,A,D,A,C,A,D,B,C', 'C,A,D,B,C,A,D,B,C,A', 70.00, 0.00, 'Tidak ada soal uraian', '2025-11-26 16:44:00', 'otomatis'),
(8, 8, 'Intan Permata', 'FIS001', 10, '6', '4', '0', 'A,A,B,B,A,B,C,D,A,C', 'B,C,D,A,B,C,D,A,B,C', 60.00, 0.00, 'Tidak ada soal uraian', '2025-11-22 12:41:00', 'otomatis'),
(9, 9, 'Gilang Ramadhan', 'BIO001', 10, '8', '2', '0', 'C,C,B,D,A,B,C,A,D,C', 'A,B,C,A,B,C,A,B,C,A', 80.00, 0.00, 'Tidak ada soal uraian', '2025-11-21 11:46:00', 'otomatis');

ALTER TABLE `jawaban_siswa`
  ADD PRIMARY KEY (`id_jawaban`),
  ADD UNIQUE KEY `id_jawaban` (`id_jawaban`),
  ADD UNIQUE KEY `unik_jawaban` (`id_siswa`,`kode_soal`),
  ADD KEY `kode_soal` (`kode_soal`);

ALTER TABLE `nilai`
  ADD PRIMARY KEY (`id_nilai`),
  ADD UNIQUE KEY `unique_siswa_soal` (`id_siswa`,`kode_soal`);

ALTER TABLE `pengaturan`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `profil`
  ADD PRIMARY KEY (`id`);

ALTER TABLE `siswa`
  ADD PRIMARY KEY (`id_siswa`),
  ADD UNIQUE KEY `username` (`username`);

ALTER TABLE `soal`
  ADD PRIMARY KEY (`id_soal`),
  ADD UNIQUE KEY `kode_soal` (`kode_soal`);

ALTER TABLE `admins`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;

ALTER TABLE `butir_soal`
  MODIFY `id_soal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=41;

ALTER TABLE `jawaban_siswa`
  MODIFY `id_jawaban` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

ALTER TABLE `nilai`
  MODIFY `id_nilai` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=10;

ALTER TABLE `siswa`
  MODIFY `id_siswa` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=11;

ALTER TABLE `soal`
  MODIFY `id_soal` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=9;

COMMIT;
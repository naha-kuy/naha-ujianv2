<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
check_login('admin');
include '../inc/dataadmin.php';
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Pengaturan</title>
    <?php include '../inc/css.php'; ?>
    <style>
    .nav-tabs-custom {
        border-bottom: 2px solid #dee2e6;
        background: #f8f9fa;
        border-radius: 0.5rem 0.5rem 0 0;
    }

    .nav-tabs-custom .nav-link {
        border: none;
        color: #6c757d;
        font-weight: 500;
        padding: 1rem 1.5rem;
        transition: all 0.3s ease;
    }

    .nav-tabs-custom .nav-link.active {
        background: white;
        color: #007bff;
        border-bottom: 3px solid #007bff;
        border-radius: 0.5rem 0.5rem 0 0;
    }

    .nav-tabs-custom .nav-link:hover:not(.active) {
        background: rgba(0,123,255,0.1);
        color: #007bff;
    }

    .tab-content-custom {
        background: white;
        border: 1px solid #dee2e6;
        border-top: none;
        border-radius: 0 0 0.5rem 0.5rem;
        padding: 2rem;
    }

    .color-box {
        transition: all 0.2s ease;
    }

    .color-box:hover {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
    }

    .color-box.border-3 {
        transform: scale(1.1);
        box-shadow: 0 4px 8px rgba(0,0,0,0.3);
    }

    .form-group {
        margin-bottom: 2rem;
    }

    .form-label {
        margin-bottom: 0.75rem;
        font-size: 0.95rem;
    }

    .form-control-lg {
        padding: 0.75rem 1rem;
        font-size: 1rem;
    }

    .form-select-lg {
        padding: 0.75rem 1rem;
        font-size: 1rem;
    }

    .input-group-text {
        background-color: #f8f9fa;
        border-color: #ced4da;
    }

    .btn-lg {
        padding: 0.75rem 1.5rem;
        font-size: 1rem;
    }

    .border-top {
        border-color: #e9ecef !important;
    }
    </style>
</head>

<body>
    <div class="wrapper">
        <?php include 'sidebar.php'; ?>
        <div class="main">
            <?php include 'navbar.php'; ?>

            <main class="content">
                <div class="container-fluid p-0">
                    <div class="row">
                        <div class="col-12">
                            <!-- Nav tabs -->
                            <ul class="nav nav-tabs nav-tabs-custom" id="settingsTabs" role="tablist">
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link active" id="pengaturan-tab" data-bs-toggle="tab" data-bs-target="#pengaturan" type="button" role="tab" aria-controls="pengaturan" aria-selected="true">
                                        <i class="fas fa-cogs me-2"></i>Pengaturan Ujian
                                    </button>
                                </li>
                                <li class="nav-item" role="presentation">
                                    <button class="nav-link" id="profil-tab" data-bs-toggle="tab" data-bs-target="#profil" type="button" role="tab" aria-controls="profil" aria-selected="false">
                                        <i class="fas fa-user-edit me-2"></i>Edit Profil
                                    </button>
                                </li>
                            </ul>

                            <!-- Tab content -->
                            <div class="tab-content tab-content-custom" id="settingsTabsContent">
                                <!-- Pengaturan Ujian Tab -->
                                <div class="tab-pane fade show active" id="pengaturan" role="tabpanel" aria-labelledby="pengaturan-tab">
                                    <?php
                                        $q = mysqli_query($koneksi, "SELECT * FROM pengaturan WHERE id = 1");
                                        $data = mysqli_fetch_assoc($q);
                                        ?>
                                    <form action="simpan_pengaturan.php" method="post" enctype="multipart/form-data">
                                        <div class="row g-4">
                                            <!-- Row 1: Logo dan Nama Aplikasi -->
                                            <div class="col-12">
                                                <div class="row g-4">
                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label for="nama_aplikasi" class="form-label fw-bold text-primary">
                                                                <i class="fas fa-tag me-2"></i>Nama Aplikasi
                                                            </label>
                                                            <input type="text" class="form-control form-control-lg"
                                                                name="nama_aplikasi" id="nama_aplikasi"
                                                                value="<?= $data['nama_aplikasi'] ?? '' ?>" required
                                                                placeholder="Masukkan nama aplikasi">
                                                            <small class="form-text text-muted">Nama yang akan ditampilkan di aplikasi</small>
                                                        </div>
                                                    </div>

                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label for="logo_sekolah" class="form-label fw-bold text-primary">
                                                                <i class="fas fa-image me-2"></i>Logo Sekolah
                                                            </label>
                                                            <?php if (!empty($data['logo_sekolah'])): ?>
                                                            <div class="mb-3 text-center">
                                                                <img id="preview-logo"
                                                                    src="../assets/images/<?= $data['logo_sekolah'] ?>" alt="Logo"
                                                                    class="img-thumbnail rounded shadow-sm" style="max-width: 120px; max-height: 120px;">
                                                            </div>
                                                            <?php endif; ?>
                                                            <input type="file" class="form-control form-control-lg"
                                                                name="logo_sekolah" id="logo_sekolah" accept="image/*">
                                                            <small class="form-text text-muted">Format: JPG, PNG, GIF, WEBP. Maksimal 2MB</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Row 2: Tema dan Sinkronisasi -->
                                            <div class="col-12">
                                                <div class="row g-4">
                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label for="warna_tema" class="form-label fw-bold text-primary">
                                                                <i class="fas fa-palette me-2"></i>Warna Tema Ujian Siswa
                                                            </label>

                                                            <!-- Color Palette -->
                                                            <div class="d-flex flex-wrap gap-2 mb-3" id="palette">
                                                                <?php
                                                                $warnaList = ['#0d6efd', '#198754', '#dc3545', '#ffc107', '#6f42c1', '#20c997', '#fd7e14', '#343a40'];
                                                                $warnaSekarang = $data['warna_tema'] ?? '#0d6efd';
                                                                foreach ($warnaList as $warna) {
                                                                    $selected = ($warnaSekarang === $warna) ? 'border-3 border-dark shadow' : 'border';
                                                                    echo "<div class='color-box $selected rounded-circle' data-warna='$warna' style='width: 40px; height: 40px; background: $warna; cursor: pointer; transition: all 0.2s ease;'></div>";
                                                                }
                                                                ?>
                                                            </div>

                                                            <!-- Color Picker -->
                                                            <input type="color" class="form-control form-control-color form-control-lg"
                                                                id="colorPicker" value="<?= $warnaSekarang ?>"
                                                                title="Pilih Warna Bebas">

                                                            <!-- Hidden Input -->
                                                            <input type="hidden" name="warna_tema" id="warna_tema"
                                                                value="<?= $warnaSekarang ?>">

                                                            <small class="form-text text-muted">Pilih warna preset di atas atau kostum warna di bawah</small>
                                                        </div>
                                                    </div>

                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label for="waktu_sinkronisasi" class="form-label fw-bold text-primary">
                                                                <i class="fas fa-clock me-2"></i>Waktu Sinkronisasi Ujian
                                                            </label>
                                                            <div class="input-group">
                                                                <input type="number" class="form-control form-control-lg"
                                                                    name="waktu_sinkronisasi" id="waktu_sinkronisasi"
                                                                    value="<?= $data['waktu_sinkronisasi'] ?? 60 ?>" min="10" required>
                                                                <span class="input-group-text">detik</span>
                                                            </div>
                                                            <small class="form-text text-muted">Interval penyimpanan otomatis jawaban siswa</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            <!-- Row 3: Login Ganda dan Sembunyikan Nilai -->
                                            <div class="col-12">
                                                <div class="row g-4">
                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label for="login_ganda" class="form-label fw-bold text-primary">
                                                                <i class="fas fa-users me-2"></i>Status Login Ganda
                                                            </label>
                                                            <select class="form-select form-select-lg" name="login_ganda" id="login_ganda" required>
                                                                <option value="izinkan" <?= $data['login_ganda'] === 'izinkan' ? 'selected' : '' ?>>
                                                                    <i class="fas fa-check text-success me-2"></i>Izinkan
                                                                </option>
                                                                <option value="blokir" <?= $data['login_ganda'] === 'blokir' ? 'selected' : '' ?>>
                                                                    <i class="fas fa-ban text-danger me-2"></i>Blokir
                                                                </option>
                                                            </select>
                                                            <small class="form-text text-muted">Apakah siswa boleh login dari beberapa perangkat?</small>
                                                        </div>
                                                    </div>

                                                    <div class="col-12 col-md-6">
                                                        <div class="form-group">
                                                            <label class="form-label fw-bold text-primary">
                                                                <i class="fas fa-eye-slash me-2"></i>Privasi Nilai Siswa
                                                            </label>
                                                            <div class="form-check form-switch">
                                                                <input type="checkbox" class="form-check-input"
                                                                    name="sembunyikan_nilai" id="sembunyikan_nilai" value="1"
                                                                    <?= !empty($data['sembunyikan_nilai']) ? 'checked' : '' ?>>
                                                                <label class="form-check-label" for="sembunyikan_nilai">
                                                                    Sembunyikan nilai siswa di dashboard
                                                                </label>
                                                            </div>
                                                            <small class="form-text text-muted">Siswa tidak dapat melihat nilai ujian mereka</small>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                   <div class="d-flex flex-wrap justify-content-start gap-3 mt-5 pt-4 border-top">
                                       <button type="submit" class="btn btn-primary btn-lg px-4">
                                           <i class="fas fa-save me-2"></i>Simpan Pengaturan
                                       </button>
                                   </div>
                               </div>

                               <!-- Edit Profil Tab -->
                               <div class="tab-pane fade" id="profil" role="tabpanel" aria-labelledby="profil-tab">
                                   <form action="simpan_profil.php" method="post">
                                       <div class="row g-4">
                                           <div class="col-12 col-md-6">
                                               <div class="form-group">
                                                   <label for="nama_admin" class="form-label fw-bold text-primary">
                                                       <i class="fas fa-user me-2"></i>Nama Lengkap
                                                   </label>
                                                   <input type="text" class="form-control form-control-lg"
                                                       name="nama_admin" id="nama_admin"
                                                       value="<?= $nama_admin ?>" required
                                                       placeholder="Masukkan nama lengkap">
                                                   <small class="form-text text-muted">Nama yang akan ditampilkan di sistem</small>
                                               </div>
                                           </div>

                                           <div class="col-12 col-md-6">
                                               <div class="form-group">
                                                   <label for="username" class="form-label fw-bold text-primary">
                                                       <i class="fas fa-at me-2"></i>Username
                                                   </label>
                                                   <input type="text" class="form-control form-control-lg"
                                                       name="username" id="username"
                                                       value="<?= htmlspecialchars($username ?? '') ?>" required
                                                       placeholder="Masukkan username">
                                                   <small class="form-text text-muted">Username untuk login ke sistem</small>
                                               </div>
                                           </div>

                                           <div class="col-12 col-md-6">
                                               <div class="form-group">
                                                   <label for="password_lama" class="form-label fw-bold text-primary">
                                                       <i class="fas fa-lock me-2"></i>Password Lama
                                                   </label>
                                                   <input type="password" class="form-control form-control-lg"
                                                       name="password_lama" id="password_lama"
                                                       placeholder="Masukkan password lama">
                                                   <small class="form-text text-muted">Kosongkan jika tidak ingin mengubah password</small>
                                               </div>
                                           </div>

                                           <div class="col-12 col-md-6">
                                               <div class="form-group">
                                                   <label for="password_baru" class="form-label fw-bold text-primary">
                                                       <i class="fas fa-key me-2"></i>Password Baru
                                                   </label>
                                                   <input type="password" class="form-control form-control-lg"
                                                       name="password_baru" id="password_baru"
                                                       placeholder="Masukkan password baru">
                                                   <small class="form-text text-muted">Minimal 6 karakter</small>
                                               </div>
                                           </div>

                                           <div class="col-12 col-md-6">
                                               <div class="form-group">
                                                   <label for="konfirmasi_password" class="form-label fw-bold text-primary">
                                                       <i class="fas fa-check-circle me-2"></i>Konfirmasi Password Baru
                                                   </label>
                                                   <input type="password" class="form-control form-control-lg"
                                                       name="konfirmasi_password" id="konfirmasi_password"
                                                       placeholder="Konfirmasi password baru">
                                                   <small class="form-text text-muted">Ulangi password baru</small>
                                               </div>
                                           </div>
                                       </div>

                                       <div class="d-flex flex-wrap justify-content-start gap-3 mt-5 pt-4 border-top">
                                           <button type="submit" class="btn btn-success btn-lg px-4">
                                               <i class="fas fa-user-edit me-2"></i>Update Profil
                                           </button>
                                       </div>
                                   </form>
                               </div>
                           </div>
                       </div>
                   </div>
               </div>
           </main>
       </div>
   </div>
    <?php include '../inc/js.php'; ?>
    <script>
    document.getElementById('logo_sekolah').addEventListener('change', function(e) {
        const file = e.target.files[0];
        const preview = document.getElementById('preview-logo');
        const maxSize = 2 * 1024 * 1024; // 2MB
        const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];

        if (!file) return;

        if (!validTypes.includes(file.type)) {
            Swal.fire({
                icon: 'error',
                title: 'Format Tidak Valid',
                text: 'Hanya gambar JPG, PNG, GIF, atau WEBP yang diperbolehkan.'
            });
            this.value = '';
            preview.src = '../assets/images/<?= $data['logo_sekolah'] ?>';
            return;
        }

        if (file.size > maxSize) {
            Swal.fire({
                icon: 'warning',
                title: 'Ukuran Terlalu Besar',
                text: 'Ukuran file maksimal 2MB.'
            });
            this.value = '';
            preview.src = '../assets/images/<?= $data['logo_sekolah'] ?>';
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            preview.src = e.target.result;
        };
        reader.readAsDataURL(file);
    });
    </script>
    <?php if (isset($_SESSION['success'])): ?>
    <script>
    Swal.fire({
        icon: 'success',
        title: 'Berhasil!',
        text: '<?= $_SESSION['success']; ?>',
        confirmButtonColor: '#28a745'
    });
    </script>
    <?php unset($_SESSION['success']); endif; ?>

    <?php if (isset($_SESSION['error'])): ?>
    <script>
    Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: '<?= $_SESSION['error']; ?>',
        confirmButtonColor: '#dc3545'
    });
    </script>
    <?php unset($_SESSION['error']); endif; ?>
    <script>
    </script>
    <script>
    document.querySelectorAll('.color-box').forEach(box => {
        box.addEventListener('click', function() {
            // Reset semua box
            document.querySelectorAll('.color-box').forEach(b => {
                b.classList.remove('border-3', 'border-dark');
                b.classList.add('border');
            });
            // Tandai yang terpilih
            this.classList.remove('border');
            this.classList.add('border-3', 'border-dark');

            // Set nilai input tersembunyi dan picker
            const warna = this.dataset.warna;
            document.getElementById('warna_tema').value = warna;
            document.getElementById('colorPicker').value = warna;
        });
    });

    // Jika user pilih warna bebas di color picker
    document.getElementById('colorPicker').addEventListener('input', function() {
        const warna = this.value;
        document.getElementById('warna_tema').value = warna;

        // Reset semua box, karena warna bebas
        document.querySelectorAll('.color-box').forEach(b => {
            b.classList.remove('border-3', 'border-dark');
            b.classList.add('border');
        });
    });
    

    </script>
</body>

</html>
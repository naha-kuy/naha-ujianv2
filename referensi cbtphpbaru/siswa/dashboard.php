<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
check_login('siswa');
include '../inc/datasiswa.php';

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>Dashboard Siswa</title>
    <?php include '../inc/css.php'; ?>

    <style>
        .welcome-section {
            background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
            color: white;
            border-radius: 15px;
            padding: 2rem;
            margin-bottom: 2rem;
            position: relative;
            overflow: hidden;
        }

        .welcome-section::before {
            content: '';
            position: absolute;
            top: -50%;
            right: -50%;
            width: 200%;
            height: 200%;
            background: radial-gradient(circle, rgba(255,255,255,0.1) 0%, transparent 70%);
            animation: float 6s ease-in-out infinite;
        }

        @keyframes float {
            0%, 100% { transform: translate(-50%, -50%) rotate(0deg); }
            50% { transform: translate(-50%, -50%) rotate(180deg); }
        }

        .feature-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: none;
            height: 220px;
            position: relative;
            overflow: hidden;
        }

        .feature-card:hover {
            transform: translateY(-8px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }

        .feature-card::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 4px;
            background: linear-gradient(90deg, var(--card-color) 0%, var(--card-color-dark) 100%);
        }

        .feature-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 1rem;
            font-size: 1.5rem;
            color: white;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
        }


        @media (max-width: 768px) {
            .feature-card {
                height: auto;
                margin-bottom: 1rem;
            }
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


                    <!-- Feature Cards -->
                    <div class="row g-4 justify-content-center px-3">
                        <div class="col-12 col-sm-6 col-md-4">
                            <a href="ujian.php" class="text-decoration-none">
                                <div class="feature-card" style="--card-color: #007bff; --card-color-dark: #0056b3;">
                                    <div class="card-body text-center d-flex flex-column justify-content-center h-100">
                                        <div class="feature-icon" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
                                            <i class="fas fa-pen"></i>
                                        </div>
                                        <h5 class="card-title fw-bold mb-3">Kerjakan Ujian</h5>
                                        <p class="text-muted small mb-3">Akses ujian aktif dan mulai sekarang</p>
                                        <span class="badge bg-primary">Mulai Ujian</span>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <div class="col-12 col-sm-6 col-md-4">
                            <a href="hasil.php" class="text-decoration-none">
                                <div class="feature-card" style="--card-color: #28a745; --card-color-dark: #1e7e34;">
                                    <div class="card-body text-center d-flex flex-column justify-content-center h-100">
                                        <div class="feature-icon" style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);">
                                            <i class="fas fa-chart-line"></i>
                                        </div>
                                        <h5 class="card-title fw-bold mb-3">Hasil Ujian</h5>
                                        <p class="text-muted small mb-3">Lihat nilai dari ujian yang sudah dikerjakan</p>
                                        <span class="badge bg-success">Lihat Nilai</span>
                                    </div>
                                </div>
                            </a>
                        </div>

                        <div class="col-12 col-sm-6 col-md-4">
                            <a href="perangkat.php" class="text-decoration-none">
                                <div class="feature-card" style="--card-color: #17a2b8; --card-color-dark: #117a8b;">
                                    <div class="card-body text-center d-flex flex-column justify-content-center h-100">
                                        <div class="feature-icon" style="background: linear-gradient(135deg, #17a2b8 0%, #117a8b 100%);">
                                            <i class="fas fa-laptop"></i>
                                        </div>
                                        <h5 class="card-title fw-bold mb-3">Status Perangkat</h5>
                                        <p class="text-muted small mb-3">Lihat status perangkat Anda</p>
                                        <span class="badge bg-info">Cek Status</span>
                                    </div>
                                </div>
                            </a>
                        </div>
                    </div>
                    </div>
                </div>
            </main>
        </div>
    </div>

    <?php include '../inc/js.php'; ?>
    <?php include '../inc/check_activity.php'; ?>

    <?php if (isset($_SESSION['error'])): ?>
    <script>
    Swal.fire({
        icon: 'error',
        title: 'Gagal!',
        text: '<?= $_SESSION['error']; ?>',
        confirmButtonColor: '#dc3545'
    });
    <?php unset($_SESSION['error']); endif; ?>
    </script>
</body>

</html>
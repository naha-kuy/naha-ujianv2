<?php
session_start();
include_once __DIR__ . '/../koneksi/koneksi.php';
include_once __DIR__ . '/../inc/functions.php';
// Cek jika sudah login
check_login('admin');
include '../inc/dataadmin.php';

// Ambil data statistik dari database
$total_siswa = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT COUNT(*) AS total FROM siswa"))['total'];
$total_soal = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT COUNT(*) AS total FROM soal"))['total'];
$total_ujian = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT COUNT(*) AS total FROM nilai"))['total'];

// Ambil data jumlah siswa ikut ujian per bulan
$rekap_query = mysqli_query($koneksi, "
    SELECT DATE_FORMAT(tanggal_ujian, '%Y-%m') AS bulan, COUNT(*) AS jumlah 
    FROM nilai 
    GROUP BY bulan 
    ORDER BY bulan ASC
");

$rekap_data = [];
while ($row = mysqli_fetch_assoc($rekap_query)) {
    $rekap_data['labels'][] = date('M Y', strtotime($row['bulan'] . '-01'));
    $rekap_data['jumlah'][] = $row['jumlah'];
}
// Ambil 10 kode soal dengan rata-rata tertinggi
$kode_soal_query = mysqli_query($koneksi, "
    SELECT kode_soal, ROUND(AVG(nilai + IFNULL(nilai_uraian, 0)), 2) AS rata_rata 
    FROM nilai 
    GROUP BY kode_soal 
    ORDER BY rata_rata DESC 
    LIMIT 10
");

$kode_soal_data = ['labels' => [], 'rata' => []];
while ($row = mysqli_fetch_assoc($kode_soal_query)) {
    $kode_soal_data['labels'][] = $row['kode_soal'];
    $kode_soal_data['rata'][] = $row['rata_rata'];
}

// Ambil 10 siswa dengan rata-rata nilai akhir tertinggi
$top_siswa_query = mysqli_query($koneksi, "
    SELECT siswa.nama_siswa AS nama, 
           COUNT(*) AS jumlah_ujian,
           ROUND(AVG(nilai + IFNULL(nilai_uraian, 0)), 2) AS rata 
    FROM nilai 
    JOIN siswa ON nilai.id_siswa = siswa.id_siswa 
    GROUP BY nilai.id_siswa 
    ORDER BY rata DESC 
    LIMIT 10
") or die("Query error: " . mysqli_error($koneksi));

$top_siswa_data = ['labels' => [], 'rata' => [], 'ujian' => []];
while ($row = mysqli_fetch_assoc($top_siswa_query)) {
    $top_siswa_data['labels'][] = $row['nama'];
    $top_siswa_data['rata'][] = $row['rata'];
    $top_siswa_data['ujian'][] = $row['jumlah_ujian'];
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Admin Dashboard</title>
    <?php include '../inc/css.php'; ?>
    <style>
        .welcome-section {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

        .stats-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            transition: all 0.3s ease;
            border: none;
            height: 180px;
            position: relative;
            overflow: hidden;
        }

        .stats-card:hover {
            transform: translateY(-5px);
            box-shadow: 0 15px 35px rgba(0,0,0,0.15);
        }

        .stats-icon {
            position: absolute;
            right: -20px;
            bottom: -20px;
            font-size: 80px;
            opacity: 0.1;
            color: var(--icon-color);
        }

        .chart-card {
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            border: none;
            transition: all 0.3s ease;
        }

        .chart-card:hover {
            transform: translateY(-3px);
            box-shadow: 0 12px 30px rgba(0,0,0,0.12);
        }

        .quick-actions {
            background: white;
            border-radius: 15px;
            box-shadow: 0 8px 25px rgba(0,0,0,0.1);
            padding: 1.5rem;
            margin-bottom: 2rem;
        }

        .action-btn {
            border-radius: 10px;
            padding: 0.75rem 1.5rem;
            font-weight: 500;
            transition: all 0.3s ease;
            border: none;
        }

        .action-btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 5px 15px rgba(0,0,0,0.2);
        }

        @media (max-width: 768px) {
            .welcome-section {
                padding: 1.5rem;
                text-align: center;
            }

            .stats-card {
                height: auto;
                margin-bottom: 1rem;
            }

            .chart-card {
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

                    <!-- Quick Actions -->
                    <div class="quick-actions">
                        <h5 class="mb-3"><i class="fas fa-bolt me-2"></i>Aksi Cepat</h5>
                        <div class="row g-2">
                            <div class="col-auto">
                                <a href="tambah_siswa.php" class="btn action-btn btn-primary">
                                    <i class="fas fa-user-plus me-2"></i>Tambah Siswa
                                </a>
                            </div>
                            <div class="col-auto">
                                <a href="tambah_soal.php" class="btn action-btn btn-success">
                                    <i class="fas fa-plus-circle me-2"></i>Buat Soal
                                </a>
                            </div>
                            <div class="col-auto">
                                <a href="monitor.php" class="btn action-btn btn-warning">
                                    <i class="fas fa-desktop me-2"></i>Monitor Ujian
                                </a>
                            </div>
                            <div class="col-auto">
                                <a href="hasil.php" class="btn action-btn btn-info">
                                    <i class="fas fa-chart-line me-2"></i>Lihat Hasil
                                </a>
                            </div>
                            <div class="col-auto">
                                <a href="setting.php" class="btn action-btn btn-secondary">
                                    <i class="fas fa-cogs me-2"></i>Pengaturan
                                </a>
                            </div>
                        </div>
                    </div>

                    <div class="row">
                        <div class="col-12">
                            <div class="row px-3">
                                        


                                        <!-- Statistik Cards -->
                                        <div class="col-xl-4 col-md-6 mb-4">
                                            <div class="stats-card" style="--icon-color: #007bff;">
                                                <div class="card-body d-flex align-items-center h-100">
                                                    <div class="flex-grow-1">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-users fa-2x text-primary me-3"></i>
                                                            <div>
                                                                <h3 class="mb-0 fw-bold text-primary"><?php echo number_format($total_siswa); ?></h3>
                                                                <small class="text-muted">Total Siswa</small>
                                                            </div>
                                                        </div>
                                                        <p class="text-muted small mb-3">Siswa terdaftar dalam sistem</p>
                                                        <a href="siswa.php" class="btn btn-sm btn-outline-primary">
                                                            <i class="fas fa-eye me-1"></i>Kelola Siswa
                                                        </a>
                                                    </div>
                                                </div>
                                                <i class="fas fa-users stats-icon"></i>
                                            </div>
                                        </div>

                                        <div class="col-xl-4 col-md-6 mb-4">
                                            <div class="stats-card" style="--icon-color: #28a745;">
                                                <div class="card-body d-flex align-items-center h-100">
                                                    <div class="flex-grow-1">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-book fa-2x text-success me-3"></i>
                                                            <div>
                                                                <h3 class="mb-0 fw-bold text-success"><?php echo number_format($total_soal); ?></h3>
                                                                <small class="text-muted">Total Soal</small>
                                                            </div>
                                                        </div>
                                                        <p class="text-muted small mb-3">Bank soal yang tersedia</p>
                                                        <a href="soal.php" class="btn btn-sm btn-outline-success">
                                                            <i class="fas fa-eye me-1"></i>Kelola Soal
                                                        </a>
                                                    </div>
                                                </div>
                                                <i class="fas fa-book stats-icon"></i>
                                            </div>
                                        </div>

                                        <div class="col-xl-4 col-md-6 mb-4">
                                            <div class="stats-card" style="--icon-color: #ffc107;">
                                                <div class="card-body d-flex align-items-center h-100">
                                                    <div class="flex-grow-1">
                                                        <div class="d-flex align-items-center mb-2">
                                                            <i class="fas fa-clipboard-check fa-2x text-warning me-3"></i>
                                                            <div>
                                                                <h3 class="mb-0 fw-bold text-warning"><?php echo number_format($total_ujian); ?></h3>
                                                                <small class="text-muted">Ujian Selesai</small>
                                                            </div>
                                                        </div>
                                                        <p class="text-muted small mb-3">Siswa telah menyelesaikan ujian</p>
                                                        <a href="hasil.php" class="btn btn-sm btn-outline-warning">
                                                            <i class="fas fa-chart-line me-1"></i>Lihat Hasil
                                                        </a>
                                                    </div>
                                                </div>
                                                <i class="fas fa-clipboard-check stats-icon"></i>
                                            </div>
                                        </div>
                                        
                                        <!-- Charts Section -->
                                        <div class="col-xl-4 col-lg-6 mb-4">
                                            <div class="chart-card">
                                                <div class="card-header bg-primary text-white">
                                                    <h6 class="card-title mb-0">
                                                        <i class="fas fa-trophy me-2"></i>Top 10 Siswa
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <canvas id="chartTopSiswa" style="height: 300px; width: 100%;"></canvas>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-xl-4 col-lg-6 mb-4">
                                            <div class="chart-card">
                                                <div class="card-header bg-success text-white">
                                                    <h6 class="card-title mb-0">
                                                        <i class="fas fa-chart-line me-2"></i>Rekap Ujian
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <canvas id="chartRekapUjian" style="height: 300px; width: 100%;"></canvas>
                                                </div>
                                            </div>
                                        </div>

                                        <div class="col-xl-4 col-lg-6 mb-4">
                                            <div class="chart-card">
                                                <div class="card-header bg-info text-white">
                                                    <h6 class="card-title mb-0">
                                                        <i class="fas fa-chart-bar me-2"></i>Statistik Nilai
                                                    </h6>
                                                </div>
                                                <div class="card-body">
                                                    <canvas id="chartKodeSoal" style="height: 300px; width: 100%;"></canvas>
                                                </div>
                                            </div>
                                        </div>


                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
            </main>
        </div>
    </div>
    
    <?php include '../inc/js.php'; ?>
    <script src="../assets/js/chart.js"></script>
    <script>
    const ctx = document.getElementById('chartRekapUjian').getContext('2d');
    const chartRekapUjian = new Chart(ctx, {
        type: 'line',
        data: {
            labels: <?php echo json_encode($rekap_data['labels']); ?>,
            datasets: [{
                label: 'Jumlah Siswa',
                data: <?php echo json_encode($rekap_data['jumlah']); ?>,
                fill: false,
                borderColor: 'rgba(75, 192, 192, 1)',
                backgroundColor: 'rgba(75, 192, 192, 0.2)',
                tension: 0.4, // Semakin tinggi nilainya (0–1), semakin bergelombang
                pointRadius: 5,
                pointHoverRadius: 7
            }]
        },
        options: {
            responsive: true,
            animation: {
                duration: 2000,
                easing: 'easeInOutQuart' // efek animasi gelombang halus
            },
            scales: {
                y: {
                    beginAtZero: true,
                    precision: 0
                }
            }
        }
    });
    // Grafik Statistik Nilai per Kode Soal
    const ctxKode = document.getElementById('chartKodeSoal').getContext('2d');

    // Buat gradient linear (dari kiri ke kanan)
    const gradientBlue = ctxKode.createLinearGradient(0, 0, 400, 0);
    gradientBlue.addColorStop(0, 'rgba(255, 0, 200, 0.6)');
    gradientBlue.addColorStop(1, 'rgba(0, 200, 255, 0.9)');
    const chartKodeSoal = new Chart(ctxKode, {
        type: 'bar',
        data: {
            labels: <?php echo json_encode($kode_soal_data['labels']); ?>,
            datasets: [{
                label: 'Rata-rata Nilai',
                data: <?php echo json_encode($kode_soal_data['rata']); ?>,
                backgroundColor: gradientBlue,
                borderWidth: 0,
                borderRadius: 0, // lebih bulat ujung bar
                barThickness: 5 // bar tipis
            }]
        },
        options: {
            indexAxis: 'y', // horizontal
            responsive: true,
            animation: {
                duration: 1200,
                easing: 'easeOutCubic' // animasi smooth modern
            },
            scales: {
                x: {
                    beginAtZero: true,
                    max: 100,
                    ticks: {
                        stepSize: 10
                    },
                    grid: {
                        drawBorder: false,
                        color: 'rgba(0,0,0,0.05)' // grid halus
                    }
                },
                y: {
                    ticks: {
                        autoSkip: false
                    },
                    grid: {
                        display: false // hilangkan garis grid Y
                    }
                }
            },
            plugins: {
                legend: {
                    display: false // buang legend supaya clean
                }
            }
        }
    });

    // Grafik 10 Siswa dengan Rata-rata Nilai Tertinggi
    // Grafik 10 Siswa dengan Rata-rata Nilai Tertinggi (Doughnut Chart)
    const ctxTop = document.getElementById('chartTopSiswa').getContext('2d');
    const chartTopSiswa = new Chart(ctxTop, {
        type: 'doughnut',
        data: {
            labels: <?php echo json_encode($top_siswa_data['labels']); ?>,
            datasets: [{
                label: 'Rata-rata Nilai',
                data: <?php echo json_encode($top_siswa_data['rata']); ?>,
                backgroundColor: [
                    '#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0',
                    '#9966FF', '#FF9F40', '#00C49F', '#FF6666',
                    '#6699FF', '#FFCC99'
                ],
                borderWidth: 1
            }]
        },
        options: {
            responsive: true,
            plugins: {
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const index = context.dataIndex;
                            const nama = context.label;
                            const nilai = context.dataset.data[index];
                            const jumlahUjian = <?php echo json_encode($top_siswa_data['ujian']); ?>[index];
                            return `${nama}: ${nilai} (Ujian: ${jumlahUjian}x)`;
                        }
                    }
                },
                legend: {
                    position: 'bottom'
                },
                title: {
                    display: true,
                    text: 'Top 10 Siswa (Rata-rata Nilai)'
                }
            },
            animation: {
                animateRotate: true,
                duration: 1500
            }
        }
    });
    </script>
</body>

</html>
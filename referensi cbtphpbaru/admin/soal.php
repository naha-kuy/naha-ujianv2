<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
check_login('admin');
include '../inc/dataadmin.php';
$query = "
    SELECT 
        s.id_soal, s.kode_soal, s.nama_soal, s.mapel, s.kelas, s.tampilan_soal, s.status, s.tanggal, s.waktu_ujian, s.token,
        COUNT(b.id_soal) AS jumlah_butir
    FROM soal s
    LEFT JOIN butir_soal b ON s.kode_soal = b.kode_soal
    GROUP BY s.id_soal, s.kode_soal, s.nama_soal, s.mapel, s.kelas, s.status,  s.tanggal, s.waktu_ujian, s.token
";

$result = mysqli_query($koneksi, $query);

// Check if the query was successful
if (!$result) {
    // If there's an error with the query, display the error message
    die('Error with the query: ' . mysqli_error($koneksi));
}
?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bank Soal</title>
    <?php include '../inc/css.php'; ?>
    <style>
    .table-wrapper {
        overflow-x: auto;
        -webkit-overflow-scrolling: touch;
        border-radius: 0.5rem;
        box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    }

    table th,
    table td {
        text-align: left !important;
        vertical-align: middle !important;
        padding: 0.75rem 1rem !important;
    }

    .table thead th {
        background-color: white;
        border-bottom: 2px solid #dee2e6;
        font-weight: 600;
        font-size: 0.875rem;
        text-transform: uppercase;
        letter-spacing: 0.5px;
        color: #495057;
    }

    .table tbody tr:hover {
        background-color: white;
    }

    .btn-group-action {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
        justify-content: flex-start;
    }

    .btn-group-action .btn {
        margin: 0;
        border-radius: 0.375rem !important;
    }

    .status-badge {
        font-size: 0.875rem;
        padding: 0.5rem 1rem;
        border-radius: 1rem;
        font-weight: 600;
        min-width: 80px;
        display: inline-block;
        text-align: center;
    }

    .info-cell {
        display: flex;
        align-items: center;
        gap: 0.5rem;
    }

    .info-cell i {
        color: #6c757d;
        width: 16px;
    }

    .card-header-custom {
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border-radius: 0.5rem 0.5rem 0 0 !important;
        padding: 1.5rem;
        border-bottom: none;
    }

    .card-header-custom h5 {
        margin: 0;
        font-weight: 600;
        font-size: 1.25rem;
    }

    .stats-summary {
        background: #f8f9fa;
        border-radius: 0.5rem;
        padding: 1rem;
        margin-bottom: 1.5rem;
        border: 1px solid #dee2e6;
    }

    .stats-grid {
        display: grid;
        grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
        gap: 1rem;
    }

    .stat-item {
        text-align: center;
        padding: 1rem;
        background: white;
        border-radius: 0.5rem;
        border: 1px solid #e9ecef;
    }

    .stat-number {
        font-size: 2rem;
        font-weight: bold;
        color: #495057;
        margin-bottom: 0.25rem;
    }

    .stat-label {
        font-size: 0.875rem;
        color: #6c757d;
        text-transform: uppercase;
        letter-spacing: 0.5px;
    }

    .action-buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 0.5rem;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1.5rem;
        padding: 1rem;
        background: #f8f9fa;
        border-radius: 0.5rem;
        border: 1px solid #dee2e6;
    }

    .btn-add-new {
        background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
        border: none;
        color: white;
        padding: 0.75rem 1.5rem;
        border-radius: 0.5rem;
        font-weight: 500;
        transition: all 0.3s ease;
    }

    .btn-add-new:hover {
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(40, 167, 69, 0.3);
        color: white;
    }

    /* DataTables Custom Layout */
    .dataTables_wrapper .row {
        margin: 0;
    }

    .dataTables_wrapper .col-md-6 {
        padding: 0;
    }

    .dataTables_info {
        text-align: left !important;
        padding-left: 0;
        font-weight: 500;
        color: #495057;
    }

    .dataTables_paginate {
        text-align: right !important;
        padding-right: 0;
    }

    .dataTables_paginate .paginate_button {
        padding: 0.375rem 0.75rem;
        margin: 0 0.125rem;
        border-radius: 0.375rem;
        border: 1px solid #dee2e6;
        background: white;
        color: #495057;
        transition: all 0.2s ease;
    }

    .dataTables_paginate .paginate_button:hover {
        background: #f8f9fa;
        border-color: #adb5bd;
    }

    .dataTables_paginate .paginate_button.current {
        background: #0d6efd;
        border-color: #0d6efd;
        color: white;
    }

    @media (max-width: 768px) {
        .action-buttons {
            flex-direction: column;
            align-items: stretch;
        }

        .stats-grid {
            grid-template-columns: 1fr;
        }

        .btn-group-action {
            justify-content: center;
        }

        .table-wrapper {
            font-size: 0.875rem;
        }

        table th,
        table td {
            padding: 0.5rem !important;
        }

        .dataTables_info,
        .dataTables_paginate {
            text-align: center !important;
            margin-top: 1rem;
        }

        .dataTables_wrapper .row.mt-3 .col-md-6:first-child {
            order: 2;
        }

        .dataTables_wrapper .row.mt-3 .col-md-6:last-child {
            order: 1;
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
                    <div class="row">
                        <div class="col-12">
                            <div class="card shadow-sm">
                                <div class="card-header card-header-custom">
                                    <h5><i class="fas fa-book me-2"></i>Bank Soal CBT</h5>
                                </div>
                                <div class="card-body">
                                    <!-- Stats Summary -->
                                    <div class="stats-summary">
                                        <div class="stats-grid">
                                            <?php
                                            // Get total soal
                                            $total_soal = mysqli_num_rows($result);
                                            mysqli_data_seek($result, 0); // Reset pointer

                                            // Get active soal
                                            $active_query = "SELECT COUNT(*) as active FROM soal WHERE status = 'Aktif'";
                                            $active_result = mysqli_query($koneksi, $active_query);
                                            $active_count = mysqli_fetch_assoc($active_result)['active'];

                                            // Get total questions
                                            $questions_query = "SELECT COUNT(*) as questions FROM butir_soal";
                                            $questions_result = mysqli_query($koneksi, $questions_query);
                                            $total_questions = mysqli_fetch_assoc($questions_result)['questions'];
                                            ?>
                                            <div class="stat-item">
                                                <div class="stat-number"><?php echo $total_soal; ?></div>
                                                <div class="stat-label">Total Soal</div>
                                            </div>
                                            <div class="stat-item">
                                                <div class="stat-number"><?php echo $active_count; ?></div>
                                                <div class="stat-label">Soal Aktif</div>
                                            </div>
                                            <div class="stat-item">
                                                <div class="stat-number"><?php echo $total_questions; ?></div>
                                                <div class="stat-label">Total Butir Soal</div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Action Buttons -->
                                    <div class="action-buttons">
                                        <div class="d-flex align-items-center">
                                            <i class="fas fa-plus-circle text-success me-2 fs-5"></i>
                                            <span class="fw-bold text-success">Kelola Soal</span>
                                        </div>
                                        <a href="tambah_soal.php" class="btn btn-add-new">
                                            <i class="fas fa-plus me-2"></i>Tambah Soal Baru
                                        </a>
                                    </div>

                                    <div class="table-wrapper">
                                    <table id="soalTable" class="table table-striped table-hover">
                                        <thead>
                                            <tr>
                                                <th style="width: 50px;">#</th>
                                                <th style="min-width: 120px;">Kode Soal</th>
                                                <th style="min-width: 150px;">Mata Pelajaran</th>
                                                <th style="width: 80px;">Kelas</th>
                                                <th style="width: 80px;">Jumlah</th>
                                                <th style="width: 100px;">Durasi</th>
                                                <th style="min-width: 100px;">Tanggal</th>
                                                <th style="width: 90px;">Tampilan</th>
                                                <th style="width: 90px;">Status</th>
                                                <th style="min-width: 100px;">Token</th>
                                                <th style="min-width: 120px;">Kelola</th>
                                                <th style="min-width: 200px;">Aksi</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            <?php $no = 1; while ($row = mysqli_fetch_assoc($result)) { ?>
                                            <tr>
                                                <td>
                                                    <span class="badge bg-light text-dark fw-bold"><?php echo $no++; ?></span>
                                                </td>
                                                <td>
                                                    <div class="fw-bold text-primary"><?php echo htmlspecialchars($row['kode_soal']); ?></div>
                                                    <small class="text-muted"><?php echo htmlspecialchars($row['nama_soal']); ?></small>
                                                </td>
                                                <td><?php echo htmlspecialchars($row['mapel']); ?></td>
                                                <td>
                                                    <span class="badge bg-info"><?php echo htmlspecialchars($row['kelas']); ?></span>
                                                </td>
                                                <td>
                                                    <span class="badge bg-secondary"><?php echo $row['jumlah_butir']; ?> soal</span>
                                                </td>
                                                <td>
                                                    <div class="info-cell">
                                                        <i class="fas fa-clock"></i>
                                                        <span><?php echo $row['waktu_ujian']; ?>m</span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="info-cell">
                                                        <i class="fas fa-calendar"></i>
                                                        <span><?php echo date('d M Y', strtotime($row['tanggal'])); ?></span>
                                                    </div>
                                                </td>
                                                <td>
                                                    <span class="badge <?php echo $row['tampilan_soal'] == 'Acak' ? 'bg-warning' : 'bg-primary'; ?>">
                                                        <?php echo $row['tampilan_soal']; ?>
                                                    </span>
                                                </td>
                                                <td>
                                                    <?php if ($row['status'] == 'Aktif') { ?>
                                                    <span class="status-badge bg-success text-white">
                                                        <i class="fas fa-check-circle me-1"></i>Aktif
                                                    </span>
                                                    <?php } else { ?>
                                                    <span class="status-badge bg-danger text-white">
                                                        <i class="fas fa-times-circle me-1"></i>Nonaktif
                                                    </span>
                                                    <?php } ?>
                                                </td>
                                                <td>
                                                    <code class="text-muted small"><?php echo htmlspecialchars($row['token']); ?></code>
                                                </td>
                                                <td>
                                                    <div class="btn-group-action">
                                                        <?php if ($row['status'] == 'Aktif') { ?>
                                                        <a href="generate_token.php?id_soal=<?php echo $row['id_soal']; ?>"
                                                            class="btn btn-sm btn-outline-primary" title="Generate Token Baru">
                                                            <i class="fa fa-history"></i>
                                                        </a>
                                                        <a href="ubah_status_soal.php?id_soal=<?= $row['id_soal']; ?>&aksi=nonaktif"
                                                            class="btn btn-sm btn-warning" title="Nonaktifkan Soal">
                                                            <i class="fa fa-toggle-off"></i>
                                                        </a>
                                                        <?php } else { ?>
                                                        <a href="ubah_status_soal.php?id_soal=<?= $row['id_soal']; ?>&aksi=aktif"
                                                            class="btn btn-sm btn-success" title="Aktifkan Soal">
                                                            <i class="fa fa-toggle-on"></i>
                                                        </a>
                                                        <?php } ?>
                                                    </div>
                                                </td>
                                                <td>
                                                    <div class="btn-group-action">
                                                        <a href="preview_soal.php?kode_soal=<?php echo $row['kode_soal']; ?>"
                                                            class="btn btn-sm btn-outline-info" title="Preview Soal">
                                                            <i class="fa fa-eye"></i>
                                                        </a>
                                                        <a href="edit_soal.php?id_soal=<?php echo $row['id_soal']; ?>"
                                                            class="btn btn-sm btn-primary" title="Edit Soal">
                                                            <i class="fa fa-edit"></i>
                                                        </a>
                                                        <a href="#" class="btn btn-sm btn-info btn-duplicate"
                                                            data-kode="<?php echo $row['kode_soal']; ?>" title="Duplikat Soal">
                                                            <i class="fa fa-copy"></i>
                                                        </a>
                                                        <a href="daftar_butir_soal.php?kode_soal=<?php echo $row['kode_soal']; ?>"
                                                            class="btn btn-sm btn-success" title="Input Butir Soal">
                                                            <i class="fa fa-plus"></i>
                                                        </a>
                                                        <button class="btn btn-danger btn-sm btn-hapus"
                                                            data-kode="<?= $row['kode_soal']; ?>" title="Hapus Soal">
                                                            <i class="fa fa-trash"></i>
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                            <?php } ?>
                                        </tbody>
                                    </table>
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
        // Tambahkan di bagian script yang sudah ada
document.querySelectorAll('.btn-duplicate').forEach(function(button) {
    button.addEventListener('click', function(e) {
        e.preventDefault();
        const oldKode = this.getAttribute('data-kode');
        
        Swal.fire({
            title: 'Duplikasi Soal',
            input: 'text',
            inputLabel: 'Masukkan Kode Soal Baru',
            inputPlaceholder: 'Kode unik untuk soal duplikat',
            showCancelButton: true,
            confirmButtonText: 'Duplikat',
            cancelButtonText: 'Batal',
            inputValidator: (value) => {
                if (!value) {
                    return 'Kode soal baru harus diisi!';
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newKode = result.value;
                
                // Kirim permintaan AJAX
                fetch('duplicate_soal.php', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `old_kode=${encodeURIComponent(oldKode)}&new_kode=${encodeURIComponent(newKode)}`
                })
                .then(response => response.json())
                .then(data => {
                    if (data.status === 'success') {
                        Swal.fire({
                            icon: 'success',
                            title: 'Berhasil!',
                            text: data.message,
                            timer: 2000,
                            showConfirmButton: false
                        }).then(() => {
                            window.location.reload();
                        });
                    } else {
                        Swal.fire({
                            icon: 'error',
                            title: 'Gagal!',
                            text: data.message
                        });
                    }
                })
                .catch(error => {
                    console.error('Error:', error);
                    Swal.fire('Error', 'Terjadi kesalahan saat memproses permintaan.', 'error');
                });
            }
        });
    });
});

    document.addEventListener('DOMContentLoaded', function() {
        // Initialize DataTables
        $(document).ready(function() {
            $('#soalTable').DataTable({
                paging: true,
                lengthChange: true,
                searching: true,
                ordering: true,
                info: true,
                autoWidth: false,
                responsive: true,
                pageLength: 10,
                dom: '<"row mb-3"<"col-md-6"l><"col-md-6"f>>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
                language: {
                    search: "Cari:",
                    lengthMenu: "Tampilkan _MENU_ data per halaman",
                    info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ data",
                    infoEmpty: "Tidak ada data yang tersedia",
                    infoFiltered: "(difilter dari _MAX_ total data)",
                    paginate: {
                        first: "Pertama",
                        last: "Terakhir",
                        next: "Selanjutnya",
                        previous: "Sebelumnya"
                    }
                },
                columnDefs: [
                    { orderable: false, targets: [10, 11] }, // Disable sorting for action columns
                    { className: "text-center", targets: [0, 3, 4, 7, 8] }
                ],
                initComplete: function() {
                    // Add custom styling to DataTables elements
                    $('.dataTables_length select').addClass('form-select form-select-sm');
                    $('.dataTables_filter input').addClass('form-control form-control-sm');

                    // Force pagination to stay on the right
                    $('.dataTables_paginate').addClass('justify-content-end');
                    $('.dataTables_info').addClass('text-start');
                }
            });
        });
        document.querySelectorAll('.btn-hapus').forEach(function(button) {
            button.addEventListener('click', function() {
                const kodeSoal = this.getAttribute('data-kode');

                Swal.fire({
                    title: 'Konfirmasi Hapus',
                    html: 'Ketik <strong>HAPUS</strong> untuk menghapus data soal ini.',
                    input: 'text',
                    inputPlaceholder: 'Ketik HAPUS di sini',
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Hapus',
                    confirmButtonColor: '#d33',
                    cancelButtonText: 'Batal',
                    preConfirm: (inputValue) => {
                        if (inputValue !== 'HAPUS') {
                            Swal.showValidationMessage(
                                'Anda harus mengetik "HAPUS" dengan benar (huruf besar semua)'
                                );
                        }
                        return inputValue;
                    }
                }).then((result) => {
                    if (result.isConfirmed && result.value === 'HAPUS') {
                        window.location.href = 'hapus_soal.php?kode_soal=' +
                            encodeURIComponent(kodeSoal);
                    }
                });
            });
        });


    });
    </script>
    <?php if (isset($_SESSION['success'])): ?>
    <script>
    Swal.fire({
        icon: 'success',
        title: 'Berhasil',
        text: '<?php echo addslashes($_SESSION['success']); ?>',
        showConfirmButton: false,
        timer: 2000
    });
    </script>
    <?php unset($_SESSION['success']); endif; ?>
    <?php if (isset($_SESSION['error'])): ?>
    <script>
    Swal.fire({
        icon: 'error',
        title: 'Gagal',
        text: '<?php echo addslashes($_SESSION['error']); ?>',
        showConfirmButton: false,
        timer: 2000
    });
    </script>
    <?php unset($_SESSION['error']); endif; ?>
    <?php if (isset($_SESSION['success_message'])): ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        Swal.fire({
            title: 'Berhasil!',
            text: '<?php echo $_SESSION['success_message']; ?>',
            icon: 'success',
            confirmButtonText: 'OK'
        });
    });
    </script>
    <?php unset($_SESSION['success_message']); ?>
    <?php endif; ?>
    <?php if (isset($_SESSION['warning_message'])): ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        Swal.fire({
            icon: 'warning',
            title: 'Tidak Bisa Diedit!',
            text: '<?php echo $_SESSION['warning_message']; ?>',
            showConfirmButton: false,
            timer: 2000
        });
    });
    </script>
    <?php unset($_SESSION['warning_message']); ?>
    <?php endif; ?>
</body>

</html>
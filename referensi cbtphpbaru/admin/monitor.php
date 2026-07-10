<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
include '../inc/dataadmin.php';
// Cek jika sudah login
check_login('admin');

?>
<!DOCTYPE html>
<html lang="en">

<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Monitoring Ujian Siswa</title>
<?php include '../inc/css.php'; ?>
<style>
.card-header-custom {
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
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

.table-wrapper {
    border-radius: 0.5rem;
    box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075);
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
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

.filter-section {
    background: #f8f9fa;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1.5rem;
    border: 1px solid #dee2e6;
}

.btn-filter {
    border-radius: 0.5rem;
    font-weight: 500;
    transition: all 0.3s ease;
}

.btn-filter:hover {
    transform: translateY(-1px);
}

@media (max-width: 768px) {
    .filter-section .row > div {
        margin-bottom: 1rem;
    }

    .table-wrapper {
        font-size: 0.875rem;
    }

    table th,
    table td {
        padding: 0.5rem !important;
    }
}
</style>
</head>

<body>
    <div class="wrapper">

    <?php include 'sidebar.php'; ?>

<div class="main">
    <?php include 'navbar.php'; ?>
            <!-- /Navbar -->

            <!-- Content -->
            <main class="content">
                <div class="container-fluid p-0">
                    <div class="row">
                        <div class="col-12">
                            <div class="card shadow-sm">
                                <div class="card-header card-header-custom">
                                    <h5><i class="fas fa-desktop me-2"></i>Monitoring Ujian Siswa</h5>
                                </div>
                                <div class="card-body">
                                    <!-- Filter Section -->
                                    <form id="filterForm" class="row g-3 mb-4 align-items-end">
                                        <div class="col-md-3">
                                            <label for="searchInput" class="form-label">Cari Siswa</label>
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="fas fa-search"></i></span>
                                                <input type="text" id="searchInput" class="form-control" placeholder="Ketik nama siswa...">
                                            </div>
                                        </div>

                                        <div class="col-md-3">
                                            <label for="kode_soal_filter" class="form-label">Kode Soal</label>
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="fas fa-file-alt"></i></span>
                                                <select class="form-select" id="kode_soal_filter">
                                                    <option value="">Semua Kode Soal</option>
                                                    <?php
                                                    $soal_query = mysqli_query($koneksi, "SELECT DISTINCT kode_soal FROM soal WHERE status = 'Aktif' ORDER BY kode_soal");
                                                    while ($soal = mysqli_fetch_assoc($soal_query)) {
                                                        echo "<option value='{$soal['kode_soal']}'>{$soal['kode_soal']}</option>";
                                                    }
                                                    ?>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="col-md-3">
                                            <label for="status_filter" class="form-label">Status Ujian</label>
                                            <div class="input-group">
                                                <span class="input-group-text"><i class="fas fa-info-circle"></i></span>
                                                <select class="form-select" id="status_filter">
                                                    <option value="">Semua Status</option>
                                                    <option value="Aktif">Aktif</option>
                                                    <option value="Selesai">Selesai</option>
                                                </select>
                                            </div>
                                        </div>

                                        <div class="col-md-3 d-flex align-items-end gap-2">
                                            <button type="button" class="btn btn-light flex-fill" onclick="resetFilter()">
                                                <i class="fas fa-sync"></i> Reset
                                            </button>
                                            <small id="last-updated" class="text-muted flex-shrink-0"></small>
                                        </div>
                                    </form>

                                    <div class="table-wrapper">
                                        <table id="monitor" class="table table-bordered table-striped" style="width:100%">
                                            <thead>
                                                <tr>
                                                    <th>Nama Siswa</th>
                                                    <th>Kode Soal</th>
                                                    <th>Waktu Sisa</th>
                                                    <th>Waktu Mulai</th>
                                                    <th>Status Ujian</th>
                                                    <th>Progres Ujian</th>
                                                    <th>Aksi</th>
                                                </tr>
                                            </thead>
                                        </table>
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
<script>
let currentSearch = '';
let currentKodeSoal = '';
let currentStatus = '';
let searchTimer;

$(document).ready(function () {
    var table = $('#monitor').DataTable({
        processing: true,
        serverSide: true,
        ajax: {
            url: 'monitor_data.php',
            type: 'GET',
            data: function(d) {
                d.search = currentSearch;
                d.kode_soal = currentKodeSoal;
                d.status = currentStatus;
            }
        },
        columns: [
            { data: 'nama_siswa', title: 'Nama Siswa' },
            { data: 'kode_soal', title: 'Kode Soal' },
            { data: 'progres', title: 'Progres Ujian' },
            { data: 'waktu_sisa', title: 'Waktu Sisa' },
            { data: 'waktu_dijawab', title: 'Waktu Dijawab' },
            { data: 'status_badge', title: 'Status Ujian' },
            { data: 'aksi', title: 'Aksi' }
        ],
        columnDefs: [
            { targets: 6, orderable: false, searchable: false }
        ],
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
        initComplete: function () {
            // Panggil pertama kali
            updateTimestamp();

            // Ulangi setiap 1 menit
            setInterval(function () {
                table.ajax.reload(null, false); // Reload data tanpa reset halaman
                updateTimestamp();
            }, 60000); // 60 detik
        }
    });

    // Filter event handlers
    $('#searchInput').on('input', function() {
        clearTimeout(searchTimer);
        currentSearch = $(this).val().trim();
        searchTimer = setTimeout(() => {
            table.ajax.reload();
        }, 500);
    });

    $('#kode_soal_filter, #status_filter').on('change', function() {
        currentKodeSoal = $('#kode_soal_filter').val();
        currentStatus = $('#status_filter').val();
        table.ajax.reload();
    });

    // Reset filter function
    window.resetFilter = function() {
        $('#searchInput').val('');
        $('#kode_soal_filter').val('');
        $('#status_filter').val('');
        currentSearch = '';
        currentKodeSoal = '';
        currentStatus = '';
        table.ajax.reload();
    };

    function updateTimestamp() {
        let now = new Date();
        let formatted = now.toLocaleTimeString();
        $('#last-updated').html(
            '<i class="fa fa-refresh fa-spin me-1" style="color:green;" aria-hidden="true"></i>' +
            'Terakhir diperbarui: ' + formatted
        );
    }
});
</script>
<script>
$(document).on('click', '.simpan-paksa-btn', function () {
    const kodeSoal = $(this).data('kode');
    const idSiswa = $(this).data('siswa');
    const namaSiswa = $(this).data('nama');

    Swal.fire({
        title: 'Yakin simpan paksa ujian ini?',
        html: `<b>${namaSiswa}</b> akan dianggap <b>selesai</b> mengerjakan Ujian (<code>${kodeSoal}</code>)`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#6c757d',
        confirmButtonText: 'Ya, Simpan Paksa!',
        cancelButtonText: 'Batal'
    }).then((result) => {
        if (result.isConfirmed) {
            window.location.href = `simpan_paksa.php?kode_soal=${kodeSoal}&id_siswa=${idSiswa}`;
        }
    });
});
</script>
<?php if (isset($_SESSION['success_message'])): ?>
<script>
    $(document).ready(function() {
        Swal.fire({
            icon: 'success',
            title: 'Berhasil!',
            text: '<?= $_SESSION['success_message']; ?>',
            confirmButtonColor: '#3085d6',
            confirmButtonText: 'OK'
        });
    });
</script>
<?php unset($_SESSION['success_message']); endif; ?>

<?php if (isset($_SESSION['error_message'])): ?>
<script>
    $(document).ready(function() {
        Swal.fire({
            icon: 'error',
            title: 'Gagal!',
            text: '<?= $_SESSION['error_message']; ?>',
            confirmButtonColor: '#d33',
            confirmButtonText: 'OK'
        });
    });
</script>
<?php unset($_SESSION['error_message']); endif; ?>

</body>
</html>
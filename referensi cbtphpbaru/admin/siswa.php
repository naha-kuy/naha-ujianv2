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
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>Manajemen Siswa</title>
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

   .btn-group-actions {
     display: flex;
     flex-wrap: wrap;
     gap: 0.25rem;
     justify-content: flex-start;
   }

   .btn-group-actions .btn {
     margin: 0;
     border-radius: 0.375rem !important;
   }

   .student-info {
     display: flex;
     align-items: center;
     gap: 0.75rem;
   }

   .student-avatar {
     width: 40px;
     height: 40px;
     border-radius: 50%;
     background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
     display: flex;
     align-items: center;
     justify-content: center;
     color: white;
     font-weight: bold;
     font-size: 1.2rem;
   }

   .student-details h6 {
     margin: 0;
     font-weight: 600;
     color: #495057;
   }

   .student-details small {
     color: #6c757d;
     font-size: 0.75rem;
   }

   .class-badge {
     background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
     color: white;
     padding: 0.375rem 0.75rem;
     border-radius: 1rem;
     font-size: 0.75rem;
     font-weight: 600;
     display: inline-block;
   }

   .username-display {
     font-family: 'Courier New', monospace;
     background: #f8f9fa;
     padding: 0.25rem 0.5rem;
     border-radius: 0.25rem;
     font-size: 0.875rem;
     color: #495057;
   }

   .password-display {
     font-family: 'Courier New', monospace;
     background: #fff3cd;
     border: 1px solid #ffeaa7;
     padding: 0.25rem 0.5rem;
     border-radius: 0.25rem;
     font-size: 0.875rem;
     color: #856404;
     font-weight: 500;
   }

   .card-header-custom {
     background: linear-gradient(135deg, #764ba2 0%, #667eea 100%);
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
     background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
     border: none;
     color: white;
     padding: 0.75rem 1.5rem;
     border-radius: 0.5rem;
     font-weight: 500;
     transition: all 0.3s ease;
   }

   .btn-add-new:hover {
     transform: translateY(-2px);
     box-shadow: 0 4px 12px rgba(0, 123, 255, 0.3);
     color: white;
   }

   .btn-import, .btn-export {
     border-radius: 0.5rem;
     font-weight: 500;
     transition: all 0.3s ease;
   }

   .btn-import:hover {
     background: #28a745;
     border-color: #28a745;
     color: white;
   }

   .btn-export:hover {
     background: #dc3545;
     border-color: #dc3545;
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
     background: #007bff;
     border-color: #007bff;
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

     .btn-group-actions {
       justify-content: center;
     }

     .table-wrapper {
       font-size: 0.875rem;
     }

     table th,
     table td {
       padding: 0.5rem !important;
     }

     .student-info {
       flex-direction: column;
       align-items: flex-start;
       gap: 0.5rem;
     }

     .student-avatar {
       width: 35px;
       height: 35px;
       font-size: 1rem;
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
                  <h5><i class="fas fa-users me-2"></i>Manajemen Siswa</h5>
                </div>
                <div class="card-body">
                  <!-- Stats Summary -->
                  <div class="stats-summary">
                    <div class="stats-grid">
                      <?php
                      // Get total siswa
                      $total_siswa = mysqli_num_rows(mysqli_query($koneksi, "SELECT COUNT(*) as total FROM siswa"));
                      $total_siswa = mysqli_fetch_assoc(mysqli_query($koneksi, "SELECT COUNT(*) as total FROM siswa"))['total'];

                      // Get siswa by class
                      $kelas_result = mysqli_query($koneksi, "SELECT kelas, COUNT(*) as count FROM siswa GROUP BY kelas ORDER BY count DESC LIMIT 1");
                      $top_kelas = mysqli_fetch_assoc($kelas_result);
                      $top_kelas_name = $top_kelas['kelas'] ?? 'N/A';
                      $top_kelas_count = $top_kelas['count'] ?? 0;
                      ?>
                      <div class="stat-item">
                        <div class="stat-number"><?php echo $total_siswa; ?></div>
                        <div class="stat-label">Total Siswa</div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number"><?php echo $top_kelas_count; ?></div>
                        <div class="stat-label">Kelas <?php echo $top_kelas_name; ?></div>
                      </div>
                      <div class="stat-item">
                        <div class="stat-number"><?php echo mysqli_num_rows(mysqli_query($koneksi, "SELECT DISTINCT kelas FROM siswa")); ?></div>
                        <div class="stat-label">Jumlah Kelas</div>
                      </div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="action-buttons">
                    <div class="d-flex align-items-center">
                      <i class="fas fa-user-plus text-primary me-2 fs-5"></i>
                      <span class="fw-bold text-primary">Kelola Siswa</span>
                    </div>
                    <div class="d-flex gap-2 flex-wrap">
                      <a href="tambah_siswa.php" class="btn btn-add-new">
                        <i class="fas fa-plus me-2"></i>Tambah Siswa
                      </a>
                      <a href="import_siswa.php" class="btn btn-import btn-outline-success">
                        <i class="fas fa-file-import me-2"></i>Import
                      </a>
                      <button id="exportExcel" class="btn btn-export btn-outline-danger">
                        <i class="fas fa-file-excel me-2"></i>Export
                      </button>
                    </div>
                  </div>
                  <div class=" table-wrapper">
                  <table id="siswaTable" class="table table-striped table-hover">
                    <thead>
                      <tr>
                        <th style="display:none;">ID</th> <!-- kolom tersembunyi -->
                        <th style="width: 60px;">#</th>
                        <th style="min-width: 200px;">Nama Siswa</th>
                        <th style="width: 120px;">Kelas</th>
                        <th style="min-width: 150px;">Username</th>
                        <th style="min-width: 150px;">Password</th>
                        <th style="min-width: 150px;">Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      <?php
                      $no = 1;
                      $query = mysqli_query($koneksi, "SELECT * FROM siswa ORDER BY id_siswa DESC");
                      while ($data = mysqli_fetch_assoc($query)) {
                        include '../inc/encrypt.php';
                        $encoded = $data['password'];
                        $decoded = base64_decode($encoded);
                        $iv_length = openssl_cipher_iv_length($method);
                        $iv2 = substr($decoded, 0, $iv_length);
                        $encrypted_data = substr($decoded, $iv_length);
                        $decrypted = openssl_decrypt($encrypted_data, $method, $rahasia, 0, $iv2);

                        echo "<tr>";
                        echo "<td style='display:none;'>{$data['id_siswa']}</td>"; // kolom untuk sorting
                        echo "<td><span class='badge bg-light text-dark fw-bold'>{$no}</span></td>";
                        echo "<td>
                                <div class='student-info'>
                                  <div class='student-avatar'>" . strtoupper(substr($data['nama_siswa'], 0, 1)) . "</div>
                                  <div class='student-details'>
                                    <h6>{$data['nama_siswa']}</h6>
                                    <small>ID: {$data['id_siswa']}</small>
                                  </div>
                                </div>
                              </td>";
                        echo "<td><span class='class-badge'>{$data['kelas']}{$data['rombel']}</span></td>";
                        echo "<td><span class='username-display'>{$data['username']}</span></td>";
                        echo "<td><span class='password-display'>{$decrypted}</span></td>";
                        echo '<td>
                                <div class="btn-group-actions">
                                  <a href="edit_siswa.php?id=' . $data['id_siswa'] . '" class="btn btn-sm btn-primary" title="Edit Siswa">
                                    <i class="fas fa-edit"></i>
                                  </a>
                                  <form method="POST" action="hapus_siswa.php" class="d-inline delete-form" style="display:inline;">
                                    <input type="hidden" name="id" value="' . $data['id_siswa'] . '">
                                    <button type="submit" class="btn btn-danger btn-sm btn-delete" title="Hapus Siswa">
                                      <i class="fas fa-trash"></i>
                                    </button>
                                  </form>
                                </div>
                              </td>';
                        echo "</tr>";
                        $no++;
                      }
                      ?>
                    </tbody>
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
  <!--<script src="../assets/datatables/dataTables.buttons.min.js"></script>
  <script src="../assets/datatables/buttons.bootstrap5.min.js"></script>-->
  <script src="../assets/datatables/jszip.min.js"></script>
  <script src="../assets/datatables/buttons.html5.min.js"></script>
  <script>
    const table = $('#siswaTable').DataTable({
      dom: '<"row mb-3"<"col-md-6"l><"col-md-6"f>>rt<"row mt-3"<"col-md-6"i><"col-md-6"p>>',
      paging: true,
      lengthChange: true,
      searching: true,
      ordering: true,
      info: true,
      autoWidth: false,
      responsive: true,
      pageLength: 10,
      order: [[0, 'desc']], // Urutkan berdasarkan kolom tersembunyi ID
      language: {
        search: "Cari siswa:",
        lengthMenu: "Tampilkan _MENU_ siswa per halaman",
        info: "Menampilkan _START_ sampai _END_ dari _TOTAL_ siswa",
        infoEmpty: "Tidak ada data siswa yang tersedia",
        infoFiltered: "(difilter dari _MAX_ total siswa)",
        paginate: {
          first: "Pertama",
          last: "Terakhir",
          next: "Selanjutnya",
          previous: "Sebelumnya"
        }
      },
      columnDefs: [
        { targets: 0, visible: false }, // Sembunyikan kolom ID
        { orderable: false, targets: [6] }, // Disable sorting untuk kolom aksi
        { className: "text-center", targets: [1, 3] }
      ],
      buttons: [
        {
          extend: 'excelHtml5',
          title: 'Daftar Siswa',
          exportOptions: {
            columns: [1, 2, 3, 4, 5]
          }
        }
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

    // Trigger export dari tombol luar
    $('#exportExcel').on('click', function () {
      table.button('.buttons-excel').trigger();
    });

    // Konfirmasi Hapus
    document.querySelectorAll('.delete-form').forEach(form => {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        Swal.fire({
          title: 'Yakin ingin menghapus?',
          text: "Data siswa yang dihapus tidak bisa dikembalikan!",
          icon: 'warning',
          showCancelButton: true,
          confirmButtonColor: '#d33',
          cancelButtonColor: '#6c757d',
          confirmButtonText: 'Ya, hapus!',
          cancelButtonText: 'Batal'
        }).then((result) => {
          if (result.isConfirmed) {
            form.submit();
          }
        });
      });
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
<?php if (isset($_SESSION['alert'])): ?>
<script>
Swal.fire({
    icon: 'error',
    title: 'Gagal!',
    text: '<?= $_SESSION['error']; ?>',
    confirmButtonColor: '#dc3545'
});
</script>
<?php unset($_SESSION['error']); endif; ?>
</body>
</html>

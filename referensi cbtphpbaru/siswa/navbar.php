<nav class="navbar navbar-expand navbar-light navbar-bg shadow-sm" style="border-bottom: 3px solid #28a745;">
    <a class="sidebar-toggle js-sidebar-toggle me-3">
        <i class="hamburger align-self-center"></i>
    </a>

    <!-- Breadcrumb -->
    <nav aria-label="breadcrumb" class="d-none d-md-block">
        <ol class="breadcrumb mb-0 bg-transparent">
            <li class="breadcrumb-item">
                <a href="dashboard.php" class="text-decoration-none">
                    <i class="fas fa-home"></i> Dashboard
                </a>
            </li>
            <li class="breadcrumb-item active" aria-current="page">
                <?php
                $currentPage = basename($_SERVER['PHP_SELF']);
                $pageTitles = [
                    'dashboard.php' => 'Dashboard',
                    'ujian.php' => 'Daftar Ujian',
                    'hasil.php' => 'Hasil Ujian',
                    'perangkat.php' => 'Status Perangkat',
                    'preview_hasil.php' => 'Preview Hasil',
                    'konfirmasi_ujian.php' => 'Konfirmasi Ujian',
                    'mulaiujian.php' => 'Halaman Ujian'
                ];
                echo $pageTitles[$currentPage] ?? ucfirst(str_replace(['_', '.php'], [' ', ''], $currentPage));
                ?>
            </li>
        </ol>
    </nav>

    <div class="navbar-collapse collapse">
        <ul class="navbar-nav navbar-align ms-auto">

            <!-- User Info -->
            <li class="nav-item dropdown">
                <a class="nav-link dropdown-toggle d-flex align-items-center" href="#" id="userDropdown" data-bs-toggle="dropdown" aria-expanded="false">
                    <div class="avatar-circle me-2">
                        <i class="fas fa-user-graduate"></i>
                    </div>
                    <div class="d-none d-md-block">
                        <div class="fw-bold small"><?php echo htmlspecialchars($nama_siswa); ?></div>
                        <div class="text-muted small"><?php echo htmlspecialchars($kelas_siswa . $rombel_siswa); ?></div>
                    </div>
                </a>
                <ul class="dropdown-menu dropdown-menu-end shadow" aria-labelledby="userDropdown" style="min-width: 220px;">
                    <li class="px-3 py-2">
                        <div class="d-flex align-items-center">
                            <div class="avatar-circle me-3">
                                <i class="fas fa-user-graduate fa-2x"></i>
                            </div>
                            <div>
                                <div class="fw-bold"><?php echo htmlspecialchars($nama_siswa); ?></div>
                                <div class="text-muted small">Kelas <?php echo htmlspecialchars($kelas_siswa . $rombel_siswa); ?></div>
                            </div>
                        </div>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center" href="perangkat.php">
                            <i class="fas fa-laptop me-2"></i>
                            <span>Status Perangkat</span>
                        </a>
                    </li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center" href="hasil.php">
                            <i class="fas fa-chart-line me-2"></i>
                            <span>Hasil Ujian</span>
                        </a>
                    </li>
                    <li><hr class="dropdown-divider"></li>
                    <li>
                        <a class="dropdown-item d-flex align-items-center text-danger btnLogout" href="logout.php">
                            <i class="fas fa-sign-out-alt me-2"></i>
                            <span>Logout</span>
                        </a>
                    </li>
                </ul>
            </li>
        </ul>
    </div>
</nav>

<style>
.avatar-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    background: linear-gradient(135deg, #28a745 0%, #20c997 100%);
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
}

.navbar .breadcrumb-item a {
    color: #6c757d;
}

.navbar .breadcrumb-item.active {
    color: #495057;
    font-weight: 500;
}

.navbar .dropdown-menu {
    border: none;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
}

.navbar .dropdown-item {
    padding: 0.5rem 1rem;
    transition: all 0.2s ease;
}

.navbar .dropdown-item:hover {
    background-color: #f8f9fa;
    color: #495057;
}


@media (max-width: 768px) {
    .navbar .breadcrumb {
        display: none;
    }

    .navbar .d-none.d-md-block {
        display: none !important;
    }

    .avatar-circle {
        width: 28px;
        height: 28px;
    }
}
</style>

<?php
$currentPage = basename($_SERVER['PHP_SELF']);
?>
<nav id="sidebar" class="sidebar js-sidebar">
            <div class="sidebar-content js-simplebar">
                <a class="sidebar-brand" href="#">
                    <?php if (!empty($pengaturan['logo_sekolah'])): ?>
                        <div class="d-flex align-items-center justify-content-center mb-2">
                            <img src="../assets/images/<?= htmlspecialchars($pengaturan['logo_sekolah']) ?>"
                                 alt="Logo Sekolah"
                                 class="sidebar-logo"
                                 style="width: 100%; max-width: 120px; height: auto; max-height: 120px; object-fit: contain;">
                        </div>
                    <?php endif; ?>
                    <span class="align-middle fw-bold"><?= htmlspecialchars($pengaturan['nama_aplikasi'] ?? 'CBT E-School') ?></span>
                </a>

                <ul class="sidebar-nav">

                    <li class="sidebar-item <?= ($currentPage == 'dashboard.php') ? 'active' : '' ?>">
                        <a class="sidebar-link" href="dashboard.php">
                            <i class="align-middle fas fa-home"></i> <span class="align-middle">Dashboard</span>
                        </a>
                    </li>

                    <li class="sidebar-item <?= ($currentPage == 'ujian.php') ? 'active' : '' ?>">
                        <a class="sidebar-link" href="ujian.php">
                            <i class="align-middle fas fa-edit"></i> <span class="align-middle">Ujian</span>
                        </a>
                    </li>

                    <li class="sidebar-item <?= ($currentPage == 'hasil.php') ? 'active' : '' ?> <?= ($currentPage == 'preview_hasil.php') ? 'active' : '' ?>">
                        <a class="sidebar-link" href="hasil.php">
                            <i class="align-middle fas fa-chart-line"></i> <span class="align-middle">Hasil Ujian</span>
                        </a>
                    </li>

                    <li class="sidebar-item <?= ($currentPage == 'perangkat.php') ? 'active' : '' ?>">
                        <a class="sidebar-link" href="perangkat.php">
                            <i class="align-middle fas fa-laptop"></i> <span class="align-middle">Status Perangkat</span>
                        </a>
                    </li>

                    <li class="sidebar-item">
                        <a class="sidebar-link btnLogout" href="logout.php">
                            <i class="align-middle fas fa-sign-out-alt"></i> <span class="align-middle">Logout</span>
                        </a>
                    </li>
                </ul>

            </div>
        </nav>
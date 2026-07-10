<?php
session_start();

// Generate CSRF token if not exists
if (empty($_SESSION['csrf_token'])) {
    $_SESSION['csrf_token'] = bin2hex(random_bytes(32));
}

// Generate CAPTCHA if not exists
if (empty($_SESSION['captcha_question'])) {
    $a = rand(1, 9);
    $b = rand(1, 9);
    $_SESSION['captcha_question'] = "$a + $b";
    $_SESSION['captcha_answer'] = $a + $b;
}

// Check if already logged in
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    header("Location: admin/dashboard.php");
    exit;
}
if (isset($_SESSION['siswa_logged_in']) && $_SESSION['siswa_logged_in'] === true) {
    header("Location: siswa/dashboard.php");
    exit;
}

$error = '';
$active_tab = isset($_GET['tab']) && $_GET['tab'] === 'siswa' ? 'siswa' : 'admin';

// Process login form
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $role = trim($_POST['role'] ?? '');
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);
    $captcha_input = $_POST['captcha'] ?? '';

    if ((int)$captcha_input !== $_SESSION['captcha_answer']) {
        $error = 'Captcha salah!';
    } else {
        include 'koneksi/koneksi.php';
        include 'inc/functions.php';

        if (authenticate_user($username, $password, $role)) {
            $a = rand(1, 9);
            $b = rand(1, 9);
            $_SESSION['captcha_question'] = "$a + $b";
            $_SESSION['captcha_answer'] = $a + $b;

            if ($role === 'admin') {
                header("Location: admin/dashboard.php");
            } elseif ($role === 'siswa') {
                header("Location: siswa/dashboard.php");
            }
            exit;
        } else {
            $error = 'Username atau password salah!';
            $a = rand(1, 9);
            $b = rand(1, 9);
            $_SESSION['captcha_question'] = "$a + $b";
            $_SESSION['captcha_answer'] = $a + $b;
        }
    }
}

// Get logo settings
include 'koneksi/koneksi.php';
$q = mysqli_query($koneksi, "SELECT * FROM pengaturan WHERE id = 1");
$data = mysqli_fetch_assoc($q);
?>

<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Login - CBT eSchool</title>
    <?php include 'inc/css.php'; ?>
    <style>
        /* Modern Login Page with Background Image */

        /* Full Page Background */
        body {
            margin: 0;
            padding: 0;
            min-height: 100vh;
            background: url('assets/images/bglogin.jpg') no-repeat center center fixed;
            background-size: cover;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            position: relative;
        }

        /* Dark Overlay for Better Readability */
        body::before {
            content: '';
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: linear-gradient(135deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.4) 100%);
            z-index: -1;
        }

        /* Centered Login Container */
        .login-wrapper {
            min-height: 100vh;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
        }

        .login-container {
            background: rgba(255, 255, 255, 0.95);
            backdrop-filter: blur(20px);
            border-radius: 20px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
            padding: 40px;
            max-width: 450px;
            height: 750px;
            width: 100%;
            border: 1px solid rgba(255, 255, 255, 0.2);
            position: relative;
            overflow: hidden;
        }

        /* Decorative Elements */
        .login-container::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            height: 5px;
            background: linear-gradient(90deg, #007bff 0%, #28a745 50%, #fd7e14 100%);
        }

        /* Logo Section */
        .logo-section {
            text-align: center;
            margin-bottom: 30px;
        }

        .logo-section img {
            max-width: 120px;
            height: auto;
            margin-bottom: 20px;
            filter: drop-shadow(0 4px 8px rgba(0,0,0,0.2));
            transition: transform 0.3s ease;
        }

        .logo-section img:hover {
            transform: scale(1.05);
        }

        .logo-section h4 {
            color: #2c3e50;
            font-weight: 700;
            font-size: 1.8rem;
            margin-bottom: 8px;
            letter-spacing: -0.5px;
        }

        .logo-section p {
            color: #6c757d;
            font-size: 1rem;
            margin: 0;
            font-weight: 400;
        }

        /* Tab Navigation */
        .tab-navigation {
            display: flex;
            justify-content: center;
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border-radius: 12px;
            padding: 6px;
            margin-bottom: 20px;
            gap: 6px;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.05);
            width: 100%;
            position: relative;
            z-index: 10;
        }

        .tab-btn {
            flex: 1;
            border: none;
            padding: 12px 20px;
            border-radius: 8px;
            font-weight: 600;
            font-size: 14px;
            cursor: pointer;
            background: transparent;
            color: #6c757d;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            text-align: center;
            min-width: 140px;
        }

        .tab-btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent);
            transition: left 0.5s;
        }

        .tab-btn:hover::before {
            left: 100%;
        }

        .tab-btn:hover {
            background: rgba(255,255,255,0.8);
            color: #495057;
            transform: translateY(-1px);
        }

        .tab-btn.active {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
            transform: translateY(-2px);
        }

        .tab-btn i {
            margin-right: 8px;
            font-size: 16px;
        }

        /* Tab Content */
        .tab-content-container {
            position: relative;
            min-height: 350px;
        }

        .login-tab {
            display: none;
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            opacity: 0;
            transform: translateY(20px);
            transition: all 0.4s ease;
        }

        .login-tab.active {
            display: block;
            opacity: 1;
            transform: translateY(0);
        }

        /* Form Styling */
        .form-group {
            margin-bottom: 20px;
            position: relative;
        }

        .form-label {
            display: block;
            margin-bottom: 8px;
            font-weight: 600;
            color: #2c3e50;
            font-size: 14px;
            letter-spacing: 0.3px;
        }

        .form-control {
            width: 100%;
            padding: 14px 18px;
            border: 2px solid #e9ecef;
            border-radius: 10px;
            font-size: 15px;
            font-weight: 400;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.3s ease;
            color: #2c3e50;
            box-sizing: border-box;
        }

        .form-control:focus {
            outline: none;
            border-color: #007bff;
            box-shadow: 0 0 0 4px rgba(0, 123, 255, 0.1),
                        0 4px 12px rgba(0, 123, 255, 0.15);
            background: #ffffff;
            transform: translateY(-1px);
        }

        .form-control:hover {
            border-color: #ced4da;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .form-control::placeholder {
            color: #adb5bd;
            font-style: italic;
            opacity: 0.8;
        }

        /* Password Input Group */
        .password-input-group {
            position: relative;
        }

        .password-toggle {
            position: absolute;
            right: 14px;
            top: 50%;
            transform: translateY(-50%);
            cursor: pointer;
            color: #6c757d;
            background: none;
            border: none;
            font-size: 18px;
            padding: 8px;
            border-radius: 50%;
            transition: all 0.3s ease;
            z-index: 5;
        }

        .password-toggle:hover {
            color: #495057;
            background: rgba(108, 117, 125, 0.1);
            transform: translateY(-50%) scale(1.1);
        }

        /* CAPTCHA Styling */
        .captcha-group {
            background: linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%);
            border: 1px solid #dee2e6;
            border-radius: 12px;
            padding: 20px;
            margin: 20px 0;
            box-shadow: inset 0 2px 4px rgba(0,0,0,0.03);
        }

        .captcha-label {
            font-weight: 600;
            color: #495057;
            margin-bottom: 12px;
            display: block;
            font-size: 14px;
        }

        .captcha-row {
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .captcha-question {
            background: linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%);
            border: 2px solid #ffc107;
            border-radius: 8px;
            padding: 12px 20px;
            font-weight: 700;
            color: #dc3545;
            flex: 1;
            text-align: center;
            box-shadow: 0 2px 8px rgba(0,0,0,0.05);
            font-size: 15px;
            min-width: 0;
        }

        .captcha-input {
            width: 80px;
            padding: 12px 14px;
            border: 2px solid #e9ecef;
            border-radius: 8px;
            text-align: center;
            font-size: 15px;
            font-weight: 600;
            background: rgba(255, 255, 255, 0.9);
            transition: all 0.3s ease;
            flex-shrink: 0;
            color: #2c3e50;
        }

        .captcha-input:focus {
            outline: none;
            border-color: #28a745;
            box-shadow: 0 0 0 4px rgba(40, 167, 69, 0.1),
                        0 4px 12px rgba(40, 167, 69, 0.15);
            background: #ffffff;
            transform: translateY(-1px);
        }

        .captcha-input:hover {
            border-color: #ced4da;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
        }

        .captcha-input::placeholder {
            color: #adb5bd;
            font-weight: 400;
            text-align: center;
        }

        /* Buttons */
        .btn {
            display: inline-block;
            padding: 14px 24px;
            border: none;
            border-radius: 10px;
            cursor: pointer;
            font-size: 15px;
            font-weight: 600;
            text-align: center;
            text-decoration: none;
            transition: all 0.3s ease;
            position: relative;
            overflow: hidden;
            width: 100%;
            z-index: 20;
        }

        .btn::before {
            content: '';
            position: absolute;
            top: 0;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, rgba(255,255,255,0.2), transparent);
            transition: left 0.5s;
        }

        .btn:hover::before {
            left: 100%;
        }

        .btn-primary {
            background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(0, 123, 255, 0.3);
        }

        .btn-primary:hover {
            background: linear-gradient(135deg, #0056b3 0%, #004085 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(0, 123, 255, 0.4);
        }

        .btn-success {
            background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);
            color: white;
            box-shadow: 0 4px 15px rgba(40, 167, 69, 0.3);
        }

        .btn-success:hover {
            background: linear-gradient(135deg, #1e7e34 0%, #155724 100%);
            transform: translateY(-2px);
            box-shadow: 0 8px 25px rgba(40, 167, 69, 0.4);
        }

        /* Alerts */
        .alert {
            padding: 12px 18px;
            border-radius: 8px;
            margin-bottom: 20px;
            border: none;
            font-weight: 500;
        }

        .alert-danger {
            background: linear-gradient(135deg, #f8d7da 0%, #f5c6cb 100%);
            color: #721c24;
            box-shadow: 0 2px 8px rgba(220, 53, 69, 0.1);
        }

        /* Tab Labels */
        .tab-label {
            position: absolute;
            top: -12px;
            left: -12px;
            background: linear-gradient(135deg, #fd7e14 0%, #e8680d 100%);
            color: white;
            padding: 6px 12px;
            font-weight: 700;
            border-radius: 6px 0 6px 0;
            font-size: 11px;
            z-index: 15;
            box-shadow: 0 4px 12px rgba(253, 129, 29, 0.3);
            letter-spacing: 0.5px;
        }

        /* Card */
        .card {
            background: rgba(255, 255, 255, 0.9);
            border: none;
            border-radius: 12px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
            backdrop-filter: blur(10px);
        }

        .p-4 {
            padding: 1.5rem;
        }

        /* Input Group Spacing */
        .input-group-spacing {
            display: flex;
            flex-direction: column;
            gap: 0px;
        }

        /* Position Relative */
        .position-relative {
            position: relative;
        }

        /* Footer */
        .footer-copyright {
            position: fixed;
            bottom: 0;
            left: 0;
            right: 0;
            background: rgba(0, 0, 0, 0.8);
            backdrop-filter: blur(10px);
            color: white;
            text-align: center;
            padding: 12px 0;
            font-size: 12px;
            z-index: 1000;
            border-top: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* Responsive Design */
        @media (max-width: 576px) {
            .login-container {
                padding: 30px 20px;
                margin: 15px;
                border-radius: 16px;
            }

            .logo-section img {
                max-width: 100px;
            }

            .logo-section h4 {
                font-size: 1.5rem;
            }

            .tab-navigation {
                max-width: 300px;
                margin: 0 auto 30px auto;
            }

            .tab-btn {
                padding: 10px 16px;
                font-size: 13px;
                min-width: 120px;
            }

            .form-control {
                padding: 12px 16px;
                font-size: 14px;
            }

            .captcha-input {
                padding: 12px 12px;
                width: 70px;
                font-size: 14px;
            }

            .captcha-row {
                flex-direction: column;
                gap: 10px;
            }

            .captcha-question {
                text-align: center;
                padding: 10px 14px;
                font-size: 14px;
            }

            .btn {
                padding: 12px 20px;
                font-size: 14px;
            }
        }

        @media (max-width: 480px) {
            .login-container {
                padding: 25px 15px;
                margin: 10px;
            }

            .logo-section {
                margin-bottom: 20px;
            }

            .logo-section img {
                max-width: 80px;
            }

            .logo-section h4 {
                font-size: 1.3rem;
            }

            .tab-navigation {
                padding: 4px;
                margin-bottom: 20px;
            }

            .tab-btn {
                padding: 8px 12px;
                font-size: 12px;
            }

            .form-control {
                padding: 10px 14px;
                font-size: 13px;
            }

            .captcha-input {
                padding: 10px 12px;
                width: 70px;
                font-size: 13px;
            }

            .captcha-group {
                padding: 15px;
                margin: 15px 0;
            }

            .captcha-question {
                padding: 8px 12px;
                font-size: 13px;
            }
        }

        /* Loading Animation */
        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(30px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }

        .login-container {
            animation: fadeInUp 0.8s ease-out;
        }

        /* Accessibility */
        .form-control:focus,
        .captcha-input:focus {
            animation: focusPulse 0.3s ease-out;
        }

        @keyframes focusPulse {
            0% { transform: translateY(0); }
            50% { transform: translateY(-1px); }
            100% { transform: translateY(-1px); }
        }
    </style>
</head>
<body>
    <div class="login-wrapper">
        <div class="login-container">
            <!-- Logo Section -->
            <div class="logo-section">
                <img src="assets/images/<?= htmlspecialchars($data['logo_sekolah']) ?>" alt="CBT eSchool Logo">
                <p>Sistem Ujian Berbasis Komputer</p>
            </div>

            <!-- Tab Navigation -->
            <div class="tab-navigation">
                <button
                    class="tab-btn <?= $active_tab === 'admin' ? 'active' : '' ?>"
                    onclick="switchTab('admin')">
                    <i class="fas fa-user-shield"></i>
                    Login Admin
                </button>
                <button
                    class="tab-btn <?= $active_tab === 'siswa' ? 'active' : '' ?>"
                    onclick="switchTab('siswa')">
                    <i class="fas fa-user-graduate"></i>
                    Login Siswa
                </button>
            </div>

            <!-- Tab Content Container -->
            <div class="tab-content-container">
                <!-- Admin Login Tab -->
                <div class="login-tab <?= $active_tab === 'admin' ? 'active' : '' ?>" id="adminTab">
                    <div class="position-relative">
                        <div class="tab-label">Login Admin</div>
                        <div class="card shadow p-4">
                            <?php if (!empty($error) && $active_tab === 'admin'): ?>
                                <div id="adminAlert" class="alert alert-danger text-center mb-3" role="alert">
                                    <?= htmlspecialchars($error) ?>
                                </div>
                            <?php endif; ?>

                            <form method="POST" id="adminForm" autocomplete="off">
                                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                                <input type="hidden" name="role" value="admin">

                                <div class="input-group-spacing">
                                    <div class="form-group">
                                        <label for="admin_username" class="form-label">Username Admin</label>
                                        <input type="text" class="form-control" id="admin_username" name="username"
                                               placeholder="Masukkan username admin" required autocomplete="off">
                                    </div>

                                    <div class="form-group">
                                        <label for="admin_password" class="form-label">Password</label>
                                        <div class="password-input-group">
                                            <input type="password" class="form-control" id="admin_password" name="password"
                                                   placeholder="Masukkan password" required autocomplete="off">
                                            <span class="password-toggle" onclick="togglePassword('admin_password', 'admin_toggle')">
                                                <i class="fa fa-eye" id="admin_toggle"></i>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <div class="captcha-group">
                                            <label class="captcha-label">Verifikasi Keamanan</label>
                                            <div class="captcha-row">
                                                <div class="captcha-question">
                                                    <strong>Berapa hasil dari: <?= $_SESSION['captcha_question'] ?> ?</strong>
                                                </div>
                                                <input type="number" class="captcha-input" id="admin_captcha" name="captcha"
                                                       placeholder="Jawaban" required autocomplete="off">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-primary w-100" id="adminLoginButton">
                                    <i class="fas fa-sign-in-alt me-2"></i>Login sebagai Admin
                                </button>
                            </form>
                            <br>
                            <div id="admin_enc" style="font-size:13px;">
                                <p></p>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Siswa Login Tab -->
                <div class="login-tab <?= $active_tab === 'siswa' ? 'active' : '' ?>" id="siswaTab">
                    <div class="position-relative">
                        <div class="tab-label">Login Siswa</div>
                        <div class="card shadow p-4">
                            <?php if (!empty($error) && $active_tab === 'siswa'): ?>
                                <div id="siswaAlert" class="alert alert-danger text-center mb-3" role="alert">
                                    <?= htmlspecialchars($error) ?>
                                </div>
                            <?php endif; ?>

                            <form method="POST" id="siswaForm" autocomplete="off">
                                <input type="hidden" name="csrf_token" value="<?= $_SESSION['csrf_token'] ?>">
                                <input type="hidden" name="role" value="siswa">

                                <div class="input-group-spacing">
                                    <div class="form-group">
                                        <label for="siswa_username" class="form-label">Username Siswa</label>
                                        <input type="text" class="form-control" id="siswa_username" name="username"
                                               placeholder="Masukkan username siswa" required autocomplete="off">
                                    </div>

                                    <div class="form-group">
                                        <label for="siswa_password" class="form-label">Password</label>
                                        <div class="password-input-group">
                                            <input type="password" class="form-control" id="siswa_password" name="password"
                                                   placeholder="Masukkan password" required autocomplete="off">
                                            <span class="password-toggle" onclick="togglePassword('siswa_password', 'siswa_toggle')">
                                                <i class="fa fa-eye" id="siswa_toggle"></i>
                                            </span>
                                        </div>
                                    </div>

                                    <div class="form-group">
                                        <div class="captcha-group">
                                            <label class="captcha-label">Verifikasi Keamanan</label>
                                            <div class="captcha-row">
                                                <div class="captcha-question">
                                                    <strong>Berapa hasil dari: <?= $_SESSION['captcha_question'] ?> ?</strong>
                                                </div>
                                                <input type="number" class="captcha-input" id="siswa_captcha" name="captcha"
                                                       placeholder="Jawaban" required autocomplete="off">
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <button type="submit" class="btn btn-success w-100" id="siswaLoginButton">
                                    <i class="fas fa-sign-in-alt me-2"></i>Login sebagai Siswa
                                </button>
                            </form>
                            <br>
                            <div id="siswa_enc" style="font-size:13px;">
                                <p></p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- JavaScript -->
    <script src="assets/bootstrap-5.3.6/js/bootstrap.bundle.min.js"></script>
    <script>
        function togglePassword(inputId, iconId) {
            const input = document.getElementById(inputId);
            const icon = document.getElementById(iconId);
            if (input.type === "password") {
                input.type = "text";
                icon.classList.remove("fa-eye");
                icon.classList.add("fa-eye-slash");
            } else {
                input.type = "password";
                icon.classList.remove("fa-eye-slash");
                icon.classList.add("fa-eye");
            }
        }

        // Auto-hide alerts after 4 seconds
        setTimeout(() => {
            const alerts = document.querySelectorAll('.alert');
            alerts.forEach(alert => {
                alert.style.transition = "opacity 0.5s ease-out";
                alert.style.opacity = 0;
                setTimeout(() => alert.remove(), 500);
            });
        }, 4000);

        // Tab switching function
        function switchTab(tabName) {
            // Update URL
            const url = new URL(window.location);
            url.searchParams.set('tab', tabName);
            window.history.pushState({}, '', url);

            // Update tab buttons
            document.querySelectorAll('.tab-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            event.target.classList.add('active');

            // Hide all tabs
            document.querySelectorAll('.login-tab').forEach(tab => {
                tab.classList.remove('active');
            });

            // Show selected tab
            const activeTab = document.getElementById(tabName + 'Tab');
            if (activeTab) {
                activeTab.classList.add('active');
            }
        }

        // Form validation
        document.getElementById('adminForm').addEventListener('submit', function(e) {
            const username = document.getElementById('admin_username').value.trim();
            const password = document.getElementById('admin_password').value.trim();

            if (!username || !password) {
                e.preventDefault();
                alert('Mohon lengkapi semua field!');
                return false;
            }
        });

        document.getElementById('siswaForm').addEventListener('submit', function(e) {
            const username = document.getElementById('siswa_username').value.trim();
            const password = document.getElementById('siswa_password').value.trim();

            if (!username || !password) {
                e.preventDefault();
                alert('Mohon lengkapi semua field!');
                return false;
            }
        });

        // Initialize encrypted text for admin tab
        document.addEventListener("DOMContentLoaded", function() {
            const adminEnc = document.getElementById("admin_enc");
            if (adminEnc) {
                adminEnc.innerHTML = "<p style='text-align: center; margin: 0; font-size: 13px;'>© 2025 Naha</p>";
            }

            const siswaEnc = document.getElementById("siswa_enc");
            if (siswaEnc) {
                siswaEnc.innerHTML = "<p style='text-align: center; margin: 0; font-size: 13px;'>© 2025 Naha</p>";
            }
        });

        // Security check for admin tab
        function checkIfEncDeleted() {
            const adminEnc = document.getElementById("admin_enc");
            const siswaEnc = document.getElementById("siswa_enc");

            if (!adminEnc || !siswaEnc) {
                const adminButton = document.getElementById("adminLoginButton");
                const siswaButton = document.getElementById("siswaLoginButton");
                if (adminButton) {
                    adminButton.disabled = true;
                    adminButton.style.cursor = "not-allowed";
                    adminButton.style.opacity = "0.6";
                }
                if (siswaButton) {
                    siswaButton.disabled = true;
                    siswaButton.style.cursor = "not-allowed";
                    siswaButton.style.opacity = "0.6";
                }
                window.location.href = "error_page.php";
            }
        }

        setInterval(checkIfEncDeleted, 500);

        document.getElementById("adminForm").addEventListener("submit", function(event) {
            const adminButton = document.getElementById("adminLoginButton");
            if (adminButton.disabled) {
                event.preventDefault();
            }
        });

        document.getElementById("siswaForm").addEventListener("submit", function(event) {
            const siswaButton = document.getElementById("siswaLoginButton");
            if (siswaButton.disabled) {
                event.preventDefault();
            }
        });
    </script>
</body>
</html>


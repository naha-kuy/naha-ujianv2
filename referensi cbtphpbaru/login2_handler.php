<?php
// ULTRA MINIMAL LOGIN HANDLER FOR EXPERIMENT - ALWAYS RETURN VALID JSON
try {
    session_start();

    // Prevent any PHP errors from breaking JSON response
    error_reporting(0);
    ini_set('display_errors', 0);

// Check if already logged in
if (isset($_SESSION['admin_logged_in']) && $_SESSION['admin_logged_in'] === true) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'redirect' => 'admin/dashboard.php', 'message' => 'Already logged in']);
        exit;
    } else {
        header("Location: admin/dashboard.php");
        exit;
    }
}
if (isset($_SESSION['siswa_logged_in']) && $_SESSION['siswa_logged_in'] === true) {
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode(['success' => true, 'redirect' => 'siswa/dashboard.php', 'message' => 'Already logged in']);
        exit;
    } else {
        header("Location: siswa/dashboard.php");
        exit;
    }
}

$error = '';
$success = false;
$redirect = '';

// Process login form - ULTRA MINIMAL WITH ERROR HANDLING
if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $role = trim($_POST['role'] ?? 'admin');
    $username = trim($_POST['username']);
    $password = trim($_POST['password']);

    if (empty($username) || empty($password)) {
        $error = 'Username dan password harus diisi!';
    } else {
        // Try to include database connection with error handling
        $db_error = false;
        try {
            if (file_exists('koneksi/koneksi.php') && file_exists('inc/functions.php')) {
                include 'koneksi/koneksi.php';
                include 'inc/functions.php';
            } else {
                $db_error = true;
                $error = 'File koneksi database tidak ditemukan!';
            }
        } catch (Exception $e) {
            $db_error = true;
            $error = 'Error loading database: ' . $e->getMessage();
        }

        if (!$db_error) {
            try {
                if (function_exists('authenticate_user')) {
                    // Debug: Log the authentication attempt
                    error_log("Login attempt: role=$role, username=$username");

                    if (authenticate_user($username, $password, $role)) {
                        $success = true;
                        $redirect = ($role === 'admin' ? 'admin/dashboard.php' : 'siswa/dashboard.php');

                        // Debug: Log successful authentication
                        error_log("Login successful: redirecting to $redirect");

                        // For AJAX requests, return JSON
                        if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
                            header('Content-Type: application/json');
                            echo json_encode(['success' => true, 'redirect' => $redirect, 'message' => 'Login berhasil']);
                            exit;
                        } else {
                            // For regular form submission, redirect
                            header("Location: $redirect");
                            exit;
                        }
                    } else {
                        $error = 'Username atau password salah!';
                        error_log("Login failed: Invalid credentials for role=$role, username=$username");
                    }
                } else {
                    $error = 'Fungsi autentikasi tidak ditemukan!';
                    error_log("Login error: authenticate_user function not found");
                }
            } catch (Exception $e) {
                $error = 'Error autentikasi: ' . $e->getMessage();
                error_log("Login exception: " . $e->getMessage());
            }
        }
    }
}

// Return JSON response only for POST requests via AJAX
if ($_SERVER['REQUEST_METHOD'] == 'POST' && isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
    header('Content-Type: application/json');
    echo json_encode([
        'success' => $success,
        'error' => $error,
        'redirect' => $redirect
    ]);
    exit;
}

// For regular GET requests or other cases
if ($_SERVER['REQUEST_METHOD'] == 'POST' && !$success) {
    // If POST failed and not AJAX, redirect back with error
    header("Location: login2.html?error=" . urlencode($error));
    exit;
}

// For GET request, return logo path
if (isset($_GET['get_logo'])) {
    $logo_path = 'logo_1763396995.png'; // Default logo

    // Try to get logo from database
    try {
        if (file_exists('koneksi/koneksi.php')) {
            include 'koneksi/koneksi.php';
            if (function_exists('mysqli_query')) {
                $q = mysqli_query($koneksi, "SELECT logo_sekolah FROM pengaturan WHERE id = 1");
                if ($q) {
                    $data = mysqli_fetch_assoc($q);
                    if ($data && !empty($data['logo_sekolah'])) {
                        $logo_path = $data['logo_sekolah'];
                    }
                }
            }
        }
    } catch (Exception $e) {
        // Use default logo if database fails
    }

    header('Content-Type: application/json');
    echo json_encode([
        'success' => true,
        'logo' => 'assets/images/' . $logo_path
    ]);
    exit;
}

// For any other requests (GET, etc.), return a basic response
if (!isset($_SERVER['HTTP_X_REQUESTED_WITH']) || strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) !== 'xmlhttprequest') {
    // This is not an AJAX request, just return basic HTML or redirect
    if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
        header("Location: login2.html");
        exit;
    }
}

} catch (Exception $e) {
    // Catch any fatal errors and return valid JSON
    if (isset($_SERVER['HTTP_X_REQUESTED_WITH']) && strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) === 'xmlhttprequest') {
        header('Content-Type: application/json');
        echo json_encode([
            'success' => false,
            'error' => 'Terjadi kesalahan sistem: ' . $e->getMessage()
        ]);
    } else {
        header("Location: login2.html?error=" . urlencode('Terjadi kesalahan sistem'));
    }
    exit;
}
?>
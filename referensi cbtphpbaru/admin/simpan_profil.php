<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
check_login('admin');
include '../inc/dataadmin.php';

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nama_admin = trim($_POST['nama_admin']);
    $username = trim($_POST['username']);
    $password_lama = $_POST['password_lama'];
    $password_baru = $_POST['password_baru'];
    $konfirmasi_password = $_POST['konfirmasi_password'];

    $errors = [];

    // Validasi input
    if (empty($nama_admin)) {
        $errors[] = "Nama admin tidak boleh kosong";
    }

    if (empty($username)) {
        $errors[] = "Username tidak boleh kosong";
    }

    // Cek username unik jika diubah
    if ($username !== $username) {
        $query = "SELECT id FROM admins WHERE username = ? AND id != ?";
        $stmt = mysqli_prepare($koneksi, $query);
        mysqli_stmt_bind_param($stmt, "si", $username, $id_admin);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        if (mysqli_num_rows($result) > 0) {
            $errors[] = "Username sudah digunakan";
        }
    }

    // Jika ada password lama diisi, berarti ingin ganti password
    if (!empty($password_lama)) {
        // Verifikasi password lama
        $query = "SELECT password FROM admins WHERE id = ?";
        $stmt = mysqli_prepare($koneksi, $query);
        mysqli_stmt_bind_param($stmt, "i", $id_admin);
        mysqli_stmt_execute($stmt);
        $result = mysqli_stmt_get_result($stmt);
        $admin = mysqli_fetch_assoc($result);

        if (!password_verify($password_lama, $admin['password'])) {
            $errors[] = "Password lama salah";
        }

        // Validasi password baru
        if (empty($password_baru)) {
            $errors[] = "Password baru tidak boleh kosong";
        } elseif (strlen($password_baru) < 6) {
            $errors[] = "Password baru minimal 6 karakter";
        } elseif ($password_baru !== $konfirmasi_password) {
            $errors[] = "Konfirmasi password tidak cocok";
        }
    }

    if (empty($errors)) {
        // Update data admin
        if (!empty($password_lama) && !empty($password_baru)) {
            // Update dengan password baru
            $password_hash = password_hash($password_baru, PASSWORD_DEFAULT);
            $query = "UPDATE admins SET nama_admin = ?, username = ?, password = ? WHERE id = ?";
            $stmt = mysqli_prepare($koneksi, $query);
            mysqli_stmt_bind_param($stmt, "sssi", $nama_admin, $username, $password_hash, $id_admin);
        } else {
            // Update tanpa password
            $query = "UPDATE admins SET nama_admin = ?, username = ? WHERE id = ?";
            $stmt = mysqli_prepare($koneksi, $query);
            mysqli_stmt_bind_param($stmt, "ssi", $nama_admin, $username, $id_admin);
        }

        if (mysqli_stmt_execute($stmt)) {
            $_SESSION['success'] = "Profil berhasil diperbarui";
            // Update session variables
            $_SESSION['nama_admin'] = $nama_admin;
            $_SESSION['username'] = $username;
        } else {
            $_SESSION['error'] = "Gagal memperbarui profil: " . mysqli_error($koneksi);
        }
    } else {
        $_SESSION['error'] = implode("<br>", $errors);
    }

    header("Location: setting.php");
    exit;
} else {
    header("Location: setting.php");
    exit;
}
?>
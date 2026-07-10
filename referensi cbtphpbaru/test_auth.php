<?php
// Test authentication
session_start();
include 'koneksi/koneksi.php';
include 'inc/functions.php';

echo "<h1>Test Authentication</h1>";

// Test admin login
echo "<h2>Testing Admin Login</h2>";
$result = authenticate_user('admin', 'admin123', 'admin');
echo "Admin login result: " . ($result ? "SUCCESS" : "FAILED") . "<br>";

// Test siswa login
echo "<h2>Testing Siswa Login</h2>";
$result = authenticate_user('siswa1', 'siswa123', 'siswa');
echo "Siswa login result: " . ($result ? "SUCCESS" : "FAILED") . "<br>";

// Check database content
echo "<h2>Database Content</h2>";

// Check admins table
$result = mysqli_query($koneksi, "SELECT username, password FROM admins");
if ($result) {
    echo "<h3>Admins Table:</h3>";
    while ($row = mysqli_fetch_assoc($result)) {
        echo "Username: {$row['username']}, Password: {$row['password']}<br>";
    }
} else {
    echo "No admins table or query failed<br>";
}

// Check siswa table
$result = mysqli_query($koneksi, "SELECT username, password FROM siswa");
if ($result) {
    echo "<h3>Siswa Table:</h3>";
    while ($row = mysqli_fetch_assoc($result)) {
        echo "Username: {$row['username']}, Password: {$row['password']}<br>";
    }
} else {
    echo "No siswa table or query failed<br>";
}
?>
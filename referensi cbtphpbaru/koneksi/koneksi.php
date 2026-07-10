<?php
date_default_timezone_set('Asia/Jakarta');

$koneksi = mysqli_connect('localhost', 'root', '', 'cbt_db');
$key = 'cbteschool@#12345';

if (!$koneksi) {
    die("Koneksi database gagal: " . mysqli_connect_error());
}
?>
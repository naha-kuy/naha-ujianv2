<?php
session_start();
include '../koneksi/koneksi.php';
include '../inc/functions.php';
check_login('admin');
include '../inc/dataadmin.php';

$id_siswa = $_POST['id_siswa'] ?? '';
$kode_soal = $_POST['kode_soal'] ?? '';

if (empty($id_siswa) || empty($kode_soal)) {
    die("Data tidak valid!");
}

// 1. Hitung total soal
$query_total = mysqli_query($koneksi, 
    "SELECT COUNT(*) as total_soal 
    FROM butir_soal 
    WHERE kode_soal = '$kode_soal'");
$total_soal = mysqli_fetch_assoc($query_total)['total_soal'] ?? 0;
$nilai_per_soal = $total_soal > 0 ? (100 / $total_soal) : 0;
$nilai_format = number_format($nilai_per_soal, 2, '.', '');

// 2. Ambil jawaban dan detail uraian
$hasil = mysqli_fetch_assoc(mysqli_query($koneksi, 
    "SELECT jawaban_siswa, detail_uraian, nama_siswa 
    FROM nilai 
    WHERE id_siswa = '$id_siswa' 
    AND kode_soal = '$kode_soal'"));
$nama_siswa=$hasil['nama_siswa'];
$jawaban = [];
if (!empty($hasil['jawaban_siswa'])) {
    preg_match_all('/\[(\d+):([^\]]+)\]/', $hasil['jawaban_siswa'], $matches);
    foreach ($matches[1] as $key => $nomer) {
        $jawaban[$nomer] = $matches[2][$key];
    }
}

// 3. Parse nilai uraian
$nilai_uraian = [];
if (!empty($hasil['detail_uraian'])) {
    preg_match_all('/\[(\d+):([0-9.]+)\]/', $hasil['detail_uraian'], $matches);
    foreach ($matches[1] as $key => $nomer) {
        $nilai_uraian[$nomer] = $matches[2][$key];
    }
}

// 4. Ambil soal uraian
$soal = mysqli_query($koneksi, 
    "SELECT nomer_soal, pertanyaan 
    FROM butir_soal 
    WHERE kode_soal = '$kode_soal' 
    AND tipe_soal = 'Uraian'
    ORDER BY nomer_soal");

echo '<div class="card mb-4 border-0 shadow-sm">
        <div class="card-header bg-primary text-white">
            <h6 class="mb-0">
                <i class="fas fa-user-graduate me-2"></i>Koreksi Uraian
            </h6>
        </div>
        <div class="card-body bg-light">
            <div class="row g-3">
                <div class="col-md-3">
                    <strong class="text-primary">Nama Siswa:</strong><br>
                    <span class="text-dark">' . htmlspecialchars($nama_siswa) . '</span>
                </div>
                <div class="col-md-3">
                    <strong class="text-primary">Kode Soal:</strong><br>
                    <span class="text-dark">' . htmlspecialchars($kode_soal) . '</span>
                </div>
                <div class="col-md-3">
                    <strong class="text-primary">Total Soal:</strong><br>
                    <span class="text-dark">' . $total_soal . '</span>
                </div>
                <div class="col-md-3">
                    <strong class="text-primary">Nilai per Soal:</strong><br>
                    <span class="text-dark">' . number_format($nilai_per_soal, 2) . '</span>
                </div>
            </div>
        </div>
      </div>';

while ($s = mysqli_fetch_assoc($soal)) {
    $nomer = $s['nomer_soal'];
    $pertanyaan = nl2br(strip_tags($s['pertanyaan'], '<b><i><u><strong><em><img><br><p>'));
    $jawaban_siswa = nl2br(htmlspecialchars($jawaban[$nomer] ?? '-'));
    $nilai_awal = $nilai_uraian[$nomer] ?? 0;

    echo "<div class='card mb-4 shadow-sm border-0'>
            <div class='card-header bg-light border-bottom-0'>
                <div class='d-flex justify-content-between align-items-center'>
                    <h6 class='mb-0 text-primary fw-bold'>
                        <i class='fas fa-question-circle me-2'></i>Soal Nomor {$nomer}
                    </h6>
                    <span class='badge bg-primary'>Max: {$nilai_format}</span>
                </div>
            </div>
            <div class='card-body'>
                <div class='row'>
                    <div class='col-lg-6'>
                        <div class='mb-3'>
                            <label class='form-label text-muted small fw-bold'>PERTANYAAN</label>
                            <div class='border rounded p-3 bg-light soal'>
                                {$pertanyaan}
                            </div>
                        </div>
                    </div>
                    <div class='col-lg-6'>
                        <div class='mb-3'>
                            <label class='form-label text-muted small fw-bold'>JAWABAN SISWA</label>
                            <div class='border rounded p-3 bg-white soal' style='min-height: 120px;'>
                                {$jawaban_siswa}
                            </div>
                        </div>
                    </div>
                </div>

                <hr class='my-4'>

                <div class='row align-items-center'>
                    <div class='col-md-8'>
                        <label class='form-label fw-bold text-success mb-2'>
                            <i class='fas fa-star me-1'></i>PENILAIAN
                        </label>
                        <div class='d-flex align-items-center gap-3'>
                            <div class='flex-grow-1'>
                                <input type='range'
                                    min='0'
                                    max='{$nilai_format}'
                                    step='0.01'
                                    class='form-range nilai-slider'
                                    data-target='nilai-input-{$nomer}'
                                    value='{$nilai_awal}'
                                    style='height: 6px;'>
                            </div>
                            <div class='input-group' style='width: 120px;'>
                                <input type='number'
                                    min='0'
                                    max='{$nilai_format}'
                                    step='0.01'
                                    name='nilai[{$nomer}]'
                                    class='form-control form-control-sm nilai-input text-center fw-bold'
                                    id='nilai-input-{$nomer}'
                                    value='{$nilai_awal}'
                                    required>
                                <span class='input-group-text'>/{$nilai_format}</span>
                            </div>
                        </div>
                        <small class='text-muted mt-1 d-block'>
                            <i class='fas fa-info-circle me-1'></i>Geser slider atau ketik nilai langsung
                        </small>
                    </div>
                    <div class='col-md-4 text-center'>
                        <div class='p-3 bg-success bg-opacity-10 rounded'>
                            <div class='h4 mb-0 text-success fw-bold' id='nilai-display-{$nomer}'>
                                " . number_format($nilai_awal, 2) . "
                            </div>
                            <small class='text-muted'>Nilai Saat Ini</small>
                        </div>
                    </div>
                </div>
            </div>
          </div>";
}

echo "<input type='hidden' name='id_siswa' value='{$id_siswa}'>";
echo "<input type='hidden' name='kode_soal' value='{$kode_soal}'>";
?>

<!-- Script sinkronisasi slider & input -->
<script>
document.querySelectorAll('.nilai-slider').forEach(slider => {
    const inputId = slider.getAttribute('data-target');
    const inputBox = document.getElementById(inputId);
    const displayId = inputId.replace('nilai-input', 'nilai-display');
    const displayBox = document.getElementById(displayId);

    function updateDisplay() {
        const value = parseFloat(inputBox.value) || 0;
        displayBox.textContent = value.toFixed(2);
    }

    slider.addEventListener('input', () => {
        inputBox.value = slider.value;
        updateDisplay();
    });

    inputBox.addEventListener('input', () => {
        slider.value = inputBox.value;
        updateDisplay();
    });

    // Initial display update
    updateDisplay();
});
</script>

<style>
input[type=range]::-webkit-slider-runnable-track {
    height: 6px;
    background: linear-gradient(to right, #28a745 0%, #28a745 0%, #dee2e6 0%, #dee2e6 100%);
    border-radius: 4px;
    border: none;
}
input[type=range]::-webkit-slider-thumb {
    appearance: none;
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #28a745;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
}
input[type=range]::-moz-range-track {
    height: 6px;
    background: linear-gradient(to right, #28a745 0%, #28a745 0%, #dee2e6 0%, #dee2e6 100%);
    border-radius: 4px;
    border: none;
}
input[type=range]::-moz-range-thumb {
    height: 20px;
    width: 20px;
    border-radius: 50%;
    background: #28a745;
    border: 2px solid #fff;
    box-shadow: 0 2px 4px rgba(0,0,0,0.2);
    cursor: pointer;
    border: none;
}
input[type=range]:focus {
    outline: none;
}
input[type=range]:focus::-webkit-slider-thumb {
    box-shadow: 0 0 0 3px rgba(40, 167, 69, 0.3);
}
.soal {
    line-height: 1.6;
    font-size: 0.95rem;
}
.soal img {
    height: auto;
    width: auto;
    object-fit: contain;
    max-width: 100% !important;
    max-height: 300px !important;
    display: block;
    margin: 10px 0;
    border-radius: 8px;
    box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}
.soal p {
    margin-bottom: 1rem;
}
.form-range {
    cursor: pointer;
}
.nilai-input:focus {
    border-color: #28a745;
    box-shadow: 0 0 0 0.2rem rgba(40, 167, 69, 0.25);
}
</style>

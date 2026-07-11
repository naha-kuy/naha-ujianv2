import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../views/pages/LoginPage";
import AdminDashboard from "../views/pages/AdminDashboard";
import AdminBankSoal from "../views/pages/AdminBankSoal";
import AdminButirSoal from "../views/pages/AdminButirSoal";
import AdminSiswa from "../views/pages/AdminSiswa";
import AdminMonitoring from "../views/pages/AdminMonitoring";
import AdminPerangkat from "../views/pages/AdminPerangkat";
import AdminHasil from "../views/pages/AdminHasil";
import AdminKartu from "../views/pages/AdminKartu";
import AdminImportSiswa from "../views/pages/AdminImportSiswa";
import AdminOnline from "../views/pages/AdminOnline";
import AdminUploadGambar from "../views/pages/AdminUploadGambar";
import AdminPengaturan from "../views/pages/AdminPengaturan";
import AdminNotifikasi from "../views/pages/AdminNotifikasi";
import GuruNotifikasi from "../views/pages/GuruNotifikasi";
import SiswaNotifikasi from "../views/pages/SiswaNotifikasi";
import GuruDashboard from "../views/pages/GuruDashboard";
import GuruBankSoal from "../views/pages/GuruBankSoal";
import GuruButirSoal from "../views/pages/GuruButirSoal";
import GuruHasil from "../views/pages/GuruHasil";
import GuruProfil from "../views/pages/GuruProfil";
import SoalPreview from "../views/pages/SoalPreview";
import GuruPerangkat from "../views/pages/GuruPerangkat";
import GuruUploadGambar from "../views/pages/GuruUploadGambar";
import SiswaDashboard from "../views/pages/SiswaDashboard";
import SiswaBankSoal from "../views/pages/SiswaBankSoal";
import SiswaUjian from "../views/pages/SiswaUjian";
import SiswaKonfirmasiUjian from "../views/pages/SiswaKonfirmasiUjian";
import SiswaEngineUjian from "../views/pages/SiswaEngineUjian";
import SiswaHasil from "../views/pages/SiswaHasil";
import SiswaPreviewHasil from "../views/pages/SiswaPreviewHasil";
import SiswaProfil from "../views/pages/SiswaProfil";
import SiswaPerangkat from "../views/pages/SiswaPerangkat";
import AdminGuru from "../views/pages/AdminGuru";
import ErrorPage from "../views/pages/ErrorPage";
import ProtectedRoute from "../views/components/ProtectedRoute";

export default function RouteController() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LoginPage />} />
        <Route
          path="/admin"
          element={
            <ProtectedRoute role="admin">
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/admin/guru"
          element={
            <ProtectedRoute role="admin">
              <AdminGuru />
            </ProtectedRoute>
          }
        />
        <Route path="/admin/bank-soal" element={<ProtectedRoute role="admin"><AdminBankSoal /></ProtectedRoute>} />
        <Route path="/admin/butir-soal" element={<ProtectedRoute role="admin"><AdminButirSoal /></ProtectedRoute>} />
        <Route path="/admin/soal-preview" element={<ProtectedRoute role="admin"><SoalPreview /></ProtectedRoute>} />
        <Route path="/admin/siswa" element={<ProtectedRoute role="admin"><AdminSiswa /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute role="admin"><AdminMonitoring /></ProtectedRoute>} />
        <Route path="/admin/online" element={<ProtectedRoute role="admin"><AdminOnline /></ProtectedRoute>} />
        <Route path="/admin/perangkat" element={<ProtectedRoute role="admin"><AdminPerangkat /></ProtectedRoute>} />
        <Route path="/admin/hasil" element={<ProtectedRoute role="admin"><AdminHasil /></ProtectedRoute>} />
        <Route path="/admin/kartu" element={<ProtectedRoute role="admin"><AdminKartu /></ProtectedRoute>} />
        <Route path="/admin/import-siswa" element={<ProtectedRoute role="admin"><AdminImportSiswa /></ProtectedRoute>} />
        <Route path="/admin/upload-gambar" element={<ProtectedRoute role="admin"><AdminUploadGambar /></ProtectedRoute>} />
        <Route path="/admin/pengaturan" element={<ProtectedRoute role="admin"><AdminPengaturan /></ProtectedRoute>} />
        <Route path="/admin/notifikasi" element={<ProtectedRoute role="admin"><AdminNotifikasi /></ProtectedRoute>} />
        <Route
          path="/guru"
          element={
            <ProtectedRoute role="guru">
              <GuruDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/guru/bank-soal" element={<ProtectedRoute role="guru"><GuruBankSoal /></ProtectedRoute>} />
        <Route path="/guru/butir-soal" element={<ProtectedRoute role="guru"><GuruButirSoal /></ProtectedRoute>} />
        <Route path="/guru/soal-preview" element={<ProtectedRoute role="guru"><SoalPreview /></ProtectedRoute>} />
        <Route path="/guru/hasil" element={<ProtectedRoute role="guru"><GuruHasil /></ProtectedRoute>} />
        <Route path="/guru/perangkat" element={<ProtectedRoute role="guru"><GuruPerangkat /></ProtectedRoute>} />
        <Route path="/guru/profil" element={<ProtectedRoute role="guru"><GuruProfil /></ProtectedRoute>} />
        <Route path="/guru/upload-gambar" element={<ProtectedRoute role="guru"><GuruUploadGambar /></ProtectedRoute>} />
        <Route path="/guru/notifikasi" element={<ProtectedRoute role="guru"><GuruNotifikasi /></ProtectedRoute>} />
        <Route
          path="/siswa"
          element={
            <ProtectedRoute role="siswa">
              <SiswaDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/siswa/ujian" element={<ProtectedRoute role="siswa"><SiswaUjian /></ProtectedRoute>} />
        <Route path="/siswa/ujian/konfirmasi" element={<ProtectedRoute role="siswa"><SiswaKonfirmasiUjian /></ProtectedRoute>} />
        <Route path="/siswa/ujian/mulai" element={<ProtectedRoute role="siswa"><SiswaEngineUjian /></ProtectedRoute>} />
        <Route path="/siswa/bank-soal" element={<ProtectedRoute role="siswa"><SiswaBankSoal /></ProtectedRoute>} />
        <Route path="/siswa/hasil" element={<ProtectedRoute role="siswa"><SiswaHasil /></ProtectedRoute>} />
        <Route path="/siswa/hasil/detail" element={<ProtectedRoute role="siswa"><SiswaPreviewHasil /></ProtectedRoute>} />
        <Route path="/siswa/perangkat" element={<ProtectedRoute role="siswa"><SiswaPerangkat /></ProtectedRoute>} />
        <Route path="/siswa/profil" element={<ProtectedRoute role="siswa"><SiswaProfil /></ProtectedRoute>} />
        <Route path="/siswa/notifikasi" element={<ProtectedRoute role="siswa"><SiswaNotifikasi /></ProtectedRoute>} />
        <Route path="/error/:code" element={<ErrorPage />} />
        <Route path="*" element={<ErrorPage code={404} />} />
      </Routes>
    </BrowserRouter>
  );
}

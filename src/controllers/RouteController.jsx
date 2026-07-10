import { BrowserRouter, Routes, Route } from "react-router-dom";
import LoginPage from "../views/pages/LoginPage";
import AdminDashboard from "../views/pages/AdminDashboard";
import AdminBankSoal from "../views/pages/AdminBankSoal";
import AdminButirSoal from "../views/pages/AdminButirSoal";
import AdminSiswa from "../views/pages/AdminSiswa";
import AdminMonitoring from "../views/pages/AdminMonitoring";
import AdminHasil from "../views/pages/AdminHasil";
import AdminKartu from "../views/pages/AdminKartu";
import AdminUploadGambar from "../views/pages/AdminUploadGambar";
import AdminPengaturan from "../views/pages/AdminPengaturan";
import GuruDashboard from "../views/pages/GuruDashboard";
import GuruBankSoal from "../views/pages/GuruBankSoal";
import GuruButirSoal from "../views/pages/GuruButirSoal";
import GuruHasil from "../views/pages/GuruHasil";
import GuruProfil from "../views/pages/GuruProfil";
import GuruPerangkat from "../views/pages/GuruPerangkat";
import SiswaDashboard from "../views/pages/SiswaDashboard";
import SiswaUjian from "../views/pages/SiswaUjian";
import SiswaHasil from "../views/pages/SiswaHasil";
import SiswaProfil from "../views/pages/SiswaProfil";
import SiswaPerangkat from "../views/pages/SiswaPerangkat";
import AdminGuru from "../views/pages/AdminGuru";
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
        <Route path="/admin/siswa" element={<ProtectedRoute role="admin"><AdminSiswa /></ProtectedRoute>} />
        <Route path="/admin/monitoring" element={<ProtectedRoute role="admin"><AdminMonitoring /></ProtectedRoute>} />
        <Route path="/admin/hasil" element={<ProtectedRoute role="admin"><AdminHasil /></ProtectedRoute>} />
        <Route path="/admin/kartu" element={<ProtectedRoute role="admin"><AdminKartu /></ProtectedRoute>} />
        <Route path="/admin/upload-gambar" element={<ProtectedRoute role="admin"><AdminUploadGambar /></ProtectedRoute>} />
        <Route path="/admin/pengaturan" element={<ProtectedRoute role="admin"><AdminPengaturan /></ProtectedRoute>} />
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
        <Route path="/guru/hasil" element={<ProtectedRoute role="guru"><GuruHasil /></ProtectedRoute>} />
        <Route path="/guru/perangkat" element={<ProtectedRoute role="guru"><GuruPerangkat /></ProtectedRoute>} />
        <Route path="/guru/profil" element={<ProtectedRoute role="guru"><GuruProfil /></ProtectedRoute>} />
        <Route
          path="/siswa"
          element={
            <ProtectedRoute role="siswa">
              <SiswaDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/siswa/ujian" element={<ProtectedRoute role="siswa"><SiswaUjian /></ProtectedRoute>} />
        <Route path="/siswa/hasil" element={<ProtectedRoute role="siswa"><SiswaHasil /></ProtectedRoute>} />
        <Route path="/siswa/perangkat" element={<ProtectedRoute role="siswa"><SiswaPerangkat /></ProtectedRoute>} />
        <Route path="/siswa/profil" element={<ProtectedRoute role="siswa"><SiswaProfil /></ProtectedRoute>} />
      </Routes>
    </BrowserRouter>
  );
}

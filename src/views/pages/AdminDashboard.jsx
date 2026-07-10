import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate, Link } from "react-router-dom";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";

export default function AdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ borderLeft: "5px solid #dc3545" }}>
            <h1>Halo, {user?.name}!</h1>
            <p>Selamat datang di panel Admin. Anda memiliki akses penuh ke sistem.</p>
          </div>
          <div className="dash-grid">
            <Link to="/admin/guru" className="dash-card" style={{ borderLeft: "4px solid #28a745" }}>
              <h3><Icon name="people" size={20} /> Kelola Guru</h3>
              <p>Setujui pendaftaran & kelola data guru</p>
            </Link>
            <Link to="/admin/siswa" className="dash-card" style={{ borderLeft: "4px solid #17a2b8" }}>
              <h3><Icon name="people" size={20} /> Kelola Siswa</h3>
              <p>Atur data siswa peserta ujian</p>
            </Link>
            <Link to="/admin/bank-soal" className="dash-card" style={{ borderLeft: "4px solid #ffc107" }}>
              <h3><Icon name="document" size={20} /> Bank Soal</h3>
              <p>Kelola kumpulan soal ujian</p>
            </Link>
            <Link to="/admin/monitoring" className="dash-card" style={{ borderLeft: "4px solid #6f42c1" }}>
              <h3><Icon name="monitor" size={20} /> Monitoring</h3>
              <p>Pantau aktivitas ujian secara real-time</p>
            </Link>
            <Link to="/admin/hasil" className="dash-card" style={{ borderLeft: "4px solid #fd7e14" }}>
              <h3><Icon name="chart" size={20} /> Hasil</h3>
              <p>Lihat dan evaluasi hasil ujian</p>
            </Link>
            <Link to="/admin/pengaturan" className="dash-card" style={{ borderLeft: "4px solid #6c757d" }}>
              <h3><Icon name="gear" size={20} /> Pengaturan</h3>
              <p>Konfigurasi sistem dan aplikasi</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate, Link } from "react-router-dom";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";

export default function SiswaDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ borderLeft: "5px solid #007bff" }}>
            <h1>Halo, {user?.name}!</h1>
            <p>Selamat datang di portal Siswa. Akses ujian dan lihat hasil belajar Anda.</p>
          </div>
          <div className="dash-grid">
            <Link to="/siswa/ujian" className="dash-card" style={{ borderLeft: "4px solid #28a745" }}>
              <h3><Icon name="books" size={20} /> Ujian</h3>
              <p>Kerjakan ujian yang tersedia</p>
            </Link>
            <Link to="/siswa/hasil" className="dash-card" style={{ borderLeft: "4px solid #fd7e14" }}>
              <h3><Icon name="chart" size={20} /> Hasil</h3>
              <p>Lihat hasil dan riwayat ujian</p>
            </Link>
            <Link to="/siswa/perangkat" className="dash-card" style={{ borderLeft: "4px solid #6f42c1" }}>
              <h3><Icon name="monitor" size={20} /> Perangkat</h3>
              <p>Cek perangkat sebelum ujian</p>
            </Link>
            <Link to="/siswa/profil" className="dash-card" style={{ borderLeft: "4px solid #6c757d" }}>
              <h3><Icon name="person" size={20} /> Profil</h3>
              <p>Lihat dan ubah data profil Anda</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
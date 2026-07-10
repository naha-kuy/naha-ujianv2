import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate, Link } from "react-router-dom";
import GuruSidebar from "../components/sidebars/GuruSidebar";
import Icon from "../components/Icon";

export default function GuruDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <GuruSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ borderLeft: "5px solid #28a745" }}>
            <h1>Halo, {user?.name}!</h1>
            <p>Selamat datang di panel Guru. Kelola soal dan perangkat ujian Anda.</p>
          </div>
          <div className="dash-grid">
            <Link to="/guru/bank-soal" className="dash-card" style={{ borderLeft: "4px solid #ffc107" }}>
              <h3><Icon name="document" size={20} /> Bank Soal</h3>
              <p>Kelola kumpulan soal ujian</p>
            </Link>
            <Link to="/guru/butir-soal" className="dash-card" style={{ borderLeft: "4px solid #17a2b8" }}>
              <h3><Icon name="page" size={20} /> Butir Soal</h3>
              <p>Atur butir-butir soal tiap paket</p>
            </Link>
            <Link to="/guru/hasil" className="dash-card" style={{ borderLeft: "4px solid #fd7e14" }}>
              <h3><Icon name="chart" size={20} /> Hasil</h3>
              <p>Lihat dan evaluasi hasil ujian</p>
            </Link>
            <Link to="/guru/perangkat" className="dash-card" style={{ borderLeft: "4px solid #6f42c1" }}>
              <h3><Icon name="monitor" size={20} /> Perangkat</h3>
              <p>Atur perangkat dan sesi ujian</p>
            </Link>
            <Link to="/guru/profil" className="dash-card" style={{ borderLeft: "4px solid #6c757d" }}>
              <h3><Icon name="person" size={20} /> Profil</h3>
              <p>Lihat dan ubah data profil Anda</p>
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";

export default function SiswaDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h2>Dashboard Siswa</h2>
        <div className="nav-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="dashboard-content">
        <div className="welcome-card" style={{ borderLeft: "5px solid #007bff" }}>
          <h1>Halo, {user?.name}!</h1>
          <p>Selamat datang di portal Siswa. Akses ujian dan materi belajar Anda.</p>
        </div>
        <div className="placeholder-grid">
          <div className="placeholder-card">
            <h3>📚 Ujian Saya</h3>
            <p>Lihat jadwal dan kerjakan ujian</p>
          </div>
          <div className="placeholder-card">
            <h3>📖 Materi</h3>
            <p>Akses materi pembelajaran</p>
          </div>
          <div className="placeholder-card">
            <h3>📊 Nilai</h3>
            <p>Lihat hasil ujian Anda</p>
          </div>
        </div>
      </main>
    </div>
  );
}

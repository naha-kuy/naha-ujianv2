import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";

export default function GuruDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h2>Dashboard Guru</h2>
        <div className="nav-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="dashboard-content">
        <div className="welcome-card" style={{ borderLeft: "5px solid #28a745" }}>
          <h1>Halo, {user?.name}!</h1>
          <p>Selamat datang di panel Guru. Kelola kelas dan materi pembelajaran.</p>
        </div>
        <div className="placeholder-grid">
          <div className="placeholder-card">
            <h3>📝 Kelas Saya</h3>
            <p>Atur kelas yang Anda ajar</p>
          </div>
          <div className="placeholder-card">
            <h3>📖 Materi</h3>
            <p>Kelola materi pembelajaran</p>
          </div>
          <div className="placeholder-card">
            <h3>📋 Nilai</h3>
            <p>Input dan lihat nilai siswa</p>
          </div>
        </div>
      </main>
    </div>
  );
}

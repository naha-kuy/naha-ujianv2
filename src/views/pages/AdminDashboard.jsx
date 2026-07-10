import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const user = getCurrentUser();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="dashboard">
      <nav className="dashboard-nav">
        <h2>Dashboard Admin</h2>
        <div className="nav-right">
          <span>{user?.name}</span>
          <button onClick={handleLogout} className="btn-logout">Logout</button>
        </div>
      </nav>
      <main className="dashboard-content">
        <div className="welcome-card" style={{ borderLeft: "5px solid #dc3545" }}>
          <h1>Halo, {user?.name}!</h1>
          <p>Selamat datang di panel Admin. Anda memiliki akses penuh ke sistem.</p>
        </div>
        <div className="placeholder-grid">
          <div className="placeholder-card">
            <h3>👥 Kelola Pengguna</h3>
            <p>Atur data pengguna sistem</p>
          </div>
          <div className="placeholder-card">
            <h3>📊 Laporan</h3>
            <p>Lihat laporan dan statistik</p>
          </div>
          <div className="placeholder-card">
            <h3>⚙️ Pengaturan</h3>
            <p>Konfigurasi sistem</p>
          </div>
        </div>
      </main>
    </div>
  );
}

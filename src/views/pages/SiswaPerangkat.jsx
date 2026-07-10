import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";

export default function SiswaPerangkat() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card">
            <h2><Icon name="monitor" size={20} /> Perangkat Ujian</h2>
            <p style={{ color: "#9a7a30", fontSize: 13, marginTop: 6 }}>
              Halaman perangkat ujian dalam pengembangan.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
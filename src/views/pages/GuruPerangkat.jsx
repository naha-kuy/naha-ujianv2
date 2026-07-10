import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";
import GuruSidebar from "../components/sidebars/GuruSidebar";
import Icon from "../components/Icon";

export default function GuruPerangkat() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <GuruSidebar userName={user?.name} onLogout={handleLogout} />
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
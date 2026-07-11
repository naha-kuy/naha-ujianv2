import { useState } from "react";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import PerangkatInfo from "../components/PerangkatInfo";
import ModalSpeedTest from "../components/modal/ModalSpeedTest";

export default function AdminPerangkat() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [showSpeed, setShowSpeed] = useState(false);
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h1 style={{ fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="smartphone" size={20} /> Detail Perangkat
                </h1>
                <p style={{ fontSize: 11, color: "#9a7a30", marginTop: 2 }}>Informasi perangkat dan koneksi anda</p>
              </div>
              <button className="btn-primary" onClick={() => setShowSpeed(true)} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="zap" size={14} /> Test Kecepatan
              </button>
            </div>
            <PerangkatInfo />
          </div>
        </div>
      </main>
      <ModalSpeedTest show={showSpeed} onClose={() => setShowSpeed(false)} />
    </div>
  );
}

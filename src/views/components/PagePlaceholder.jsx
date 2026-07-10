import { getCurrentUser, logout } from "../../controllers/AuthController";
import { useNavigate } from "react-router-dom";

export default function PagePlaceholder({ title, description, sidebar: SidebarComponent }) {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  return (
    <div className="dash-layout">
      <SidebarComponent userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card">
            <h1>{title}</h1>
            <p>{description || "Halaman ini sedang dalam pengembangan."}</p>
          </div>
        </div>
      </main>
    </div>
  );
}

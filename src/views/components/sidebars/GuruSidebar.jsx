import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { isActive } from "../../../controllers/SidebarController";
import Icon from "../Icon";

const menus = [
  { label: "Dashboard", path: "/guru", icon: "dashboard" },
  { label: "Bank Soal", path: "/guru/bank-soal", icon: "document" },
  { label: "Butir Soal", path: "/guru/butir-soal", icon: "page" },
  { label: "Hasil", path: "/guru/hasil", icon: "chart" },
  { label: "Perangkat", path: "/guru/perangkat", icon: "monitor" },
  { label: "Profil", path: "/guru/profil", icon: "person" },
];

export default function GuruSidebar({ userName, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const toggle = () => setCollapsed((c) => !c);

  return (
    <>
      {collapsed && (
        <button className="sidebar-float-toggle" onClick={toggle} aria-label="Buka sidebar">
          <span></span><span></span><span></span>
        </button>
      )}
      <aside className={`sidebar ${collapsed ? "collapsed" : ""}`}>
        <div className="sidebar-head">
          <div className="sidebar-user">
            <div className="sidebar-avatar">{userName?.charAt(0)?.toUpperCase() || "G"}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>
              <span className="sidebar-user-role">Guru</span>
            </div>
          </div>
          <button className="sidebar-collapse-btn" onClick={toggle} aria-label="Tutup sidebar">
            <Icon name="chevron-left" size={16} />
          </button>
        </div>
        <nav className="sidebar-nav">
          {menus.map((item) => (
            <Link key={item.path + item.label} to={item.path}
              className={`sidebar-link ${isActive(item.path, location.pathname) ? "active" : ""}`}
              onClick={() => setCollapsed(false)}
            >
              <span className="sidebar-icon"><Icon name={item.icon} size={16} /></span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="sidebar-foot">
          <button className="sidebar-logout" onClick={onLogout}>
            <span className="sidebar-icon"><Icon name="logout" size={16} /></span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>
      </aside>
      {!collapsed && <div className="sidebar-overlay" onClick={() => setCollapsed(true)} />}
    </>
  );
}
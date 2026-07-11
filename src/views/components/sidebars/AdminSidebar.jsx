import { useState } from "react";
import { useLocation, Link } from "react-router-dom";
import { isActive } from "../../../controllers/SidebarController";
import Icon from "../Icon";

const menus = [
  { label: "Dashboard", path: "/admin", icon: "dashboard" },
  { label: "Guru", path: "/admin/guru", icon: "people" },
  { label: "Siswa", path: "/admin/siswa", icon: "person" },
  { label: "Import Siswa", path: "/admin/import-siswa", icon: "upload" },
  { label: "Bank Soal", path: "/admin/bank-soal", icon: "document" },
  { label: "Perangkat", path: "/admin/perangkat", icon: "smartphone" },
  { label: "Monitoring", path: "/admin/monitoring", icon: "eye" },
  { label: "Online", path: "/admin/online", icon: "map" },
  { label: "Hasil", path: "/admin/hasil", icon: "chart" },
  { label: "Kartu Peserta", path: "/admin/kartu", icon: "card" },
  { label: "Upload Gambar", path: "/admin/upload-gambar", icon: "image" },
  { label: "Notifikasi", path: "/admin/notifikasi", icon: "bell" },
  { label: "Pengaturan", path: "/admin/pengaturan", icon: "gear" },
];

export default function AdminSidebar({ userName, onLogout }) {
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
            <div className="sidebar-avatar">{userName?.charAt(0)?.toUpperCase() || "A"}</div>
            <div className="sidebar-user-info">
              <span className="sidebar-user-name">{userName}</span>
              <span className="sidebar-user-role">Admin</span>
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
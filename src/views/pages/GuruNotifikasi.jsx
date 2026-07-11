import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getNotifications, markAsRead, markAllAsRead, deleteNotification } from "../../controllers/NotifikasiController";
import GuruSidebar from "../components/sidebars/GuruSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

const typeStyles = {
  info: { bg: "rgba(23,162,184,0.1)", color: "#17a2b8", icon: "monitor" },
  warning: { bg: "rgba(255,193,7,0.1)", color: "#fd7e14", icon: "warning" },
  success: { bg: "rgba(40,167,69,0.1)", color: "#28a745", icon: "check" },
  error: { bg: "rgba(208,53,53,0.1)", color: "#cc0033", icon: "x" },
  exam: { bg: "rgba(111,66,193,0.1)", color: "#6f42c1", icon: "graduation" },
};

export default function GuruNotifikasi() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [notifs, setNotifs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  const fetchNotifs = async () => {
    const r = await getNotifications("guru");
    if (r.success) setNotifs(r.data);
    setLoading(false);
  };

  useEffect(() => { fetchNotifs(); }, []);

  const filtered = filter === "all" ? notifs : filter === "unread" ? notifs.filter((n) => !n.is_read) : notifs.filter((n) => n.type === filter);

  const handleMarkAll = async () => {
    await markAllAsRead();
    setNotifs((prev) => prev.map((n) => ({ ...n, is_read: true })));
  };

  const handleMark = async (id) => {
    await markAsRead(id);
    setNotifs((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)));
  };

  const handleDelete = async (id) => {
    await deleteNotification(id);
    setNotifs((prev) => prev.filter((n) => n.id !== id));
  };

  return (
    <div className="dash-layout">
      <GuruSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17 }}>Notifikasi</h2>
              {notifs.some((n) => !n.is_read) && (
                <button onClick={handleMarkAll}
                  style={{ padding: "6px 12px", background: "#b89440", color: "white", border: "none", borderRadius: 6, fontSize: 11, cursor: "pointer" }}>
                  Tandai Semua Dibaca
                </button>
              )}
            </div>

            <div className="filter-pills">
              {[
                { key: "all", label: "Semua" },
                { key: "unread", label: "Belum Dibaca" },
                { key: "exam", label: "Ujian" },
                { key: "info", label: "Info" },
                { key: "warning", label: "Peringatan" },
              ].map((f) => (
                <button key={f.key} onClick={() => setFilter(f.key)}
                  className={`filter-pill ${filter === f.key ? "active" : ""}`}>
                  {f.label} {f.key === "unread" && `(${notifs.filter((n) => !n.is_read).length})`}
                </button>
              ))}
            </div>

            {loading ? (
              <TableSkeleton rows={3} cols={2} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9a7a30", fontSize: 12 }}>
                <Icon name="monitor" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                Tidak ada notifikasi
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {filtered.map((n) => {
                  const ts = typeStyles[n.type] || typeStyles.info;
                  return (
                    <div key={n.id} style={{
                      display: "flex", gap: 12, padding: "12px 14px",
                      background: n.is_read ? "white" : ts.bg,
                      borderRadius: 8, border: `1px solid ${n.is_read ? "#e8d8a8" : ts.color}`,
                      alignItems: "flex-start",
                    }}>
                      <div style={{ color: ts.color, flexShrink: 0, marginTop: 2 }}>
                        <Icon name={ts.icon} size={18} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 12, color: "#5a3a00", marginBottom: 2 }}>
                          {n.title}
                          {!n.is_read && <span style={{ marginLeft: 8, background: ts.color, color: "white", padding: "1px 6px", borderRadius: 8, fontSize: 8 }}>BARU</span>}
                        </div>
                        <div style={{ fontSize: 11, color: "#9a7a30", lineHeight: 1.4 }}>{n.message}</div>
                        <div style={{ fontSize: 10, color: "#ccc", marginTop: 4 }}>
                          {new Date(n.created_at).toLocaleString("id-ID")}
                        </div>
                      </div>
                      <div style={{ display: "flex", gap: 4, flexShrink: 0 }}>
                        {!n.is_read && (
                          <button onClick={() => handleMark(n.id)}
                            style={{ background: "none", border: "1px solid #d4b86a", borderRadius: 4, cursor: "pointer", padding: "4px 8px", fontSize: 10, color: "#9a7a30" }}>
                            Baca
                          </button>
                        )}
                        <button onClick={() => handleDelete(n.id)}
                          style={{ background: "none", border: "1px solid #f5a0a0", borderRadius: 4, cursor: "pointer", padding: "4px 8px", fontSize: 10, color: "#cc0033" }}>
                          <Icon name="trash" size={12} />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

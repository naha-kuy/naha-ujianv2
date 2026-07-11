import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getOnlineStudents } from "../../controllers/ExamController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

export default function AdminOnline() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [kelasList, setKelasList] = useState([]);
  const [kelasFilter, setKelasFilter] = useState("");
  const pollingRef = useRef(null);

  const fetchData = async () => {
    const r = await getOnlineStudents();
    if (r.success) {
      setStudents(r.data);
      const k = [...new Set(r.data.map((s) => s.kelas).filter(Boolean))].sort();
      setKelasList(k);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
    pollingRef.current = setInterval(fetchData, 15000);
    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  const filtered = students.filter((s) => {
    if (kelasFilter && s.kelas !== kelasFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      return (s.name + s.username).toLowerCase().includes(q);
    }
    return true;
  });

  const isInExam = (s) => s.page_url?.includes("ujian");
  const lastSeen = (d) => {
    if (!d) return "—";
    const diff = Date.now() - new Date(d).getTime();
    const sec = Math.floor(diff / 1000);
    if (sec < 60) return `${sec}d`;
    const min = Math.floor(sec / 60);
    if (min < 60) return `${min}m`;
    return `${Math.floor(min / 60)}j ${min % 60}m`;
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17 }}>Who's Online — Siswa Aktif</h2>
              <Icon name="person" size={20} style={{ color: "#b89440" }} />
            </div>

            <div className="toolbar">
              <input className="toolbar-search" type="text" placeholder="Cari nama atau username..." value={search}
                onChange={(e) => setSearch(e.target.value)} />
              <select className="toolbar-filter" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <span className="toolbar-info">
                <span style={{ color: "#28a745" }}>{filtered.length}</span> siswa online
              </span>
            </div>

            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9a7a30", fontSize: 12 }}>
                <Icon name="person" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                Tidak ada siswa online
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Kelas</th>
                      <th>Status</th>
                      <th>Halaman</th>
                      <th>Terakhir Dilihat</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((s, i) => (
                      <tr key={s.id || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{s.name}</td>
                        <td>@{s.username}</td>
                        <td>{s.kelas || "—"}</td>
                        <td>
                          <span style={{
                            display: "inline-block", padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                            background: isInExam(s) ? "rgba(40,167,69,0.1)" : "rgba(23,162,184,0.1)",
                            color: isInExam(s) ? "#28a745" : "#17a2b8",
                          }}>
                            {isInExam(s) ? "Sedang Ujian" : "Online"}
                          </span>
                        </td>
                        <td style={{ fontSize: 10, color: "#9a7a30", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                          {s.page_url || "—"}
                        </td>
                        <td style={{ fontSize: 10, color: "#9a7a30", whiteSpace: "nowrap" }}>{lastSeen(s.last_activity)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

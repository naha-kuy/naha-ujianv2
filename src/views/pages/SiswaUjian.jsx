import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getAvailableExams } from "../../controllers/ExamController";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

export default function SiswaUjian() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [exams, setExams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await getAvailableExams();
    if (r.success) setExams(r.data);
    else setError(r.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // Auto-refresh every 60 seconds
  useEffect(() => {
    const interval = setInterval(fetchData, 60000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const filtered = exams.filter((e) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return (
      e.nama_soal?.toLowerCase().includes(q) ||
      e.kode_soal?.toLowerCase().includes(q) ||
      e.mapel?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {error && (
            <div style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>
              <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> {error}
            </div>
          )}

          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Ujian Tersedia</h2>
            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 12 }}>
              {filtered.length} ujian tersedia
            </p>

            <div className="toolbar">
              <input className="toolbar-search" type="text" placeholder="Cari berdasarkan nama, kode, atau mapel..."
                value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>

            {loading ? (
              <TableSkeleton rows={3} cols={4} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a7a30" }}>
                <Icon name="books" size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>{exams.length === 0 ? "Tidak ada ujian tersedia saat ini." : "Tidak ada hasil untuk pencarian ini."}</p>
              </div>
            ) : (
              <div className="dash-grid" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
                {filtered.map((e) => (
                  <div key={e.id_soal} className="dash-card"
                    style={{ border: "1px solid #e8d8a8", borderRadius: 12, padding: 16, cursor: "pointer" }}
                    onClick={() => navigate(`/siswa/ujian/konfirmasi?kode_soal=${e.kode_soal}`)}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: "50%",
                        background: "linear-gradient(135deg, #b89440, #d4b86a)",
                        display: "flex", alignItems: "center", justifyContent: "center",
                        color: "#2a1200", fontWeight: 800, fontSize: 18,
                      }}><Icon name="books" size={22} /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontWeight: 700, fontSize: 13, color: "#5a3a00", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{e.nama_soal}</div>
                        <div style={{ fontSize: 11, color: "#9a7a30" }}>{e.kode_soal}</div>
                      </div>
                    </div>
                    <div style={{ fontSize: 11, color: "#9a7a30", display: "flex", flexDirection: "column", gap: 4 }}>
                      <span><Icon name="document" size={12} /> Mapel: {e.mapel}</span>
                      <span><Icon name="monitor" size={12} /> Waktu: {e.waktu_ujian} menit</span>
                      <span><Icon name="monitor" size={12} /> Tanggal: {e.tanggal}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getSoalList } from "../../controllers/SoalController";
import { useNotification } from "../../contexts/NotificationContext";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

const PER_PAGE = [5, 10, 25];

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

function badge(val, ok) {
  return <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
    background: ok ? "rgba(30,80,16,0.1)" : "rgba(208,53,53,0.1)",
    color: ok ? "#1e5010" : "#b02020",
    border: `1px solid ${ok ? "rgba(30,80,16,0.2)" : "rgba(208,53,53,0.2)"}`,
  }}>{val}</span>;
}

export default function SiswaBankSoal() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const notif = useNotification();
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  const handleLogout = () => { logout(); navigate("/"); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const r = await getSoalList();
    if (r.success) setData(r.data); else notif.addNotification("error", r.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const distinctKelas = useMemo(() => [...new Set(data.map((s) => s.kelas).filter(Boolean))].sort(), [data]);

  const filtered = useMemo(() => {
    let list = data;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((s) =>
        s.nama_soal?.toLowerCase().includes(q) ||
        s.kode_soal?.toLowerCase().includes(q) ||
        s.mapel?.toLowerCase().includes(q)
      );
    }
    if (kelasFilter) list = list.filter((s) => s.kelas === kelasFilter);
    if (statusFilter !== "all") list = list.filter((s) => s.status === statusFilter);
    return list;
  }, [data, search, kelasFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / perPage));
  const safePage = Math.min(page, totalPages);
  const paginated = filtered.slice((safePage - 1) * perPage, safePage * perPage);
  useEffect(() => { if (page > totalPages) setPage(totalPages); }, [page, totalPages]);

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <h1 style={{ fontSize: 18, marginBottom: 12 }}>Bank Soal</h1>

            <div className="toolbar">
              <input className="toolbar-search" type="text" placeholder="Cari nama, kode, atau mapel..."
                value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
              <select className="toolbar-filter" value={kelasFilter} onChange={(e) => { setKelasFilter(e.target.value); setPage(1); }}>
                <option value="">Semua Kelas</option>
                {distinctKelas.map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
              <select className="toolbar-filter" value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}>
                <option value="all">Semua Status</option>
                <option value="Aktif">Aktif</option>
                <option value="Nonaktif">Nonaktif</option>
              </select>
              <select className="toolbar-filter" value={perPage} onChange={(e) => { setPerPage(Number(e.target.value)); setPage(1); }}>
                {PER_PAGE.map((n) => <option key={n} value={n}>{n}/hal</option>)}
              </select>
              <span className="toolbar-info">{filtered.length} soal</span>
            </div>

            {loading ? <TableSkeleton rows={3} cols={6} /> : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a7a30" }}>
                <Icon name="document" size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>Tidak ada soal ditemukan</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Kode</th>
                      <th>Nama Soal</th>
                      <th>Mapel</th>
                      <th>Kelas</th>
                      <th>Butir</th>
                      <th>Durasi</th>
                      <th>Tanggal</th>
                      <th>Tampilan</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginated.map((s, i) => (
                      <tr key={s.id_soal}>
                        <td>{(safePage - 1) * perPage + i + 1}</td>
                        <td style={{ fontWeight: 700, color: "#5a3a00" }}>{s.kode_soal}</td>
                        <td className="td-name">{s.nama_soal}</td>
                        <td>{s.mapel}</td>
                        <td>{badge(s.kelas, true)}</td>
                        <td style={{ textAlign: "center" }}>{badge(`${s.jumlah_butir} soal`, s.jumlah_butir > 0)}</td>
                        <td>{s.waktu_ujian}m</td>
                        <td className="td-date">{s.tanggal_unlimited ? badge("Unlimited", true) : fmtDate(s.tanggal)}</td>
                        <td>{badge(s.tampilan_soal, s.tampilan_soal === "Acak")}</td>
                        <td>{s.status === "Aktif" ? badge("Aktif", true) : badge("Nonaktif", false)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {totalPages > 1 && (
                  <div className="pagination">
                    <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)}>‹</button>
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button key={p} className={`page-btn ${p === safePage ? "active" : ""}`} onClick={() => setPage(p)}>{p}</button>
                    ))}
                    <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)}>›</button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

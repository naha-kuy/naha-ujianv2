import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout, getRegisteredStudents } from "../../controllers/AuthController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

export default function AdminKartu() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [kelasFilter, setKelasFilter] = useState("");
  const [search, setSearch] = useState("");
  const [distinctKelas, setDistinctKelas] = useState([]);

  const fetchData = async () => {
    setLoading(true);
    const r = await getRegisteredStudents();
    if (r.success) {
      const filtered = r.data.filter((s) => s.status === "approved" || s.status === "active");
      setStudents(filtered);
      const kelas = [...new Set(filtered.map((s) => s.kelas).filter(Boolean))].sort();
      setDistinctKelas(kelas);
    }
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const filtered = students.filter((s) => {
    if (kelasFilter && s.kelas !== kelasFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = (s.name + s.username + (s.email || "")).toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Split into pages of 9 for 3x3 grid
  const pages = [];
  for (let i = 0; i < filtered.length; i += 9) {
    pages.push(filtered.slice(i, i + 9));
  }

  const printCards = () => {
    const win = window.open("", "_blank");
    const year = new Date().getFullYear();
    const thnPelajaran = `${year}/${year + 1}`;

    let cardsHtml = "";
    pages.forEach((page, pi) => {
      cardsHtml += `<div class="page">`;
      page.forEach((s) => {
        cardsHtml += `
          <div class="kartu">
            <table style="width:100%"><tr>
              <td style="width:20%"><center><img src="/logo.png" alt="Logo" style="height:35px" onerror="this.style.display='none'"></center></td>
              <td style="width:80%;text-align:center;vertical-align:middle;font-size:11px">
                <strong>KARTU PESERTA UJIAN CBT</strong><br>
                TAHUN PELAJARAN ${thnPelajaran}
              </td>
            </tr></table>
            <table style="width:100%;font-size:11px;margin-top:8px">
              <tr><td>Nama</td><td>:</td><td>${s.name}</td></tr>
              <tr><td>Kelas</td><td>:</td><td>${s.kelas || "-"}${s.student_group || ""}</td></tr>
              <tr><td>Username</td><td>:</td><td>${s.username}</td></tr>
            </table>
          </div>`;
      });
      cardsHtml += `</div>`;
    });

    win.document.write(`<!DOCTYPE html>
<html><head><title>Cetak Kartu Peserta</title>
<style>
@page{size:A4 landscape;margin:8mm}
body{margin:0;padding:0;font-family:sans-serif;font-size:10pt}
.page{display:grid;grid-template-columns:repeat(3,1fr);grid-template-rows:repeat(3,1fr);gap:8px;width:100%;height:100%;page-break-after:always;padding:8px;box-sizing:border-box}
.kartu{border:1px solid #ccc;padding:8px;border-radius:6px;background:#fefefe;box-shadow:1px 1px 3px rgba(0,0,0,0.1);display:flex;flex-direction:column}
.kartu table{width:100%;border-collapse:collapse}
.kartu td{padding:2px 4px;vertical-align:middle;line-height:1.3}
@media print{.noprint{display:none}}
</style></head><body>
${cardsHtml}
<script>window.addEventListener("load",function(){window.print();window.close()})</script>
</body></html>`);
    win.document.close();
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Kartu Peserta</h2>
            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 12 }}>Cetak kartu peserta ujian</p>

            {loading ? (
              <TableSkeleton rows={4} cols={4} />
            ) : (
              <>
                <div className="toolbar">
                  <select className="toolbar-filter" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
                    <option value="">Semua Kelas</option>
                    {distinctKelas.map((k) => <option key={k} value={k}>{k}</option>)}
                  </select>
                  <input className="toolbar-search" type="text" placeholder="Cari nama, username..."
                    value={search} onChange={(e) => setSearch(e.target.value)} />
                  <span className="toolbar-info">{filtered.length} siswa</span>
                </div>
                {filtered.length > 0 && (
                  <div className="toolbar-actions">
                    <button className="btn-primary" onClick={printCards}
                      style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      <Icon name="save" size={14} /> Cetak Kartu ({filtered.length})
                    </button>
                  </div>
                )}

                {filtered.length === 0 ? (
                  <div style={{ textAlign: "center", padding: 32, color: "#9a7a30", fontSize: 12 }}>
                    <Icon name="people" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                    Pilih kelas atau cari nama untuk menampilkan kartu siswa.
                  </div>
                ) : (
                  /* Preview 3x3 grid */
                  pages.slice(0, 1).map((page, pi) => (
                    <div key={pi} style={{
                      display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 8,
                      border: "1px solid #d4b86a", borderRadius: 8, padding: 8, marginTop: 12,
                    }}>
                      {page.map((s) => (
                        <div key={s.id} style={{
                          border: "1px solid #ccc", borderRadius: 6, padding: 8, fontSize: 11,
                          background: "#fefefe",
                        }}>
                          <div style={{ display: "flex", justifyContent: "center", marginBottom: 6 }}>
                            <div style={{
                              width: 30, height: 30, borderRadius: "50%",
                              background: "linear-gradient(135deg, #b89440, #d4b86a)",
                              display: "flex", alignItems: "center", justifyContent: "center",
                              color: "white", fontWeight: 800, fontSize: 12,
                            }}>{s.name?.charAt(0)}</div>
                          </div>
                          <table style={{ width: "100%", fontSize: 10 }}>
                            <tbody>
                              <tr><td style={{ width: "35%", color: "#9a7a30" }}>Nama</td><td>:</td><td><strong>{s.name}</strong></td></tr>
                              <tr><td style={{ color: "#9a7a30" }}>Kelas</td><td>:</td><td>{s.kelas || "-"}{s.student_group || ""}</td></tr>
                              <tr><td style={{ color: "#9a7a30" }}>Username</td><td>:</td><td>{s.username}</td></tr>
                            </tbody>
                          </table>
                        </div>
                      ))}
                    </div>
                  ))
                )}
              </>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
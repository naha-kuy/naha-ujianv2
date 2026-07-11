import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getStudentResults } from "../../controllers/ExamController";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

function badge(val, ok, label) {
  return <span style={{
    display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
    background: ok ? "rgba(30,80,16,0.1)" : "rgba(208,53,53,0.1)",
    color: ok ? "#1e5010" : "#b02020",
    border: `1px solid ${ok ? "rgba(30,80,16,0.2)" : "rgba(208,53,53,0.2)"}`,
  }}>{label || val}</span>;
}

export default function SiswaHasil() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const r = await getStudentResults();
    if (r.success) setResults(r.data);
    else setError(r.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

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
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Hasil Ujian</h2>
            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 12 }}>
              {results.length} ujian telah dikerjakan
            </p>

            {loading ? (
              <TableSkeleton rows={4} cols={5} />
            ) : results.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a7a30" }}>
                <Icon name="chart" size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>Belum ada hasil ujian.</p>
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
                      <th>Nilai</th>
                      <th>Benar/Salah</th>
                      <th>Status</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.map((r, i) => (
                      <tr key={r.id}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 700, color: "#5a3a00" }}>{r.kode_soal}</td>
                        <td className="td-name">{r.soal?.nama_soal || "-"}</td>
                        <td>{r.soal?.mapel || "-"}</td>
                        <td style={{ fontWeight: 700, fontSize: 14, color: r.nilai >= 70 ? "#28a745" : r.nilai >= 40 ? "#fd7e14" : "#cc0033" }}>
                          {r.nilai}
                        </td>
                        <td style={{ fontSize: 11 }}>
                          {badge(`✓ ${r.jumlah_benar}`, true)} {badge(`✗ ${r.jumlah_salah}`, false)}
                        </td>
                        <td>
                          {r.status_nilai === "lengkap"
                            ? badge("Lengkap", true)
                            : r.status_nilai === "uraian"
                            ? badge("Menunggu Koreksi", false)
                            : badge("Auto", true)}
                        </td>
                        <td className="td-actions">
                          <button className="action-btn" title="Detail"
                            onClick={() => navigate(`/siswa/hasil/detail?kode_soal=${r.kode_soal}`)}
                            style={{ color: "#17a2b8", border: "1px solid #9fd6e8" }}>
                            <Icon name="monitor" size={14} />
                          </button>
                        </td>
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
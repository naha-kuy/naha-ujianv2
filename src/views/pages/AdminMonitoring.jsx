import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getMonitoringData, getOnlineStudents, getActivityLogs, forceSave, setForceLogout } from "../../controllers/ExamController";
import { getSoalList } from "../../controllers/SoalController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

export default function AdminMonitoring() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [exams, setExams] = useState([]);
  const [monitoring, setMonitoring] = useState([]);
  const [onlineStudents, setOnlineStudents] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  const [selectedKodeSoal, setSelectedKodeSoal] = useState("");
  const [kelasList, setKelasList] = useState([]);
  const [selectedKelas, setSelectedKelas] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [showLogs, setShowLogs] = useState(false);
  const pollingRef = useRef(null);
  const kodeSoalRef = useRef(selectedKodeSoal);
  const kelasRef = useRef(selectedKelas);
  const mountedRef = useRef(true);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  const safeSet = (fn) => (val) => { if (mountedRef.current) fn(val); };
  const safeSetMonitoring = useRef(safeSet(setMonitoring));
  const safeSetOnlineStudents = useRef(safeSet(setOnlineStudents));
  const safeSetActivityLogs = useRef(safeSet(setActivityLogs));

  const fetchData = async (kodeSoal, kelas) => {
    const [monRes, onlineRes, logsRes] = await Promise.all([
      getMonitoringData(kelas || null),
      getOnlineStudents(),
      getActivityLogs(kodeSoal || null, null),
    ]);
    if (!mountedRef.current) return;
    if (monRes.success) setMonitoring(monRes.data);
    if (onlineRes.success) setOnlineStudents(onlineRes.data);
    if (logsRes.success) setActivityLogs(kodeSoal ? logsRes.data : []);
  };

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [soalRes] = await Promise.all([
        getSoalList(),
        fetchData("", ""),
      ]);
      if (soalRes.success) {
        setExams(soalRes.data);
        const k = [...new Set(soalRes.data.map((s) => s.kelas).filter(Boolean))].sort();
        setKelasList(k);
      }
      setLoading(false);
    })();

    pollingRef.current = setInterval(() => {
      fetchData(kodeSoalRef.current, kelasRef.current);
    }, 10000);

    return () => { if (pollingRef.current) clearInterval(pollingRef.current); };
  }, []);

  useEffect(() => {
    kodeSoalRef.current = selectedKodeSoal;
    kelasRef.current = selectedKelas;
    fetchData(selectedKodeSoal, selectedKelas);
  }, [selectedKodeSoal, selectedKelas]);

  const handleForceSave = async (id_siswa, kode_soal) => {
    if (!confirm("Yakin ingin menyimpan paksa jawaban siswa ini?")) return;
    const r = await forceSave(id_siswa, kode_soal);
    if (r.success) {
      fetchData(selectedKodeSoal, selectedKelas);
    } else {
      setError(r.message);
    }
  };

  const handleForceLogout = async (id_siswa) => {
    if (!confirm("Yakin ingin memaksa logout siswa ini?")) return;
    const r = await setForceLogout(id_siswa);
    if (r.success) {
      fetchData(selectedKodeSoal, selectedKelas);
    } else {
      setError(r.message);
    }
  };

  const formatTime = (seconds) => {
    if (!seconds && seconds !== 0) return "-";
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, "0")}`;
  };

  const filtered = monitoring.filter((m) => {
    if (!searchTerm) return true;
    const name = m.siswa?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const getStatusBadge = (s) => {
    if (!s.siswa?.last_activity) return { text: "Offline", color: "#9a7a30" };
    const diff = Date.now() - new Date(s.siswa.last_activity).getTime();
    if (diff < 60000) return { text: "Online", color: "#28a745" };
    if (diff < 300000) return { text: "Ragu", color: "#fd7e14" };
    return { text: "Offline", color: "#9a7a30" };
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17 }}>Monitoring Ujian Real-time</h2>
              <Icon name="monitor" size={20} style={{ color: "#b89440" }} />
            </div>

            {error && (
              <div style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>
                <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> {error}
              </div>
            )}

            <div className="toolbar">
              <select className="toolbar-filter" value={selectedKodeSoal} onChange={(e) => setSelectedKodeSoal(e.target.value)}>
                <option value="">Semua Ujian</option>
                {exams.map((s) => (
                  <option key={s.kode_soal} value={s.kode_soal}>{s.nama_soal} ({s.kode_soal})</option>
                ))}
              </select>
              <select className="toolbar-filter" value={selectedKelas} onChange={(e) => setSelectedKelas(e.target.value)}>
                <option value="">Semua Kelas</option>
                {kelasList.map((k) => (
                  <option key={k} value={k}>{k}</option>
                ))}
              </select>
              <input className="toolbar-search" type="text" placeholder="Cari nama siswa..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="toolbar-info">
                <Icon name="check" size={12} style={{ color: "#28a745" }} /> {monitoring.length} ujian berlangsung
              </span>
            </div>

            {loading ? (
              <TableSkeleton rows={4} cols={6} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9a7a30", fontSize: 12 }}>
                <Icon name="monitor" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                Tidak ada sesi ujian aktif
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Nama Siswa</th>
                      <th>Kelas</th>
                      <th>Soal</th>
                      <th>Mapel</th>
                      <th>Status</th>
                      <th>Waktu Sisa</th>
                      <th>Terakhir Simpan</th>
                      <th style={{ width: 130 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((m, i) => {
                      const badge = getStatusBadge(m);
                      return (
                        <tr key={m.id || i}>
                          <td>{i + 1}</td>
                          <td style={{ fontWeight: 600 }}>{m.siswa?.name || "—"}</td>
                          <td>{m.siswa?.kelas || "—"}</td>
                          <td style={{ fontSize: 10 }}>{m.soal?.nama_soal || "—"}</td>
                          <td>{m.soal?.mapel || "—"}</td>
                          <td>
                            <span style={{
                              background: badge.color + "22", color: badge.color,
                              padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                            }}>{badge.text}</span>
                            {m.siswa?.force_logout && (
                              <span style={{ marginLeft: 4, color: "#cc0033", fontSize: 10, fontWeight: 600 }}>
                                🚫 Force Logout
                              </span>
                            )}
                          </td>
                          <td>{formatTime(m.waktu_sisa)}</td>
                          <td style={{ fontSize: 10, color: "#9a7a30" }}>
                            {m.last_save ? new Date(m.last_save).toLocaleTimeString("id-ID") : "—"}
                          </td>
                          <td>
                            <div style={{ display: "flex", gap: 4 }}>
                              <button onClick={() => handleForceSave(m.id_siswa, m.kode_soal)}
                                style={{ fontSize: 10, padding: "3px 8px", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 4, cursor: "pointer", color: "#856404" }}>
                                Simpan
                              </button>
                              <button onClick={() => handleForceLogout(m.id_siswa)}
                                style={{ fontSize: 10, padding: "3px 8px", background: "#fce8e8", border: "1px solid #f5a0a0", borderRadius: 4, cursor: "pointer", color: "#cc0033" }}>
                                Logout
                              </button>
                              <button onClick={() => { setSelectedKodeSoal(m.kode_soal); setShowLogs(true); }}
                                style={{ fontSize: 10, padding: "3px 8px", background: "#e8f4f8", border: "1px solid #87ceeb", borderRadius: 4, cursor: "pointer", color: "#006699" }}>
                                Log
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Online Students Summary */}
          <div className="welcome-card" style={{ padding: "20px 24px", marginTop: 16 }}>
            <h3 style={{ fontSize: 14, marginBottom: 12 }}>Siswa Online (5 menit terakhir)</h3>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              {onlineStudents.filter((s) => s.kelas).map((s) => (
                <div key={s.id} style={{
                  padding: "4px 12px", borderRadius: 20, fontSize: 11,
                  background: s.page_url?.includes("ujian") ? "rgba(40,167,69,0.1)" : "#f8f4ec",
                  border: `1px solid ${s.page_url?.includes("ujian") ? "#28a745" : "#e8d8a8"}`,
                  color: s.page_url?.includes("ujian") ? "#28a745" : "#9a7a30",
                  fontWeight: 600,
                }}>
                  {s.name}
                  {s.page_url?.includes("ujian") && " 📝"}
                </div>
              ))}
              {onlineStudents.length === 0 && (
                <span style={{ fontSize: 12, color: "#9a7a30" }}>Tidak ada siswa online</span>
              )}
            </div>
          </div>

          {/* Activity Logs */}
          {showLogs && (
            <div className="welcome-card" style={{ padding: "20px 24px", marginTop: 16 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
                <h3 style={{ fontSize: 14 }}>Log Aktivitas {selectedKodeSoal && `(${selectedKodeSoal})`}</h3>
                <button onClick={() => setShowLogs(false)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: "#9a7a30", fontSize: 12 }}>
                  Tutup
                </button>
              </div>
              {activityLogs.length === 0 ? (
                <div style={{ textAlign: "center", padding: 20, color: "#9a7a30", fontSize: 12 }}>Belum ada log aktivitas</div>
              ) : (
                <div style={{ maxHeight: 300, overflowY: "auto", fontSize: 11 }}>
                  <table className="admin-table">
                    <thead>
                      <tr>
                        <th>Waktu</th>
                        <th>Siswa</th>
                        <th>Aktivitas</th>
                        <th>Detail</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activityLogs.map((log, i) => (
                        <tr key={log.id || i}>
                          <td style={{ fontSize: 10, whiteSpace: "nowrap" }}>
                            {new Date(log.created_at).toLocaleString("id-ID")}
                          </td>
                          <td style={{ fontWeight: 600 }}>{log.siswa?.name || "—"}</td>
                          <td>
                            <span style={{
                              padding: "2px 6px", borderRadius: 4, fontSize: 10, fontWeight: 600,
                              background: log.aktivitas?.includes("curang") || log.aktivitas?.includes("pindah") ? "#fce8e8" : "#f8f4ec",
                              color: log.aktivitas?.includes("curang") || log.aktivitas?.includes("pindah") ? "#cc0033" : "#5a3a00",
                            }}>{log.aktivitas}</span>
                          </td>
                          <td style={{ fontSize: 10, color: "#9a7a30", maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis" }}>
                            {log.detail ? JSON.stringify(log.detail) : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

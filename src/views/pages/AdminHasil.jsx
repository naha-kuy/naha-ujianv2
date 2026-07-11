import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getAllResults, simpanNilaiUraian, deleteNilai } from "../../controllers/ExamController";
import { getButirSoalList, getSoalList } from "../../controllers/SoalController";
import supabase from "../../models/supabaseClient";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

function DetailModal({ result, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("butir_soal")
        .select("*")
        .eq("kode_soal", result.kode_soal)
        .order("nomer_soal", { ascending: true });
      setQuestions(data || []);
      setLoading(false);
    })();
  }, [result.kode_soal]);

  if (!result) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 12, maxWidth: 700, width: "90%", maxHeight: "85vh", overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16 }}>Detail Jawaban — {result.kode_soal}</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9a7a30" }}>&times;</button>
        </div>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 16 }}>
          {[
            { label: "Nilai", val: result.nilai, color: result.nilai >= 70 ? "#28a745" : result.nilai >= 40 ? "#fd7e14" : "#cc0033" },
            { label: "Benar", val: result.jumlah_benar, color: "#28a745" },
            { label: "Salah", val: result.jumlah_salah, color: "#cc0033" },
            { label: "Status", val: result.status_nilai, color: result.status_nilai === "lengkap" ? "#28a745" : "#fd7e14" },
          ].map((s) => (
            <div key={s.label} style={{ flex: 1, minWidth: 80, background: "#f8f4ec", borderRadius: 8, border: "1px solid #e8d8a8", padding: "10px 14px", textAlign: "center" }}>
              <div style={{ fontSize: 18, fontWeight: 800, color: s.color }}>{s.val}</div>
              <div style={{ fontSize: 10, color: "#9a7a30" }}>{s.label}</div>
            </div>
          ))}
        </div>
        {loading ? (
          <TableSkeleton rows={3} cols={1} />
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
            {questions.map((q) => {
              const jawab = result.jawaban?.[q.nomer_soal];
              const kunci = q.jawaban_benar;
              const getDisplay = () => {
                if (!jawab && jawab !== 0) return <span style={{ color: "#9a7a30", fontStyle: "italic" }}>Tidak dijawab</span>;
                if (typeof jawab === "string") return jawab.replace(/pilihan_/g, "Pilihan ");
                if (Array.isArray(jawab)) return jawab.map((j) => j.replace(/pilihan_/g, "")).join(", ");
                if (typeof jawab === "object") return Object.entries(jawab).map(([k, v]) => `${k}: ${v}`).join(" | ");
                return JSON.stringify(jawab);
              };
              return (
                <div key={q.id_soal} style={{ border: "1px solid #e8d8a8", borderRadius: 8, padding: 10, background: "white" }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: "#5a3a00", marginBottom: 4 }}>
                    #{q.nomer_soal} <span style={{ fontSize: 10, color: "#9a7a30", fontWeight: 400 }}>({q.tipe_soal})</span>
                  </div>
                  <div style={{ fontSize: 11, marginBottom: 6, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                  <div style={{ fontSize: 10, color: "#9a7a30" }}>
                    Jawaban: <strong style={{ color: "#5a3a00" }}>{getDisplay()}</strong>
                  </div>
                  {q.tipe_soal !== "Uraian" && kunci && (
                    <div style={{ fontSize: 10, color: "#9a7a30" }}>
                      Kunci: <strong style={{ color: "#28a745" }}>{kunci.replace(/[\[\]]/g, "").replace(/pilihan_/g, "Pilihan ")}</strong>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function KoreksiModal({ result, onSave, onClose }) {
  const [questions, setQuestions] = useState([]);
  const [skor, setSkor] = useState({});
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("butir_soal")
        .select("*")
        .eq("kode_soal", result.kode_soal)
        .eq("tipe_soal", "Uraian")
        .order("nomer_soal", { ascending: true });
      setQuestions(data || []);
      const init = {};
      (data || []).forEach((q) => { init[q.nomer_soal] = 50; });
      setSkor(init);
      setLoading(false);
    })();
  }, [result.kode_soal]);

  const handleSave = async () => {
    setSaving(true);
    await onSave(result.id, result.detail_uraian, skor);
    setSaving(false);
  };

  if (loading) return null;
  if (questions.length === 0) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div onClick={(e) => e.stopPropagation()} style={{ background: "white", borderRadius: 12, maxWidth: 600, width: "90%", maxHeight: "85vh", overflow: "auto", padding: 24 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
          <h2 style={{ fontSize: 16 }}>Koreksi Uraian</h2>
          <button onClick={onClose} style={{ background: "none", border: "none", fontSize: 20, cursor: "pointer", color: "#9a7a30" }}>&times;</button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
          {questions.map((q) => {
            const jawab = result.jawaban?.[q.nomer_soal] || "";
            return (
              <div key={q.id_soal} style={{ border: "1px solid #e8d8a8", borderRadius: 8, padding: 12, background: "#f8f4ec" }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: "#5a3a00", marginBottom: 4 }}>Soal #{q.nomer_soal}</div>
                <div style={{ fontSize: 11, marginBottom: 8, lineHeight: 1.4 }} dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                <div style={{ fontSize: 11, marginBottom: 8, padding: 8, background: "white", borderRadius: 6, border: "1px solid #e8d8a8" }}>
                  <strong>Jawaban siswa:</strong>
                  <p style={{ margin: "4px 0 0", whiteSpace: "pre-wrap", color: "#5a3a00", fontSize: 11 }}>{jawab || "(kosong)"}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <span style={{ fontSize: 11, color: "#9a7a30", minWidth: 60 }}>Skor: {skor[q.nomer_soal] || 0}</span>
                  <input type="range" min="0" max="100" value={skor[q.nomer_soal] || 0}
                    onChange={(e) => setSkor((s) => ({ ...s, [q.nomer_soal]: Number(e.target.value) }))}
                    style={{ flex: 1 }} />
                  <input type="number" min="0" max="100" value={skor[q.nomer_soal] || 0}
                    onChange={(e) => setSkor((s) => ({ ...s, [q.nomer_soal]: Math.min(100, Math.max(0, Number(e.target.value) || 0)) }))}
                    style={{ width: 50, padding: "4px 6px", border: "1px solid #d4b86a", borderRadius: 4, fontSize: 11, textAlign: "center" }} />
                </div>
              </div>
            );
          })}
        </div>
        <button onClick={handleSave} disabled={saving}
          style={{ marginTop: 16, width: "100%", padding: "10px", background: "#b89440", color: "white", border: "none", borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: "pointer", opacity: saving ? 0.6 : 1 }}>
          {saving ? "Menyimpan..." : "Simpan Nilai Uraian"}
        </button>
      </div>
    </div>
  );
}

export default function AdminHasil() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [results, setResults] = useState([]);
  const [exams, setExams] = useState([]);
  const [kelasList, setKelasList] = useState([]);
  const [selectedKodeSoal, setSelectedKodeSoal] = useState("");
  const [selectedKelas, setSelectedKelas] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [detailResult, setDetailResult] = useState(null);
  const [koreksiResult, setKoreksiResult] = useState(null);

  const fetchResults = useCallback(async () => {
    const filters = {};
    if (selectedKodeSoal) filters.kode_soal = selectedKodeSoal;
    if (selectedKelas) filters.kelas = selectedKelas;
    const r = await getAllResults(filters);
    if (r.success) setResults(r.data);
  }, [selectedKodeSoal, selectedKelas]);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const [soalRes] = await Promise.all([getSoalList(), fetchResults()]);
      if (soalRes.success) {
        setExams(soalRes.data);
        const k = [...new Set(soalRes.data.map((s) => s.kelas).filter(Boolean))].sort();
        setKelasList(k);
      }
      setLoading(false);
    })();
  }, [fetchResults]);

  useEffect(() => { fetchResults(); }, [fetchResults]);

  const filtered = results.filter((r) => {
    if (!searchTerm) return true;
    const name = r.siswa?.name || "";
    return name.toLowerCase().includes(searchTerm.toLowerCase());
  });

  const handleKoreksi = async (id, detail_uraian, skor) => {
    const r = await simpanNilaiUraian(id, detail_uraian, skor);
    if (r.success) {
      setKoreksiResult(null);
      fetchResults();
    } else {
      setError(r.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus nilai ini?")) return;
    const r = await deleteNilai(id);
    if (r.success) {
      fetchResults();
    } else {
      setError(r.message);
    }
  };

  const exportExcel = () => {
    const headers = ["No", "Nama", "Username", "Kelas", "Soal", "Mapel", "Nilai", "Benar", "Salah", "Total Soal", "Status", "Waktu Selesai"];
    const rows = filtered.map((r, i) => [
      i + 1, r.siswa?.name || "", r.siswa?.username || "", r.siswa?.kelas || "",
      r.soal?.nama_soal || r.kode_soal, r.soal?.mapel || "",
      r.nilai, r.jumlah_benar, r.jumlah_salah, r.jumlah_soal, r.status_nilai,
      r.waktu_selesai ? new Date(r.waktu_selesai).toLocaleString("id-ID") : "",
    ]);
    const csv = [headers.join(","), ...rows.map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `hasil_ujian_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
              <h2 style={{ fontSize: 17 }}>Hasil Ujian</h2>
              <Icon name="chart" size={20} style={{ color: "#b89440" }} />
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
              <input className="toolbar-search" type="text" placeholder="Cari siswa..." value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)} />
              <span className="toolbar-info">
                <Icon name="chart" size={12} /> {filtered.length} hasil
              </span>
            </div>
            <div className="toolbar-actions">
              <button onClick={exportExcel} disabled={filtered.length === 0}
                style={{ padding: "6px 14px", background: "#28a745", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4, opacity: filtered.length === 0 ? 0.5 : 1 }}>
                <Icon name="save" size={12} /> Export CSV
              </button>
            </div>

            {loading ? (
              <TableSkeleton rows={4} cols={7} />
            ) : filtered.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 0", color: "#9a7a30", fontSize: 12 }}>
                <Icon name="chart" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                Belum ada hasil ujian
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="admin-table" style={{ fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ width: 30 }}>#</th>
                      <th>Nama</th>
                      <th>Kelas</th>
                      <th>Soal</th>
                      <th style={{ width: 50 }}>Nilai</th>
                      <th>Benar</th>
                      <th>Salah</th>
                      <th>Status</th>
                      <th>Selesai</th>
                      <th style={{ width: 130 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((r, i) => (
                      <tr key={r.id || i}>
                        <td>{i + 1}</td>
                        <td style={{ fontWeight: 600 }}>{r.siswa?.name || "—"}</td>
                        <td>{r.siswa?.kelas || "—"}</td>
                        <td style={{ fontSize: 10 }}>{r.soal?.nama_soal || r.kode_soal}</td>
                        <td style={{ fontWeight: 800, color: r.nilai >= 70 ? "#28a745" : r.nilai >= 40 ? "#fd7e14" : "#cc0033" }}>{r.nilai}</td>
                        <td style={{ color: "#28a745" }}>{r.jumlah_benar}</td>
                        <td style={{ color: "#cc0033" }}>{r.jumlah_salah}</td>
                        <td>
                          <span style={{
                            padding: "2px 8px", borderRadius: 10, fontSize: 10, fontWeight: 600,
                            background: r.status_nilai === "lengkap" ? "rgba(40,167,69,0.1)" : r.status_nilai === "uraian" ? "rgba(255,193,7,0.1)" : "rgba(23,162,184,0.1)",
                            color: r.status_nilai === "lengkap" ? "#28a745" : r.status_nilai === "uraian" ? "#fd7e14" : "#17a2b8",
                          }}>
                            {r.status_nilai === "lengkap" ? "Lengkap" : r.status_nilai === "uraian" ? "Uraian" : "Auto"}
                          </span>
                        </td>
                        <td style={{ fontSize: 10, color: "#9a7a30", whiteSpace: "nowrap" }}>
                          {r.waktu_selesai ? new Date(r.waktu_selesai).toLocaleDateString("id-ID") : "—"}
                        </td>
                        <td>
                          <div style={{ display: "flex", gap: 4 }}>
                            <button onClick={() => setDetailResult(r)}
                              style={{ fontSize: 10, padding: "3px 8px", background: "#e8f4f8", border: "1px solid #87ceeb", borderRadius: 4, cursor: "pointer", color: "#006699" }}>
                              Detail
                            </button>
                            {r.status_nilai === "uraian" && (
                              <button onClick={() => setKoreksiResult(r)}
                                style={{ fontSize: 10, padding: "3px 8px", background: "#fff3cd", border: "1px solid #ffc107", borderRadius: 4, cursor: "pointer", color: "#856404" }}>
                                Koreksi
                              </button>
                            )}
                            <button onClick={() => handleDelete(r.id)}
                              style={{ fontSize: 10, padding: "3px 8px", background: "#fce8e8", border: "1px solid #f5a0a0", borderRadius: 4, cursor: "pointer", color: "#cc0033" }}>
                              Hapus
                            </button>
                          </div>
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

      {detailResult && (
        <DetailModal
          result={detailResult}
          onClose={() => setDetailResult(null)}
        />
      )}

      {koreksiResult && (
        <KoreksiModal
          result={koreksiResult}
          onSave={handleKoreksi}
          onClose={() => setKoreksiResult(null)}
        />
      )}
    </div>
  );
}

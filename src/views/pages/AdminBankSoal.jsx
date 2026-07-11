import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import {
  getSoalList, updateSoal, deleteSoal,
  toggleSoalStatus, getSoalCounts, generateSoalToken,
} from "../../controllers/SoalController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";
import ModalSoal from "../components/modal/ModalSoal";
import ModalPreviewSoal from "../components/modal/ModalPreviewSoal";

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

function emptyState(msg, icon = "document") {
  return (
    <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a7a30" }}>
      <Icon name={icon} size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
      <p style={{ fontSize: 13 }}>{msg}</p>
    </div>
  );
}

export default function AdminBankSoal() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [data, setData] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(10);
  const [actionLoading, setActionLoading] = useState(null);

  // Modal states
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ kode_soal: "", nama_soal: "", mapel: "", kelas: "", waktu_ujian: 60, tampilan_soal: "Urut", tanggal: "", token_required: false, tanggal_unlimited: false, tampilan_jawaban: "Urut" });
  const [saving, setSaving] = useState(false);

  const [showPreview, setShowPreview] = useState(null);

  const handleLogout = () => { logout(); navigate("/"); };

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError("");
    const [r, s] = await Promise.all([getSoalList(), getSoalCounts()]);
    if (r.success) setData(r.data); else setError(r.message);
    if (s.success) setStats(s.data);
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

  const openEdit = (soal) => {
    if (soal.status === "Aktif") { setError("Tidak bisa mengedit soal yang aktif"); return; }
    setEditId(soal.id_soal);
    setForm({
      kode_soal: soal.kode_soal,
      nama_soal: soal.nama_soal,
      mapel: soal.mapel,
      kelas: soal.kelas,
      waktu_ujian: soal.waktu_ujian,
      tampilan_soal: soal.tampilan_soal,
      tanggal: soal.tanggal?.split("T")[0] || "",
      token_required: soal.token_required ?? false,
      tanggal_unlimited: soal.tanggal_unlimited ?? false,
      tampilan_jawaban: soal.tampilan_jawaban || "Urut",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.nama_soal.trim() || !form.kode_soal.trim() || !form.mapel.trim() || !form.kelas.trim()) {
      setError("Semua field wajib diisi"); return;
    }
    setSaving(true); setError(""); setSuccess("");
    const r = await updateSoal(editId, form);
    setSaving(false);
    if (r.success) {
      setSuccess("Soal berhasil diperbarui");
      setShowForm(false);
      await fetchData();
    } else {
      setError(r.message);
    }
  };

  const handleDelete = async (soal) => {
    if (soal.status === "Aktif") { setError("Tidak bisa menghapus soal yang aktif"); return; }
    if (!window.confirm(`Hapus soal "${soal.nama_soal}"? Semua butir soal akan ikut terhapus.`)) return;
    setActionLoading(soal.kode_soal); setError(""); setSuccess("");
    const r = await deleteSoal(soal.kode_soal);
    setActionLoading(null);
    if (r.success) { setSuccess("Soal berhasil dihapus"); await fetchData(); }
    else setError(r.message);
  };

  const handleToggle = async (id, action) => {
    setActionLoading(id); setError(""); setSuccess("");
    const r = await toggleSoalStatus(id, action);
    setActionLoading(null);
    if (r.success) {
      setSuccess(action === "aktif" ? "Soal diaktifkan" : "Soal dinonaktifkan");
      await fetchData();
    } else setError(r.message);
  };

  const handleGenToken = async (id) => {
    setActionLoading(id); setError(""); setSuccess("");
    const r = await generateSoalToken(id);
    setActionLoading(null);
    if (r.success) { setSuccess(`Token baru: ${r.token}`); await fetchData(); }
    else setError(r.message);
  };

  // ── Render ──
  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {error && <div className="alert-anim" style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{error}</div>}
          {success && <div className="alert-anim" style={{ background: "rgba(30,80,16,0.08)", border: "1px solid rgba(30,80,16,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e5010", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{success}</div>}

          {loading ? (
            <div className="welcome-card">
              <h1 style={{ fontSize: 18, marginBottom: 12 }}>Bank Soal</h1>
              <TableSkeleton rows={4} cols={8} />
            </div>
          ) : (
            <>
              {/* Stats */}
              <div style={{ display: "flex", gap: 12, marginBottom: 16, flexWrap: "wrap" }}>
                {[{ label: "Total Soal", val: stats?.total || 0, color: "#b89440" },
                  { label: "Soal Aktif", val: stats?.active || 0, color: "#28a745" },
                  { label: "Total Butir", val: stats?.questions || 0, color: "#17a2b8" },
                ].map((s) => (
                  <div key={s.label} style={{ flex: 1, minWidth: 120, background: "white", borderRadius: 12, border: "1px solid #e8d8a8", padding: "14px 18px", textAlign: "center" }}>
                    <div style={{ fontSize: 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                    <div style={{ fontSize: 10, fontWeight: 600, color: "#9a7a30", marginTop: 2 }}>{s.label}</div>
                  </div>
                ))}
              </div>

              {/* Header */}
              <div className="welcome-card" style={{ padding: "16px 20px" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <h1 style={{ fontSize: 18 }}>Bank Soal</h1>
                </div>

                {/* Toolbar */}
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

                {/* Table */}
                {filtered.length === 0 ? emptyState("Tidak ada soal ditemukan", "document") : (
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
                          <th>Token</th>
                          <th>Status</th>
                          <th>Guru</th>
                          <th>Kelola</th>
                          <th>Aksi</th>
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
                            <td style={{ fontFamily: "monospace", fontSize: 12, fontWeight: 700, color: "#5a3a00" }}>{s.token ? (s.token_required ? s.token : `${s.token} (opsional)`) : "-"}</td>
                            <td>{s.status === "Aktif" ? badge("Aktif", true) : badge("Nonaktif", false)}</td>
                            <td style={{ fontSize: 11, color: "#9a7a30" }}>{s.created_by_username || "-"}</td>
                            <td className="td-actions">
                              {s.status === "Aktif" ? (
                                <>
                                  <button className="action-btn" title="Generate Token Baru"
                                    onClick={() => handleGenToken(s.id_soal)}
                                    disabled={actionLoading === s.id_soal}
                                    style={{ color: "#b89440", border: "1px solid #e0c878" }}>
                                    <Icon name="lock" size={14} />
                                  </button>
                                  <button className="action-btn" title="Nonaktifkan"
                                    onClick={() => handleToggle(s.id_soal, "nonaktif")}
                                    disabled={actionLoading === s.id_soal}
                                    style={{ color: "#cc0033", border: "1px solid #f5a0a0" }}>
                                    <Icon name="x" size={14} />
                                  </button>
                                </>
                              ) : (
                                <button className="action-btn action-approve" title="Aktifkan"
                                  onClick={() => handleToggle(s.id_soal, "aktif")}
                                  disabled={actionLoading === s.id_soal}>
                                  <Icon name="check" size={14} />
                                </button>
                              )}
                            </td>
                            <td className="td-actions">
                              <button className="action-btn" title="Preview"
                                onClick={() => setShowPreview(s)}
                                style={{ color: "#17a2b8", border: "1px solid #9fd6e8" }}>
                                <Icon name="monitor" size={14} />
                              </button>
                              <button className="action-btn" title="Edit"
                                onClick={() => openEdit(s)}
                                disabled={s.status === "Aktif"}
                                style={{ color: "#b89440", border: "1px solid #e0c878" }}>
                                <Icon name="edit" size={14} />
                              </button>
                              <button className="action-btn" title="Lihat Butir Soal"
                                onClick={() => navigate(`/admin/butir-soal?kode_soal=${s.kode_soal}&nama=${encodeURIComponent(s.nama_soal)}`)}
                                style={{ color: "#28a745", border: "1px solid #a5d6a7" }}>
                                <Icon name="page" size={14} />
                              </button>
                              <button className="action-btn" title="Hapus"
                                onClick={() => handleDelete(s)}
                                disabled={actionLoading === s.kode_soal}
                                style={{ color: "#cc0033", border: "1px solid #f5a0a0" }}>
                                <Icon name="trash" size={14} />
                              </button>
                            </td>
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
            </>
          )}
        </div>
      </main>

      {showForm && (
        <ModalSoal
          editId={editId}
          form={form}
          saving={saving}
          distinctKelas={distinctKelas}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          onChange={(f) => setForm(f)}
        />
      )}

      {showPreview && (
        <ModalPreviewSoal
          soal={showPreview}
          onClose={() => setShowPreview(null)}
        />
      )}
    </div>
  );
}

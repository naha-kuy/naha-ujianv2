import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser, logout,
  getRegisteredStudents, deleteUser, updateUser, createStudent,
} from "../../controllers/AuthController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";
import ModalEditSiswa from "../components/modal/ModalEditSiswa";
import ModalTambahSiswa from "../components/modal/ModalTambahSiswa";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

function msgBox(msg, cls, onClose) {
  if (!msg) return null;
  return (
    <div key={msg + cls} className="alert-anim" style={{
      marginBottom: 12,
      background: cls === "err" ? "rgba(208,53,53,0.1)" : "rgba(30,80,16,0.08)",
      border: cls === "err" ? "1px solid rgba(208,53,53,0.2)" : "1px solid rgba(30,80,16,0.15)",
      borderRadius: 8, padding: "10px 14px", fontSize: 12,
      color: cls === "err" ? "#b02020" : "#1e5010",
      display: "flex", alignItems: "center", justifyContent: "space-between",
      fontWeight: 600,
    }}>
      <span>{msg}</span>
      {onClose && <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}><Icon name="x" size={14} /></button>}
    </div>
  );
}

export default function AdminSiswa() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [search, setSearch] = useState("");
  const [kelasFilter, setKelasFilter] = useState("");
  const [actionLoading, setActionLoading] = useState(null);

  // add modal
  const [showAdd, setShowAdd] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };

  const handleAdd = async (form) => {
    setSaving(true); setError(""); setSuccess("");
    const r = await createStudent(form);
    setSaving(false);
    if (r.success) {
      setSuccess(`Siswa "${form.name}" berhasil ditambahkan!`);
      setShowAdd(false);
      await fetchData();
    } else {
      setError(r.message);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true); setError("");
    const r = await getRegisteredStudents();
    if (r.success) setStudents(r.data); else setError(r.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const distinctKelas = useMemo(() => {
    return [...new Set(students.map((s) => s.student_class).filter(Boolean))].sort();
  }, [students]);

  const filtered = useMemo(() => {
    let list = students;
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter((u) =>
        u.name?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q)
      );
    }
    if (kelasFilter) list = list.filter((u) => u.student_class === kelasFilter);
    return list;
  }, [students, search, kelasFilter]);

  // delete
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus siswa "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionLoading(id); setError(""); setSuccess("");
    const r = await deleteUser(id);
    setActionLoading(null);
    if (r.success) {
      setSuccess(`Siswa "${name}" berhasil dihapus.`);
      setStudents((prev) => prev.filter((u) => u.id !== id));
    } else {
      setError(r.message);
    }
  };

  // edit
  const openEdit = (siswa) => {
    setEditing(siswa.id);
    setEditForm({
      name: siswa.name || "",
      username: siswa.username || "",
      email: siswa.email || "",
      student_class: siswa.student_class || "",
      student_group: siswa.student_group || "",
    });
  };
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.username.trim()) {
      setError("Nama dan username wajib diisi."); return;
    }
    setSaving(true); setError(""); setSuccess("");
    const r = await updateUser(editing, {
      name: editForm.name.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim() || null,
      student_class: editForm.student_class?.trim() || null,
      student_group: editForm.student_group?.trim() || null,
    });
    setSaving(false);
    if (r.success) {
      setSuccess("Data siswa berhasil diperbarui.");
      setEditing(null); setEditForm({});
      await fetchData();
    } else {
      setError(r.message);
    }
  };
  const cancelEdit = () => { setEditing(null); setEditForm({}); };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {error && msgBox(error, "err", () => setError(""))}
          {success && msgBox(success, "ok", () => setSuccess(""))}

          {loading ? (
            <div className="welcome-card">
              <h1 style={{ fontSize: 18, marginBottom: 12 }}>Manajemen Siswa</h1>
              <TableSkeleton rows={4} cols={6} />
            </div>
          ) : (
            <div className="welcome-card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                <div>
                  <h2 style={{ fontSize: 17, marginBottom: 4 }}>Daftar Siswa Terdaftar</h2>
                  <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 0 }}>
                    {students.length} siswa
                  </p>
                </div>
                <div style={{ display: "flex", gap: 8 }}>
                  <button className="btn-primary" onClick={() => setShowAdd(true)}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    <Icon name="person" size={14} /> Tambah Siswa
                  </button>
                  <button className="btn-primary" onClick={() => navigate("/admin/import-siswa")}
                    style={{ display: "flex", alignItems: "center", gap: 6, background: "linear-gradient(135deg, #28a745, #1e7e34)", borderColor: "#2d8a4e" }}>
                    <Icon name="save" size={14} /> Import Excel
                  </button>
                </div>
              </div>

              <div className="toolbar">
                <input className="toolbar-search" type="text" placeholder="Cari nama, username, email..."
                  value={search} onChange={(e) => setSearch(e.target.value)} />
                <select className="toolbar-filter" value={kelasFilter} onChange={(e) => setKelasFilter(e.target.value)}>
                  <option value="">Semua Kelas</option>
                  {distinctKelas.map((k) => <option key={k} value={k}>{k}</option>)}
                </select>
                <span className="toolbar-info">{filtered.length} siswa</span>
              </div>

              {filtered.length === 0 ? (
                <p style={{ textAlign: "center", color: "#9a7a30", fontSize: 13, padding: "20px 0" }}>
                  {students.length === 0 ? "Belum ada siswa terdaftar." : "Tidak ada hasil untuk pencarian ini."}
                </p>
              ) : (
                <div className="table-wrap">
                  <table className="approval-table">
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Username</th>
                        <th>Password</th>
                        <th>Email</th>
                        <th>Kelas</th>
                        <th>Kelompok</th>
                        <th>Status</th>
                        <th>Tgl Daftar</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((u, i) => (
                        <tr key={u.id}>
                          <td>{i + 1}</td>
                          <td className="td-name">{u.name}</td>
                          <td>@{u.username}</td>
                          <td style={{ fontSize: 11, fontFamily: "monospace", color: "#5a3a00" }}>{u.password_shown || "—"}</td>
                          <td style={{ fontSize: 12, color: "#7a5a20" }}>{u.email || "-"}</td>
                          <td>{u.student_class || "-"}</td>
                          <td>{u.student_group || "-"}</td>
                          <td>
                            <span style={{
                              display: "inline-block", padding: "2px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                              background: u.status === "approved" ? "rgba(30,80,16,0.1)" : u.status === "pending" ? "rgba(253,126,20,0.1)" : "rgba(208,53,53,0.1)",
                              color: u.status === "approved" ? "#1e5010" : u.status === "pending" ? "#cc7a00" : "#b02020",
                              border: `1px solid ${
                                u.status === "approved" ? "rgba(30,80,16,0.2)" : u.status === "pending" ? "rgba(253,126,20,0.3)" : "rgba(208,53,53,0.2)"
                              }`,
                            }}>
                              {u.status === "approved" ? "Aktif" : u.status === "pending" ? "Pending" : "Ditolak"}
                            </span>
                          </td>
                          <td className="td-date">{formatDate(u.created_at)}</td>
                          <td className="td-actions">
                            <button className="action-btn" title="Edit"
                              onClick={() => openEdit(u)}
                              disabled={actionLoading === u.id}
                              style={{ color: "#b89440", border: "1px solid #e0c878" }}>
                              <Icon name="edit" size={15} />
                            </button>
                            <button className="action-btn" title="Hapus"
                              onClick={() => handleDelete(u.id, u.name)}
                              disabled={actionLoading === u.id}
                              style={{ color: "#cc0033", border: "1px solid #f5a0a0" }}>
                              <Icon name="trash" size={15} />
                            </button>
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

      {showAdd && (
        <ModalTambahSiswa
          saving={saving}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {editing && (
        <ModalEditSiswa
          editForm={editForm}
          saving={saving}
          onClose={cancelEdit}
          onSave={saveEdit}
          onChange={(f) => setEditForm(f)}
        />
      )}
    </div>
  );
}

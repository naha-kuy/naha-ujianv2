import { useState, useEffect, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
  getCurrentUser, logout,
  getPendingTeachers, approveUser, rejectUser,
  getRegisteredTeachers, deleteUser, updateUser, createTeacher,
} from "../../controllers/AuthController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";
import ModalEditGuru from "../components/modal/ModalEditGuru";
import ModalTambahGuru from "../components/modal/ModalTambahGuru";
import { useNotification } from "../../contexts/NotificationContext";

function formatDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", {
    year: "numeric", month: "short", day: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

export default function AdminGuru() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const notif = useNotification();
  const [pending, setPending] = useState([]);
  const [registered, setRegistered] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);

  // pending search
  const [searchP, setSearchP] = useState("");
  // registered search
  const [searchR, setSearchR] = useState("");

  // add modal
  const [showAdd, setShowAdd] = useState(false);

  // edit modal
  const [editing, setEditing] = useState(null);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);

  const handleLogout = () => { logout(); navigate("/"); };

  const handleAdd = async (form) => {
    setSaving(true);
    const r = await createTeacher(form);
    setSaving(false);
    if (r.success) {
      notif.addNotification("success", `Guru "${form.name}" berhasil ditambahkan!`);
      setShowAdd(false);
      await fetchData();
    } else {
      notif.addNotification("error", r.message);
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [p, r] = await Promise.all([getPendingTeachers(), getRegisteredTeachers()]);
    if (p.success) setPending(p.data); else notif.addNotification("error", p.message);
    if (r.success) setRegistered(r.data); else notif.addNotification("error", r.message);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const filteredPending = useMemo(() => {
    if (!searchP.trim()) return pending;
    const q = searchP.toLowerCase();
    return pending.filter((u) =>
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [pending, searchP]);

  const filteredRegistered = useMemo(() => {
    if (!searchR.trim()) return registered;
    const q = searchR.toLowerCase();
    return registered.filter((u) =>
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q)
    );
  }, [registered, searchR]);

  const act = async (id, fn, msg) => {
    setActionLoading(id);
    const r = await fn(id);
    setActionLoading(null);
    if (r.success) {
      notif.addNotification("success", msg);
      setPending((prev) => prev.filter((u) => u.id !== id));
    } else {
      notif.addNotification("error", r.message);
    }
  };

  // pending bulk
  const [selectedPending, setSelectedPending] = useState(new Set());
  const toggleSelP = (id) => {
    setSelectedPending((prev) => {
      const n = new Set(prev);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
  };
  const toggleAllP = () => {
    if (selectedPending.size === filteredPending.length) setSelectedPending(new Set());
    else setSelectedPending(new Set(filteredPending.map((u) => u.id)));
  };
  const bulkPendingApprove = async () => {
    let ok = 0, fail = 0;
    for (const id of selectedPending) {
      const r = await approveUser(id);
      if (r.success) ok++; else fail++;
    }
    setPending((prev) => prev.filter((u) => !selectedPending.has(u.id)));
    if (fail === 0) notif.addNotification("success", `${ok} guru berhasil disetujui!`);
    else notif.addNotification("error", `${ok} berhasil, ${fail} gagal.`);
    setSelectedPending(new Set());
    await fetchData();
  };
  const bulkPendingReject = async () => {
    let ok = 0, fail = 0;
    for (const id of selectedPending) {
      const r = await rejectUser(id);
      if (r.success) ok++; else fail++;
    }
    setPending((prev) => prev.filter((u) => !selectedPending.has(u.id)));
    if (fail === 0) notif.addNotification("success", `${ok} pendaftaran ditolak.`);
    else notif.addNotification("error", `${ok} berhasil, ${fail} gagal.`);
    setSelectedPending(new Set());
  };

  // delete registered teacher
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Hapus guru "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;
    setActionLoading(id);
    const r = await deleteUser(id);
    setActionLoading(null);
    if (r.success) {
      notif.addNotification("success", `Guru "${name}" berhasil dihapus.`);
      setRegistered((prev) => prev.filter((u) => u.id !== id));
    } else {
      notif.addNotification("error", r.message);
    }
  };

  // edit registered teacher
  const openEdit = (teacher) => {
    setEditing(teacher.id);
    setEditForm({ name: teacher.name || "", username: teacher.username || "", email: teacher.email || "", mata_pelajaran: teacher.mata_pelajaran || "" });
  };
  const saveEdit = async () => {
    if (!editForm.name.trim() || !editForm.username.trim()) {
      notif.addNotification("error", "Nama dan username wajib diisi.");
      return;
    }
    setSaving(true);
    const r = await updateUser(editing, {
      name: editForm.name.trim(),
      username: editForm.username.trim(),
      email: editForm.email.trim() || null,
      mata_pelajaran: editForm.mata_pelajaran?.trim() || null,
    });
    setSaving(false);
    if (r.success) {
      notif.addNotification("success", "Data guru berhasil diperbarui.");
      setEditing(null);
      setEditForm({});
      await fetchData();
    } else {
      notif.addNotification("error", r.message);
    }
  };
  const cancelEdit = () => { setEditing(null); setEditForm({}); };

  if (loading) {
    return (
      <div className="dash-layout">
        <AdminSidebar userName={user?.name} onLogout={handleLogout} />
        <main className="dash-main">
          <div className="dash-content">
            <div className="welcome-card">
              <h1 style={{ fontSize: 18, marginBottom: 12 }}>Kelola Guru</h1>
              <TableSkeleton rows={4} cols={6} />
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {/* ───── Section 1: Pending Teachers ───── */}
          <div className="welcome-card" style={{ padding: "16px 20px", marginBottom: 24 }}>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Calon Guru — Menunggu Persetujuan</h2>
            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 12 }}>
              {pending.length} guru menunggu persetujuan
            </p>

            <div className="toolbar">
              <input className="toolbar-search" type="text" placeholder="Cari nama, username, email..."
                value={searchP} onChange={(e) => setSearchP(e.target.value)} />
            </div>
            {selectedPending.size > 0 && (
              <div className="toolbar-actions">
                <button className="page-btn" style={{ color: "#2e7d32", borderColor: "#a5d6a7" }}
                  onClick={bulkPendingApprove}>
                  <Icon name="check" size={14} /> Setujui ({selectedPending.size})
                </button>
                <button className="page-btn" style={{ color: "#cc0033", borderColor: "#f5a0a0" }}
                  onClick={bulkPendingReject}>
                  <Icon name="x" size={14} /> Tolak ({selectedPending.size})
                </button>
              </div>
            )}

            {filteredPending.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9a7a30", fontSize: 13, padding: "20px 0" }}>
                {pending.length === 0 ? "Semua guru sudah diproses." : "Tidak ada hasil untuk pencarian ini."}
              </p>
            ) : (
              <div className="table-wrap">
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th style={{ width: 36 }}>
                        <input type="checkbox" className="select-all" checked={filteredPending.length > 0 && selectedPending.size === filteredPending.length}
                          onChange={toggleAllP} />
                      </th>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Mata Pelajaran</th>
                      <th>Tgl Daftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredPending.map((u, i) => (
                      <tr key={u.id} style={{ background: selectedPending.has(u.id) ? "rgba(206,173,106,0.08)" : "transparent" }}>
                        <td>
                          <input type="checkbox" className="select-all" checked={selectedPending.has(u.id)}
                            onChange={() => toggleSelP(u.id)} />
                        </td>
                        <td>{i + 1}</td>
                        <td className="td-name">{u.name}</td>
                        <td>@{u.username}</td>
                        <td style={{ fontSize: 12, color: "#7a5a20" }}>{u.email || "-"}</td>
                        <td>{u.mata_pelajaran || "-"}</td>
                        <td className="td-date">{formatDate(u.created_at)}</td>
                        <td className="td-actions">
                          <button className="action-btn action-approve" title="Setujui"
                            onClick={() => act(u.id, approveUser, "Guru berhasil disetujui!")}
                            disabled={actionLoading === u.id}><Icon name="check" size={16} /></button>
                          <button className="action-btn action-reject" title="Tolak"
                            onClick={() => act(u.id, rejectUser, "Pendaftaran ditolak.")}
                            disabled={actionLoading === u.id}><Icon name="x" size={16} /></button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* ───── Section 2: Registered Teachers ───── */}
          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <h2 style={{ fontSize: 17, marginBottom: 4 }}>Daftar Guru Terdaftar</h2>
                <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 0 }}>
                  {registered.length} guru aktif
                </p>
              </div>
              <button className="btn-primary" onClick={() => setShowAdd(true)}
                style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="people" size={14} /> Tambah Guru
              </button>
            </div>

            <div className="toolbar">
              <input className="toolbar-search" type="text" placeholder="Cari nama, username, email..."
                value={searchR} onChange={(e) => setSearchR(e.target.value)} />
            </div>

            {filteredRegistered.length === 0 ? (
              <p style={{ textAlign: "center", color: "#9a7a30", fontSize: 13, padding: "20px 0" }}>
                {registered.length === 0 ? "Belum ada guru terdaftar." : "Tidak ada hasil untuk pencarian ini."}
              </p>
            ) : (
              <div className="table-wrap">
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th>No</th>
                      <th>Nama</th>
                      <th>Username</th>
                      <th>Email</th>
                      <th>Mata Pelajaran</th>
                      <th>Tgl Daftar</th>
                      <th>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRegistered.map((u, i) => (
                      <tr key={u.id}>
                        <td>{i + 1}</td>
                        <td className="td-name">{u.name}</td>
                        <td>@{u.username}</td>
                        <td style={{ fontSize: 12, color: "#7a5a20" }}>{u.email || "-"}</td>
                        <td>{u.mata_pelajaran || "-"}</td>
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
        </div>
      </main>

      {showAdd && (
        <ModalTambahGuru
          saving={saving}
          onClose={() => setShowAdd(false)}
          onSave={handleAdd}
        />
      )}

      {editing && (
        <ModalEditGuru
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
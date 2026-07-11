import { useState } from "react";
import Icon from "../Icon";

export default function ModalTambahGuru({ saving, onClose, onSave }) {
  const [form, setForm] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    mata_pelajaran: "",
  });

  const [error, setError] = useState("");

  const update = (field, value) => setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = () => {
    setError("");
    if (!form.name.trim() || !form.username.trim() || !form.password.trim()) {
      setError("Nama, username, dan password wajib diisi");
      return;
    }
    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    onSave(form);
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 460 }}>
        <div className="modal-head">
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, #cead6a, #b89440)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontWeight: 800, fontSize: 15, color: "#2a1200",
            }}>
              <Icon name="people" size={18} />
            </div>
            <div>
              <h3 style={{ fontSize: 14, margin: 0 }}>Tambah Guru Baru</h3>
              <span style={{ fontSize: 10, color: "#9a7a30" }}>Buat akun guru secara manual</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {error && (
            <div style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "8px 12px", fontSize: 11, color: "#b02020", textAlign: "center", fontWeight: 600 }}>{error}</div>
          )}

          <div className="input-wrap">
            <label>Nama Lengkap <span style={{ color: "#cc0033" }}>*</span></label>
            <input type="text" value={form.name} onChange={(e) => update("name", e.target.value)}
              placeholder="Nama lengkap guru" />
          </div>

          <div style={{ display: "flex", gap: 12 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Username <span style={{ color: "#cc0033" }}>*</span></label>
              <input type="text" value={form.username} onChange={(e) => update("username", e.target.value)}
                placeholder="username" autoComplete="off" />
            </div>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Password <span style={{ color: "#cc0033" }}>*</span></label>
              <input type="password" value={form.password} onChange={(e) => update("password", e.target.value)}
                placeholder="Min 6 karakter" />
            </div>
          </div>

          <div className="input-wrap">
            <label>Email <span style={{ fontWeight: 400, color: "#aaa" }}>(opsional)</span></label>
            <input type="email" value={form.email} onChange={(e) => update("email", e.target.value)}
              placeholder="guru@sekolah.sch.id" />
          </div>

          <div className="input-wrap">
            <label>Mata Pelajaran <span style={{ fontWeight: 400, color: "#aaa" }}>(opsional)</span></label>
            <input type="text" value={form.mata_pelajaran} onChange={(e) => update("mata_pelajaran", e.target.value)}
              placeholder="Matematika, Fisika, ..." />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving && <span className="t-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {saving ? "Menyimpan..." : <><Icon name="save" size={14} /> Tambah Guru</>}
          </button>
        </div>
      </div>
    </div>
  );
}
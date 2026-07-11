import Icon from "../Icon";

export default function ModalEditSiswa({ editForm, saving, onClose, onSave, onChange }) {
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
              {editForm.name?.charAt(0)?.toUpperCase() || "?"}
            </div>
            <div>
              <h3 style={{ fontSize: 14, margin: 0 }}>Edit Data Siswa</h3>
              <span style={{ fontSize: 10, color: "#9a7a30" }}>Perbarui informasi akun siswa</span>
            </div>
          </div>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="input-wrap">
            <label>Nama Lengkap</label>
            <input type="text" value={editForm.name}
              onChange={(e) => onChange({ ...editForm, name: e.target.value })}
              placeholder="Nama lengkap siswa" />
          </div>
          <div className="input-wrap">
            <label>Username</label>
            <input type="text" value={editForm.username}
              onChange={(e) => onChange({ ...editForm, username: e.target.value })}
              placeholder="username" />
          </div>
          <div className="input-wrap">
            <label>Email</label>
            <input type="email" value={editForm.email}
              onChange={(e) => onChange({ ...editForm, email: e.target.value })}
              placeholder="siswa@sekolah.sch.id" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Kelas</label>
              <select value={editForm.kelas || ""}
                onChange={(e) => onChange({ ...editForm, kelas: e.target.value })}
                style={{ width: "100%" }}>
                <option value="">-- Pilih --</option>
                {["1","2","3","4","5","6","7","8","9","10","11","12"].map((k) =>
                  <option key={k} value={k}>{k}</option>
                )}
              </select>
            </div>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Kelompok</label>
              <input type="text" value={editForm.student_group || ""}
                onChange={(e) => onChange({ ...editForm, student_group: e.target.value })}
                placeholder="A" />
            </div>
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={onSave} disabled={saving} style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {saving && <span className="t-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
            {saving ? "Menyimpan..." : "Simpan Perubahan"}
          </button>
        </div>
      </div>
    </div>
  );
}

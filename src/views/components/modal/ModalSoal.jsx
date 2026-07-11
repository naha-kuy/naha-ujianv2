import Icon from "../Icon";

export default function ModalSoal({ editId, form, saving, distinctKelas, onClose, onSave, onChange }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <h3>{editId ? "Edit Soal" : "Tambah Bank Soal"}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          {editId && (
            <div className="input-wrap">
              <label>Kode Soal</label>
              <input type="text" value={form.kode_soal} disabled placeholder="Otomatis" />
            </div>
          )}
          <div className="input-wrap">
            <label>Nama Soal *</label>
            <input type="text" value={form.nama_soal} onChange={(e) => onChange({ ...form, nama_soal: e.target.value })} placeholder="Ujian Matematika" />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Mapel *</label>
              <input type="text" value={form.mapel} onChange={(e) => onChange({ ...form, mapel: e.target.value })} placeholder="Matematika" />
            </div>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Kelas {!form.semua_kelas ? '*' : ''}</label>
              <select value={form.kelas} onChange={(e) => onChange({ ...form, kelas: e.target.value })}
                disabled={form.semua_kelas} style={form.semua_kelas ? { opacity: 0.5 } : {}}>
                <option value="">{form.semua_kelas ? "Semua Kelas" : "Pilih"}</option>
                {!form.semua_kelas && [...new Set([...distinctKelas, "1","2","3","4","5","6","7","8","9","10","11","12"])].sort((a,b) => {
                  const na = parseInt(a), nb = parseInt(b);
                  return isNaN(na) || isNaN(nb) ? a.localeCompare(b) : na - nb;
                }).map((k) => <option key={k} value={k}>{k}</option>)}
              </select>
            </div>
          </div>
          <div className="input-wrap">
            <label>Durasi (menit) *</label>
            <input type="number" min={1} value={form.waktu_ujian} onChange={(e) => onChange({ ...form, waktu_ujian: e.target.value })} />
          </div>
          <div style={{ display: "flex", gap: 12 }}>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Tampilan Soal</label>
              <select value={form.tampilan_soal} onChange={(e) => onChange({ ...form, tampilan_soal: e.target.value })}>
                <option value="Urut">Urut</option>
                <option value="Acak">Acak</option>
              </select>
            </div>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Tampilan Opsi</label>
              <select value={form.tampilan_jawaban} onChange={(e) => onChange({ ...form, tampilan_jawaban: e.target.value })}>
                <option value="Urut">Urut</option>
                <option value="Acak">Acak</option>
              </select>
            </div>
          </div>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap", justifyContent: "center" }}>
            {[
              { key: "token_required", label: "Wajib Token", icon: "lock", checked: form.token_required,
                onChange: (v) => onChange({ ...form, token_required: v }) },
              { key: "semua_kelas", label: "Semua Kelas", icon: "people", checked: form.semua_kelas,
                onChange: (v) => onChange({ ...form, semua_kelas: v, kelas: v ? "" : form.kelas }) },
              { key: "tanggal_unlimited", label: "Tanpa Batas Tanggal", icon: "zap", checked: form.tanggal_unlimited,
                onChange: (v) => onChange({ ...form, tanggal_unlimited: v }) },
            ].map((opt) => (
              <label key={opt.key} className={`toggle-chip ${opt.checked ? "toggle-chip-on" : ""}`}>
                <Icon name={opt.icon} size={14} />
                <span>{opt.label}</span>
                <div className={`toggle-switch ${opt.checked ? "toggle-switch-on" : ""}`}>
                  <div className="toggle-knob" />
                </div>
                <input type="checkbox" checked={opt.checked}
                  onChange={(e) => opt.onChange(e.target.checked)}
                  style={{ display: "none" }} />
              </label>
            ))}
          </div>
          {!form.tanggal_unlimited && (
            <div className="input-wrap">
              <label>Tanggal Ujian</label>
              <input type="date" value={form.tanggal} onChange={(e) => onChange({ ...form, tanggal: e.target.value })} />
            </div>
          )}
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Menyimpan..." : "Simpan"}
          </button>
        </div>
      </div>
    </div>
  );
}

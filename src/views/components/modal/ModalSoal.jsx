import Icon from "../Icon";

export default function ModalSoal({ editId, form, saving, distinctKelas, onClose, onSave, onChange }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 520 }}>
        <div className="modal-head">
          <h3>{editId ? "Edit Soal" : "Tambah Soal"}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: 14 }}>
          <div className="input-wrap">
            <label>Kode Soal *</label>
            <input type="text" value={form.kode_soal} onChange={(e) => onChange({ ...form, kode_soal: e.target.value })}
              disabled={!!editId} placeholder="Misal: MTK-01" />
          </div>
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
              <label>Kelas *</label>
              <select value={form.kelas} onChange={(e) => onChange({ ...form, kelas: e.target.value })}>
                <option value="">Pilih</option>
                {[...new Set([...distinctKelas, "X", "XI", "XII"])].sort().map((k) => <option key={k} value={k}>{k}</option>)}
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
          <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#5a3a00" }}>
              <input type="checkbox" checked={form.token_required}
                onChange={(e) => onChange({ ...form, token_required: e.target.checked })}
                style={{ accentColor: "#b89440" }} />
              Wajib Token
            </label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 12, fontWeight: 600, color: "#5a3a00" }}>
              <input type="checkbox" checked={form.tanggal_unlimited}
                onChange={(e) => onChange({ ...form, tanggal_unlimited: e.target.checked })}
                style={{ accentColor: "#b89440" }} />
              Unlimited (tanpa batas tanggal)
            </label>
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

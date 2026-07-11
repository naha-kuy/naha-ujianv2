import Icon from "../Icon";

export default function ModalDuplicateSoal({ showDup, dupKode, saving, onClose, onSave, onKodeChange }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-head">
          <h3>Duplikasi Soal</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body">
          <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 12 }}>
            Duplikasi dari <strong>{showDup}</strong>
          </p>
          <div className="input-wrap">
            <label>Kode Soal Baru *</label>
            <input type="text" value={dupKode} onChange={(e) => onKodeChange(e.target.value.toUpperCase())} placeholder="Contoh: MTK-01-Copy" />
          </div>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={onSave} disabled={saving}>
            {saving ? "Menduplikasi..." : "Duplikasi"}
          </button>
        </div>
      </div>
    </div>
  );
}

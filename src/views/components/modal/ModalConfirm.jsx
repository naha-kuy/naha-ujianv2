import Icon from "../Icon";

export default function ModalConfirm({ show, title, message, saving, onClose, onConfirm, confirmLabel = "Hapus" }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 380 }}>
        <div className="modal-head">
          <h3>{title || "Konfirmasi"}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: "center", fontSize: 13, color: "#5a3a00" }}>
          <Icon name="warning" size={32} style={{ color: "#cc0033", marginBottom: 8 }} />
          <p>{message}</p>
          <p style={{ fontSize: 11, color: "#9a7a30", marginTop: 4 }}>Tindakan ini tidak bisa dibatalkan.</p>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-danger" onClick={onConfirm} disabled={saving}>
            {saving ? "Memproses..." : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}

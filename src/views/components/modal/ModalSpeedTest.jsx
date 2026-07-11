import Icon from "../Icon";

export default function ModalSpeedTest({ show, onClose }) {
  if (!show) return null;
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
        <div className="modal-head">
          <h3>Test Kecepatan Internet</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ textAlign: "center", fontSize: 13, color: "#5a3a00" }}>
          <div style={{ fontSize: 36, marginBottom: 10 }}>🌐</div>
          <p>Anda akan diarahkan ke <strong>fast.com</strong> untuk mengecek kecepatan internet.</p>
          <p style={{ fontSize: 11, color: "#9a7a30", marginTop: 6 }}>Fast.com adalah layanan speed test dari Netflix.</p>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Batal</button>
          <button className="btn-primary" onClick={() => { window.open("https://fast.com", "_blank"); onClose(); }}>
            Buka fast.com
          </button>
        </div>
      </div>
    </div>
  );
}

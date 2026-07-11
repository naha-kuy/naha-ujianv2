import Icon from "../Icon";

function fmtDate(d) {
  if (!d) return "-";
  return new Date(d).toLocaleDateString("id-ID", { year: "numeric", month: "short", day: "numeric" });
}

export default function ModalPreviewSoal({ soal, onClose }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="modal-head">
          <h3>Preview Soal</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ fontSize: 13, lineHeight: 1.6 }}>
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <tbody>
              {[
                ["Kode Soal", soal.kode_soal],
                ["Nama Soal", soal.nama_soal],
                ["Mapel", soal.mapel],
                ["Kelas", soal.semua_kelas ? "Semua Kelas" : soal.kelas],
                ["Durasi", `${soal.waktu_ujian} menit`],
                ["Tampilan", soal.tampilan_soal],
                ["Tanggal", fmtDate(soal.tanggal)],
                ["Status", soal.status],
                ["Token", soal.token || "-"],
                ["Jumlah Butir", `${soal.jumlah_butir} soal`],
              ].map(([l, v]) => (
                <tr key={l}>
                  <td style={{ padding: "6px 12px", fontWeight: 600, color: "#5a3a00", width: 140, borderBottom: "1px solid #f0e0c0" }}>{l}</td>
                  <td style={{ padding: "6px 12px", borderBottom: "1px solid #f0e0c0" }}>{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="modal-foot">
          <button className="btn-cancel" onClick={onClose}>Tutup</button>
        </div>
      </div>
    </div>
  );
}

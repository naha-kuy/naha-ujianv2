import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { verifyExam, verifikasiTokenDanMulai } from "../../controllers/ExamController";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

export default function SiswaKonfirmasiUjian() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode_soal = params.get("kode_soal");
  const handleLogout = () => { logout(); navigate("/"); };

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [data, setData] = useState(null);
  const [sesiAktif, setSesiAktif] = useState(null);
  const [token, setToken] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [agreed, setAgreed] = useState(false);

  useEffect(() => {
    if (!kode_soal) { navigate("/siswa/ujian"); return; }
    (async () => {
      setLoading(true);
      const r = await verifyExam(kode_soal);
      if (r.success) {
        setData(r.data);
        setSesiAktif(r.data.sesi_aktif);
      } else {
        setError(r.message);
      }
      setLoading(false);
    })();
  }, [kode_soal, navigate]);

  const handleMulai = async (reset = false) => {
    if (!data) return;
    setVerifying(true);
    setError("");

    const r = await verifikasiTokenDanMulai(kode_soal, token, reset);
    if (r.success) {
      navigate(`/siswa/ujian/mulai?kode_soal=${kode_soal}`);
    } else {
      setError(r.message);
    }
    setVerifying(false);
  };

  // Detect reset from sesi_aktif
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (sesiAktif) {
      setShowResetConfirm(true);
    } else {
      handleMulai(false);
    }
  };

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {error && (
            <div style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>
              <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> {error}
            </div>
          )}

          {loading ? (
            <div className="welcome-card"><TableSkeleton rows={4} cols={2} /></div>
          ) : data ? (
            <div className="welcome-card" style={{ padding: "20px 24px" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <button onClick={() => navigate("/siswa/ujian")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b89440", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                    <Icon name="chevron-left" size={14} /> Kembali ke Daftar Ujian
                  </button>
                  <h2 style={{ fontSize: 17, display: "flex", alignItems: "center", gap: 8 }}>
                    <Icon name="books" size={20} /> Konfirmasi Ujian
                  </h2>
                </div>
              </div>

              {sesiAktif && (
                <div style={{
                  background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: 8,
                  padding: "10px 14px", fontSize: 12, color: "#856404", fontWeight: 600, marginBottom: 12,
                }}>
                  <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
                  Anda memiliki sesi ujian yang belum selesai. Melanjutkan akan mereset waktu ujian, jawaban tetap tersimpan.
                </div>
              )}

              {/* Data Siswa */}
              <h5 style={{ fontSize: 13, marginBottom: 8, color: "#5a3a00" }}>Data Siswa</h5>
              <table className="approval-table" style={{ fontSize: 12, marginBottom: 16 }}>
                <tbody>
                  <tr><td style={{ width: "30%", color: "#9a7a30" }}>Nama</td><td><strong>{user?.name}</strong></td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Username</td><td>{user?.username}</td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Kelas</td><td>{user?.kelas || "-"}</td></tr>
                </tbody>
              </table>

              {/* Data Soal */}
              <h5 style={{ fontSize: 13, marginBottom: 8, color: "#5a3a00" }}>Data Soal</h5>
              <table className="approval-table" style={{ fontSize: 12, marginBottom: 16 }}>
                <tbody>
                  <tr><td style={{ width: "30%", color: "#9a7a30" }}>Kode Soal</td><td><strong>{data.soal.kode_soal}</strong></td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Nama Soal</td><td>{data.soal.nama_soal}</td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Mapel</td><td>{data.soal.mapel}</td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Tanggal</td><td>{data.soal.tanggal_unlimited ? "Unlimited" : data.soal.tanggal}</td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Durasi</td><td>{data.soal.waktu_ujian} menit</td></tr>
                  <tr><td style={{ color: "#9a7a30" }}>Jumlah Soal</td><td>{data.jumlah_soal} butir</td></tr>
                </tbody>
              </table>

              {/* Token & Mulai */}
              <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12, alignItems: "flex-start" }}>
                {data.soal.token_required && (
                  <div className="input-wrap" style={{ width: "100%", maxWidth: 300 }}>
                    <label>Token Ujian</label>
                    <input type="text" value={token} onChange={(e) => setToken(e.target.value)}
                      placeholder="Masukkan token" required style={{ fontSize: 16, letterSpacing: 4, textTransform: "uppercase" }} />
                  </div>
                )}

                <label style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                  <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} required />
                  Saya siap mengerjakan ujian ini secara jujur dan bertanggung jawab.
                </label>

                <div style={{ display: "flex", gap: 8 }}>
                  <button type="submit" className="btn-success" disabled={verifying || !agreed}
                    style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {verifying && <span className="t-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                    <Icon name="books" size={14} /> Mulai Ujian
                  </button>
                  <button type="button" className="btn-cancel" onClick={() => navigate("/siswa/ujian")}>
                    Batal
                  </button>
                </div>
              </form>
            </div>
          ) : null}

          {/* Reset Confirmation Modal */}
          {showResetConfirm && (
            <div className="modal-backdrop" onClick={() => setShowResetConfirm(false)}>
              <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 420 }}>
                <div className="modal-head">
                  <h3 style={{ fontSize: 14, margin: 0 }}>Ujian Masih Aktif!</h3>
                  <button className="modal-close" onClick={() => setShowResetConfirm(false)}><Icon name="x" size={18} /></button>
                </div>
                <div className="modal-body" style={{ fontSize: 12, lineHeight: 1.6 }}>
                  <p>Anda memiliki sesi ujian yang belum selesai.</p>
                  <p style={{ color: "#cc0033", fontWeight: 600 }}>Melanjutkan akan mereset waktu ujian. Jawaban yang sudah disimpan akan tetap ada.</p>
                </div>
                <div className="modal-foot">
                  <button className="btn-cancel" onClick={() => setShowResetConfirm(false)}>Batal</button>
                  <button className="btn-success" onClick={() => { setShowResetConfirm(false); handleMulai(true); }}
                    disabled={verifying}>
                    {verifying ? "Memproses..." : "Ya, Reset & Lanjutkan"}
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
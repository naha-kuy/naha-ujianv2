import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { getResultDetail } from "../../controllers/ExamController";
import { useNotification } from "../../contexts/NotificationContext";
import SiswaSidebar from "../components/sidebars/SiswaSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

export default function SiswaPreviewHasil() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode_soal = params.get("kode_soal");
  const handleLogout = () => { logout(); navigate("/"); };

  const [loading, setLoading] = useState(true);
  const notif = useNotification();
  const [data, setData] = useState(null);
  const [activePage, setActivePage] = useState("result");

  useEffect(() => {
    if (!kode_soal) { navigate("/siswa/hasil"); return; }

    (async () => {
      setLoading(true);
      const r = await getResultDetail(kode_soal);
      if (r.success) {
        setData(r.data);
      } else {
        notif.addNotification("error", r.message);
      }
      setLoading(false);
    })();
  }, [kode_soal, navigate]);

  if (!kode_soal) return null;

  return (
    <div className="dash-layout">
      <SiswaSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {loading ? (
            <div className="welcome-card"><TableSkeleton rows={4} cols={2} /></div>
          ) : data ? (
            <>
              {/* Result Summary Card */}
              <div className="welcome-card" style={{ padding: "20px 24px", marginBottom: 16 }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
                  <div>
                    <button onClick={() => navigate("/siswa/hasil")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b89440", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                      <Icon name="chevron-left" size={14} /> Kembali ke Hasil
                    </button>
                    <h2 style={{ fontSize: 17 }}>Detail Hasil Ujian</h2>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                    <button className={`page-btn ${activePage === "result" ? "active" : ""}`} onClick={() => setActivePage("result")}
                      style={{ fontSize: 11 }}>Nilai</button>
                    <button className={`page-btn ${activePage === "detail" ? "active" : ""}`} onClick={() => setActivePage("detail")}
                      style={{ fontSize: 11 }}>Detail Jawaban</button>
                  </div>
                </div>

                {/* Result View */}
                {activePage === "result" ? (
                  <div>
                    <div style={{ display: "flex", gap: 16, flexWrap: "wrap", marginBottom: 16 }}>
                      {[
                        { label: "Kode Soal", val: data.result.kode_soal, color: "#5a3a00" },
                        { label: "Nilai", val: data.result.nilai, color: data.result.nilai >= 70 ? "#28a745" : data.result.nilai >= 40 ? "#fd7e14" : "#cc0033", big: true },
                        { label: "Benar", val: data.result.jumlah_benar, color: "#28a745" },
                        { label: "Salah", val: data.result.jumlah_salah, color: "#cc0033" },
                        { label: "Total Soal", val: data.result.jumlah_soal, color: "#17a2b8" },
                      ].map((s) => (
                        <div key={s.label} style={{
                          flex: 1, minWidth: 100, background: "white", borderRadius: 12,
                          border: "1px solid #e8d8a8", padding: "14px 18px", textAlign: "center",
                        }}>
                          <div style={{ fontSize: s.big ? 32 : 22, fontWeight: 800, color: s.color }}>{s.val}</div>
                          <div style={{ fontSize: 10, fontWeight: 600, color: "#9a7a30", marginTop: 2 }}>{s.label}</div>
                        </div>
                      ))}
                    </div>

                    {data.result.status_nilai === "uraian" && (
                      <div style={{
                        background: "rgba(255,193,7,0.1)", border: "1px solid rgba(255,193,7,0.3)", borderRadius: 8,
                        padding: "10px 14px", fontSize: 12, color: "#856404", fontWeight: 600,
                      }}>
                        Nilai belum final. Soal uraian sedang menunggu koreksi guru.
                      </div>
                    )}
                  </div>
                ) : (
                  /* Detail Jawaban */
                  <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {data.questions.map((q) => {
                      const jawab = data.result.jawaban?.[q.nomer_soal];
                      const kunci = q.jawaban_benar;

                      const getJawabDisplay = () => {
                        if (!jawab || jawab === "") return <span style={{ color: "#9a7a30", fontStyle: "italic" }}>Tidak dijawab</span>;
                        if (typeof jawab === "string") {
                          if (q.tipe_soal === "Pilihan Ganda" || q.tipe_soal === "Pilihan Ganda Kompleks") {
                            return jawab.replace("pilihan_", "Pilihan ");
                          }
                          return jawab;
                        }
                        if (Array.isArray(jawab)) {
                          return jawab.map((j) => j.replace("pilihan_", "")).join(", ");
                        }
                        if (typeof jawab === "object") {
                          return Object.entries(jawab).map(([k, v]) => `${k}: ${v}`).join(" | ");
                        }
                        return JSON.stringify(jawab);
                      };

                      const getKunciDisplay = () => {
                        if (!kunci) return "-";
                        if (q.tipe_soal === "Pilihan Ganda" || q.tipe_soal === "Pilihan Ganda Kompleks") {
                          return kunci.replace("pilihan_", "Pilihan ").replace(/[\[\]]/g, "");
                        }
                        if (q.tipe_soal === "Menjodohkan") {
                          return kunci.replace(/[\[\]]/g, "").split("|").join(", ");
                        }
                        return kunci;
                      };

                      const isTrue = () => {
                        if (!jawab || jawab === "" || !kunci) return null;
                        if (q.tipe_soal === "Pilihan Ganda") {
                          const j = String(jawab).replace("pilihan_", "");
                          const k = String(kunci).replace("pilihan_", "");
                          return j === k;
                        }
                        if (q.tipe_soal === "Pilihan Ganda Kompleks") {
                          const jSet = new Set(Array.isArray(jawab) ? jawab.map((j) => j.replace("pilihan_", "")) : [String(jawab).replace("pilihan_", "")]);
                          const kSet = new Set((kunci || "").replace(/[\[\]]/g, "").split("|").map((s) => s.trim().replace("pilihan_", "")));
                          if (jSet.size !== kSet.size) return false;
                          for (const v of jSet) if (!kSet.has(v)) return false;
                          return true;
                        }
                        if (q.tipe_soal === "Uraian") return "uraian";
                        return null;
                      };

                      const benar = isTrue();
                      return (
                        <div key={q.id_soal} style={{
                          border: `1px solid ${benar === true ? "#a5d6a7" : benar === false ? "#f5a0a0" : "#e8d8a8"}`,
                          borderRadius: 8, padding: 12,
                          background: benar === true ? "rgba(40,167,69,0.03)" : benar === false ? "rgba(208,53,53,0.03)" : "white",
                        }}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
                            <span style={{ fontWeight: 700, fontSize: 12, color: "#5a3a00" }}>
                              Soal #{q.nomer_soal}
                              <span style={{
                                marginLeft: 8, fontSize: 10, fontWeight: 600,
                                color: "#9a7a30", background: "#f8f4ec", padding: "2px 8px", borderRadius: 10,
                              }}>{q.tipe_soal}</span>
                            </span>
                            {benar === true && <span style={{ color: "#28a745", fontWeight: 700, fontSize: 11 }}>✅ Benar</span>}
                            {benar === false && <span style={{ color: "#cc0033", fontWeight: 700, fontSize: 11 }}>❌ Salah</span>}
                            {benar === "uraian" && <span style={{ color: "#fd7e14", fontWeight: 700, fontSize: 11 }}>📝 Uraian</span>}
                          </div>
                          <div style={{ fontSize: 11, marginBottom: 6, lineHeight: 1.5 }}
                            dangerouslySetInnerHTML={{ __html: q.pertanyaan }} />
                          <div style={{ fontSize: 11, color: "#9a7a30" }}>
                            <div>Jawaban Anda: <strong style={{ color: "#5a3a00" }}>{getJawabDisplay()}</strong></div>
                            {benar !== "uraian" && kunci && (
                              <div>Kunci: <strong style={{ color: "#28a745" }}>{getKunciDisplay()}</strong></div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </main>
    </div>
  );
}
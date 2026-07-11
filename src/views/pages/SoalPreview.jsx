import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser } from "../../controllers/AuthController";
import { getSoalByKodeSoal, getButirSoalList } from "../../controllers/SoalController";
import katex from "katex";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

const LABELS = ["A", "B", "C", "D"];

export default function SoalPreview() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode_soal = params.get("kode_soal");
  const role = user?.role === "admin" ? "admin" : "guru";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [soal, setSoal] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [showAnswers, setShowAnswers] = useState(false);
  const [showSidebar, setShowSidebar] = useState(true);

  useEffect(() => {
    if (!kode_soal) { setError("Kode soal tidak ditemukan"); setLoading(false); return; }
    (async () => {
      const s = await getSoalByKodeSoal(kode_soal);
      if (!s.success) { setError(s.message); setLoading(false); return; }
      setSoal(s.data);
      const b = await getButirSoalList(kode_soal);
      if (b.success) setQuestions(b.data);
      else { setError(b.message); }
      setLoading(false);
    })();
  }, [kode_soal]);

  useEffect(() => {
    requestAnimationFrame(() => {
      document.querySelectorAll(".preview-text span[data-math]").forEach((el) => {
        const latex = el.getAttribute("data-math");
        if (latex) {
          try { katex.render(latex, el, { throwOnError: false }); } catch {}
        }
      });
    });
  }, [currentIndex]);

  useEffect(() => {
    if (showAnswers) {
      requestAnimationFrame(() => {
        document.querySelectorAll(".preview-option-text span[data-math]").forEach((el) => {
          const latex = el.getAttribute("data-math");
          if (latex) {
            try { katex.render(latex, el, { throwOnError: false }); } catch {}
          }
        });
      });
    }
  }, [showAnswers, currentIndex]);

  const currentQ = questions[currentIndex];
  const currentNo = currentQ?.nomer_soal;

  const setJwb = useCallback((nomor, value) => {
    setJawaban((prev) => {
      const next = { ...prev };
      if (value === null || value === undefined || value === "") delete next[nomor];
      else next[nomor] = value;
      return next;
    });
  }, []);

  const isAnswered = (nomor) => {
    const v = jawaban[nomor];
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
  };

  const renderOptions = () => {
    if (!currentQ) return null;
    const jawab = jawaban[currentNo];
    const answerKey = currentQ?.jawaban_benar || "";

    const matchingOpts = () => {
      const huruf = LABELS;
      return [1, 2, 3, 4].map((i) => {
        const key = `pilihan_${i}`;
        const text = currentQ[key];
        if (!text || !text.trim()) return null;
        return { key, label: huruf[i - 1], text };
      }).filter(Boolean);
    };

    switch (currentQ.tipe_soal) {
      case "Pilihan Ganda":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {matchingOpts().map((o) => {
              const correct = showAnswers && o.key === answerKey;
              const selected = jawab === o.key;
              return (
                <label key={o.key} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  border: `2px solid ${correct ? "#28a745" : selected ? "#b89440" : "#e0d8c8"}`,
                  borderRadius: 8, cursor: "pointer", fontSize: 12,
                  background: correct ? "rgba(40,167,69,0.08)" : selected ? "rgba(184,148,64,0.08)" : "white",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: "50%", display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0,
                    background: correct ? "#28a745" : selected ? "#b89440" : "#f0e8d8",
                    color: "white",
                  }}>{correct ? <Icon name="check" size={12} /> : o.label}</div>
                  <input type="radio" name={`preview_${currentNo}`} value={o.key}
                    checked={selected} onChange={() => setJwb(currentNo, o.key)}
                    style={{ display: "none" }} />
                  <span className="preview-option-text" style={{ lineHeight: 1.4 }}>{o.text}</span>
                </label>
              );
            })}
          </div>
        );

      case "Pilihan Ganda Kompleks": {
        const selected = Array.isArray(jawab) ? jawab : [];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {matchingOpts().map((o) => {
              const checked = selected.includes(o.key);
              const correct = showAnswers && answerKey.includes(o.key);
              return (
                <label key={o.key} style={{
                  display: "flex", alignItems: "center", gap: 8, padding: "8px 12px",
                  border: `2px solid ${correct ? "#28a745" : checked ? "#b89440" : "#e0d8c8"}`,
                  borderRadius: 8, cursor: "pointer", fontSize: 12,
                  background: correct ? "rgba(40,167,69,0.08)" : checked ? "rgba(184,148,64,0.08)" : "white",
                }}>
                  <div style={{
                    width: 24, height: 24, borderRadius: 4, display: "flex", alignItems: "center",
                    justifyContent: "center", fontWeight: 700, fontSize: 11, flexShrink: 0,
                    background: correct ? "#28a745" : checked ? "#b89440" : "#f0e8d8",
                    color: "white",
                  }}>{correct ? <Icon name="check" size={12} /> : o.label}</div>
                  <input type="checkbox" value={o.key}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((k) => k !== o.key)
                        : [...selected, o.key];
                      setJwb(currentNo, next.length > 0 ? next : null);
                    }}
                    style={{ display: "none" }} />
                  <span className="preview-option-text" style={{ lineHeight: 1.4 }}>{o.text}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "Benar/Salah": {
        const pernyataan = matchingOpts().filter((o) => o.text && o.text.trim());
        const jawabObj = typeof jawab === "object" && !Array.isArray(jawab) ? jawab : {};
        return (
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="approval-table" style={{ fontSize: 12 }}>
              <thead>
                <tr><th style={{ width: "60%" }}>Pernyataan</th><th style={{ width: "20%" }}>Benar</th><th style={{ width: "20%" }}>Salah</th></tr>
              </thead>
              <tbody>
                {pernyataan.map((o, idx) => {
                  const correct = showAnswers;
                  const correctVal = answerKey.split("|")[idx]?.trim();
                  const userVal = jawabObj[idx];
                  return (
                    <tr key={idx}>
                      <td>
                        <span className="preview-option-text">{o.text}</span>
                        {showAnswers && correctVal && (
                          <span style={{ marginLeft: 6, fontSize: 10, color: "#28a745" }}>
                            ({correctVal === "Benar" ? "✓" : "✗"})
                          </span>
                        )}
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input type="radio" name={`tf_${currentNo}_${idx}`} value="Benar"
                          checked={userVal === "Benar"}
                          onChange={() => {
                            const newObj = { ...jawabObj, [idx]: "Benar" };
                            setJwb(currentNo, newObj);
                          }} />
                      </td>
                      <td style={{ textAlign: "center" }}>
                        <input type="radio" name={`tf_${currentNo}_${idx}`} value="Salah"
                          checked={userVal === "Salah"}
                          onChange={() => {
                            const newObj = { ...jawabObj, [idx]: "Salah" };
                            setJwb(currentNo, newObj);
                          }} />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      case "Menjodohkan": {
        const kunci = currentQ.jawaban_benar || "";
        const pairs = kunci.replace(/[\[\]]/g, "").split("|").map((p) => p.trim()).filter(Boolean)
          .map((p) => {
            const [kiri, kanan] = p.includes(":") ? p.split(":") : [p, ""];
            return { kiri: kiri.trim(), kanan: kanan.trim() };
          }).filter((p) => p.kiri && p.kanan);
        const jawabObj = typeof jawab === "object" && !Array.isArray(jawab) ? jawab : {};
        if (pairs.length === 0) return <div style={{ color: "#9a7a30", fontSize: 12 }}>Soal menjodohkan belum memiliki pasangan.</div>;

        return (
          <div style={{ fontSize: 12 }}>
            <p style={{ color: "#9a7a30", marginBottom: 8 }}>Seret (drag) item kiri ke kanan yang sesuai:</p>
            <table className="matching-table" style={{ width: "100%" }}>
              <tbody>
                {pairs.map((p) => {
                  const matched = jawabObj[p.kiri] || "";
                  const correctMatch = showAnswers ? p.kanan : null;
                  return (
                    <tr key={p.kiri}>
                      <td style={{ width: "40%", padding: 6 }}>
                        <div style={{
                          padding: "8px 12px", background: "#f8f4ec", border: "1px solid #d4b86a",
                          borderRadius: 6, textAlign: "center", fontWeight: 600,
                        }}>
                          <span className="preview-option-text">{p.kiri}</span>
                        </div>
                      </td>
                      <td style={{ width: "10%", textAlign: "center", color: "#9a7a30", fontSize: 16 }}>→</td>
                      <td style={{ width: "50%", padding: 6 }}>
                        <div style={{
                          padding: "8px 12px", border: `2px dashed ${showAnswers && matched === correctMatch ? "#28a745" : "#d4b86a"}`,
                          borderRadius: 6, minHeight: 36, textAlign: "center",
                          background: showAnswers && matched === correctMatch ? "rgba(40,167,69,0.05)" : "white",
                        }}>
                          {showAnswers && correctMatch
                            ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                                <Icon name="check" size={12} color="#28a745" />
                                <span className="preview-option-text">{correctMatch}</span>
                              </span>
                            : matched
                              ? <span className="preview-option-text">{matched}</span>
                              : <span style={{ color: "#d4b86a" }}>Letakkan di sini</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        );
      }

      case "Uraian":
        return (
          <textarea value={typeof jawab === "string" ? jawab : ""}
            onChange={(e) => setJwb(currentNo, e.target.value || null)}
            placeholder="Tulis jawaban contoh di sini..."
            style={{ width: "100%", minHeight: 120, borderRadius: 8, border: "1px solid #d4b86a", padding: 12, fontSize: 12, resize: "vertical" }}
          />
        );

      default:
        return <div style={{ color: "#9a7a30", fontSize: 12 }}>Tipe soal tidak dikenal</div>;
    }
  };

  if (!kode_soal) return null;

  return (
    <div className="dash-layout" style={{ background: "#f5f0e8" }}>
      <main className="dash-main" style={{ padding: 0 }}>
        {/* Top Bar */}
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
          background: "linear-gradient(135deg, #2a1200, #5a3a00)", color: "white",
          padding: "6px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => navigate(role === "admin" ? "/admin/bank-soal" : "/guru/bank-soal")}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
              <Icon name="x" size={14} style={{ marginRight: 4 }} />Kembali
            </button>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{soal?.mapel || "Preview"} — {soal?.nama_soal || ""}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span style={{ fontSize: 10, opacity: 0.7, background: "rgba(255,255,255,0.1)", padding: "2px 8px", borderRadius: 4 }}>
              Sandbox — Tidak disimpan
            </span>
            <button onClick={() => setShowAnswers((p) => !p)}
              style={{
                background: showAnswers ? "rgba(40,167,69,0.3)" : "rgba(255,255,255,0.15)",
                border: `1px solid ${showAnswers ? "#28a745" : "transparent"}`,
                color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12,
              }}>
              {showAnswers ? <><Icon name="check" size={12} style={{ marginRight: 4 }} />Sembunyikan Jawaban</>
                : <><Icon name="monitor" size={12} style={{ marginRight: 4 }} />Tampilkan Jawaban</>}
            </button>
            <button onClick={() => setShowSidebar((p) => !p)}
              style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", padding: "4px 8px", borderRadius: 4, cursor: "pointer", fontSize: 16 }}>
              ☰
            </button>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 80 }}><TableSkeleton rows={5} cols={1} /></div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#b02020" }}>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate(role === "admin" ? "/admin/bank-soal" : "/guru/bank-soal")}>Kembali</button>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9a7a30" }}>
            <p>Belum ada butir soal.</p>
          </div>
        ) : (
          <div style={{ display: "flex", paddingTop: 48, minHeight: "100vh" }}>
            {/* Sidebar */}
            {showSidebar && (
              <div style={{
                width: 120, flexShrink: 0, background: "white", borderRight: "1px solid #e0d8c8",
                padding: 8, overflowY: "auto", position: "sticky", top: 48, alignSelf: "flex-start", maxHeight: "calc(100vh - 56px)",
              }}>
                <div style={{ fontSize: 10, fontWeight: 700, color: "#9a7a30", marginBottom: 6, textAlign: "center" }}>
                  {questions.length} Soal
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: 4 }}>
                  {questions.map((q, idx) => {
                    const answered = isAnswered(q.nomer_soal);
                    return (
                      <button key={q.id_butir || q.nomer_soal} onClick={() => setCurrentIndex(idx)}
                        style={{
                          width: "100%", aspectRatio: "1", border: "none", borderRadius: 4, cursor: "pointer",
                          fontSize: 10, fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center",
                          background: idx === currentIndex ? "#b89440" : answered ? "#28a745" : "#f0e8d8",
                          color: idx === currentIndex || answered ? "white" : "#5a3a00",
                        }}>
                        {q.nomer_soal}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Question Panel */}
            <div style={{ flex: 1, padding: "16px 24px", maxWidth: 700, margin: "0 auto" }}>
              {/* Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  background: "#b89440", color: "white", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                }}>
                  Soal {currentIndex + 1}/{questions.length}
                </span>
                <span style={{
                  background: "rgba(23,162,184,0.1)", color: "#17a2b8",
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid #9fd6e8",
                }}>{currentQ.tipe_soal}</span>
                {showAnswers && (
                  <span style={{ background: "rgba(40,167,69,0.1)", color: "#1e5010", padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700 }}>
                    Kunci: {currentQ.jawaban_benar}
                  </span>
                )}
              </div>

              {/* Question Text */}
              <div className="preview-text" style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 20, color: "#2a1200" }}
                dangerouslySetInnerHTML={{ __html: currentQ.pertanyaan || "<i>Tidak ada pertanyaan</i>" }}
              />

              {/* Options */}
              {renderOptions()}

              {/* Navigation */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: 24, gap: 8 }}>
                <button disabled={currentIndex === 0}
                  onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "1px solid #d4b86a",
                    background: currentIndex === 0 ? "#f5f0e8" : "white", color: currentIndex === 0 ? "#ccc" : "#5a3a00",
                    cursor: currentIndex === 0 ? "default" : "pointer", fontSize: 12,
                  }}>
                  ← Sebelumnya
                </button>
                <button disabled={currentIndex >= questions.length - 1}
                  onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                  style={{
                    padding: "8px 20px", borderRadius: 8, border: "1px solid #d4b86a",
                    background: currentIndex >= questions.length - 1 ? "#f5f0e8" : "white",
                    color: currentIndex >= questions.length - 1 ? "#ccc" : "#5a3a00",
                    cursor: currentIndex >= questions.length - 1 ? "default" : "pointer", fontSize: 12,
                  }}>
                  Selanjutnya →
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

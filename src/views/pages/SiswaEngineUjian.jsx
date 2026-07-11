import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser } from "../../controllers/AuthController";
import {
  getExamSession, getExamQuestions, autoSaveJawaban, submitJawaban,
  updateActivity,
} from "../../controllers/ExamController";
import useAntiCheat from "../../hooks/useAntiCheat";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";

const QUESTION_TYPES = ["Pilihan Ganda", "Pilihan Ganda Kompleks", "Benar/Salah", "Menjodohkan", "Uraian"];

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html;
  return d.textContent || d.innerText || "";
}

export default function SiswaEngineUjian() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode_soal = params.get("kode_soal");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [jawaban, setJawaban] = useState({});
  const [waktuSisa, setWaktuSisa] = useState(0);
  const [fontSize, setFontSize] = useState(100);
  const [showNav, setShowNav] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
  const [autoSaveStatus, setAutoSaveStatus] = useState("");
  const [timeUp, setTimeUp] = useState(false);

  const violationsRef = useRef(0);
  const timerRef = useRef(null);
  const autoSaveRef = useRef(null);
  const activityRef = useRef(null);
  const jawabanRef = useRef(jawaban);
  const waktuSisaRef = useRef(waktuSisa);
  const submittedRef = useRef(false);

  useAntiCheat(kode_soal, violationsRef);

  // ─── Load exam data ───
  useEffect(() => {
    if (!kode_soal) { navigate("/siswa/ujian"); return; }

    (async () => {
      setLoading(true);
      const [sesiR, questR] = await Promise.all([
        getExamSession(kode_soal),
        getExamQuestions(kode_soal),
      ]);

      if (!questR.success) { setError(questR.message); setLoading(false); return; }
      setQuestions(questR.data);

      if (sesiR.success && sesiR.data) {
        setJawaban(sesiR.data.jawaban || {});
        setWaktuSisa(sesiR.data.waktu_sisa);
      } else {
        setWaktuSisa(0);
      }

      setLoading(false);
    })();
  }, [kode_soal, navigate]);

  // ─── Timer countdown ───
  useEffect(() => {
    if (loading || waktuSisa <= 0 || submitting) return;

    timerRef.current = setInterval(() => {
      setWaktuSisa((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          setTimeUp(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, waktuSisa, submitting]);

  // ─── Sync refs with latest state ───
  useEffect(() => { jawabanRef.current = jawaban; }, [jawaban]);
  useEffect(() => { waktuSisaRef.current = waktuSisa; }, [waktuSisa]);

  // ─── Auto-save every 30s ───
  useEffect(() => {
    if (loading || !kode_soal) return;

    autoSaveRef.current = setInterval(async () => {
      setAutoSaveStatus("Menyimpan...");
      const r = await autoSaveJawaban(kode_soal, jawabanRef.current, waktuSisaRef.current);
      setAutoSaveStatus(r.success ? "Tersimpan" : "Gagal simpan");
      setTimeout(() => setAutoSaveStatus(""), 2000);
      const act = await updateActivity(kode_soal);
      if (act?.force_logout) navigate("/siswa/ujian");
    }, 30000);

    return () => clearInterval(autoSaveRef.current);
  }, [loading, kode_soal, navigate]);

  // ─── Activity ping every 60s ───
  useEffect(() => {
    if (loading || !kode_soal) return;

    activityRef.current = setInterval(async () => {
      const r = await updateActivity(kode_soal);
      if (r.force_logout) {
        navigate("/siswa/ujian");
      }
    }, 60000);

    return () => clearInterval(activityRef.current);
  }, [loading, kode_soal, navigate]);

  // ─── Auto-submit when time is up ───
  useEffect(() => {
    if (timeUp && !submitting && !submittedRef.current) {
      handleSubmitRef.current();
    }
  }, [timeUp, submitting]);

  // ─── Save progress before leaving ───
  useEffect(() => {
    const handleBefore = () => {
      autoSaveJawaban(kode_soal, jawaban, waktuSisa);
    };
    window.addEventListener("beforeunload", handleBefore);
    return () => window.removeEventListener("beforeunload", handleBefore);
  }, [kode_soal, jawaban, waktuSisa]);

  // ─── Image click handler for zoom ───
  useEffect(() => {
    const handleClick = (e) => {
      if (e.target.tagName === "IMG" && e.target.closest(".question-text")) {
        const modal = document.getElementById("imageModal");
        const img = document.getElementById("modalImage");
        if (modal && img) {
          img.src = e.target.src;
          modal.classList.add("show");
        }
      }
    };
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, []);

  // ─── Update jawaban ───
  const updateJawaban = useCallback((nomor, value) => {
    setJawaban((prev) => {
      const newJ = { ...prev };
      if (value === null || value === undefined || value === "") {
        delete newJ[nomor];
      } else {
        newJ[nomor] = value;
      }
      return newJ;
    });
  }, []);

  // ─── Answer Check ───
  const isAnswered = (nomor) => {
    const v = jawaban[nomor];
    if (v === undefined || v === null) return false;
    if (typeof v === "string" && v.trim() === "") return false;
    if (Array.isArray(v) && v.length === 0) return false;
    if (typeof v === "object" && !Array.isArray(v) && Object.keys(v).length === 0) return false;
    return true;
  };

  // ─── Submit ───
  const handleSubmit = async () => {
    if (submittedRef.current) return;
    submittedRef.current = true;
    setSubmitting(true);
    setShowSubmitConfirm(false);
    await autoSaveJawaban(kode_soal, jawaban, waktuSisa);
    const r = await submitJawaban(kode_soal, jawaban, waktuSisa);
    setSubmitting(false);
    if (r.success) {
      navigate(`/siswa/hasil/detail?kode_soal=${kode_soal}`);
    } else {
      setError(r.message);
    }
  };
  const handleSubmitRef = useRef(handleSubmit);
  useEffect(() => { handleSubmitRef.current = handleSubmit; }, [handleSubmit]);

  // ─── Current question ───
  const currentQ = questions[currentIndex];
  const currentNo = currentQ?.nomer_soal;

  // ─── Timer formatting ───
  const fmtTimer = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const timerLow = waktuSisa < 300; // red if < 5 minutes

  // ─── Render question ───
  const renderQuestion = () => {
    if (!currentQ) return null;

    const jawab = jawaban[currentNo];

    const commonOpts = (tipe) => {
      const huruf = ["A", "B", "C", "D"];
      return [1, 2, 3, 4].map((i) => {
        const label = huruf[i - 1];
        const pilihanKey = `pilihan_${i}`;
        const text = currentQ[pilihanKey];
        if (!text || !text.trim()) return null;
        return { key: pilihanKey, label, text };
      }).filter(Boolean);
    };

    switch (currentQ.tipe_soal) {
      case "Pilihan Ganda":
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {commonOpts().map((o) => (
              <label key={o.key} style={{
                display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                border: `2px solid ${jawab === o.key ? "#28a745" : "#e0d8c8"}`,
                borderRadius: 10, cursor: "pointer", background: jawab === o.key ? "rgba(40,167,69,0.05)" : "white",
                transition: "all 0.2s",
              }}>
                <div style={{
                  width: 28, height: 28, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center",
                  fontWeight: 700, fontSize: 12, flexShrink: 0,
                  background: jawab === o.key ? "#28a745" : "#f0e8d8", color: jawab === o.key ? "white" : "#5a3a00",
                }}>{o.label}</div>
                <input type="radio" name={`q_${currentNo}`} value={o.key}
                  checked={jawab === o.key} onChange={() => updateJawaban(currentNo, o.key)}
                  style={{ display: "none" }} />
                <span style={{ fontSize: 12, lineHeight: 1.4 }}>{o.text}</span>
              </label>
            ))}
          </div>
        );

      case "Pilihan Ganda Kompleks": {
        const selected = Array.isArray(jawab) ? jawab : [];
        return (
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {commonOpts().map((o) => {
              const checked = selected.includes(o.key);
              return (
                <label key={o.key} style={{
                  display: "flex", alignItems: "center", gap: 10, padding: "10px 14px",
                  border: `2px solid ${checked ? "#28a745" : "#e0d8c8"}`,
                  borderRadius: 10, cursor: "pointer", background: checked ? "rgba(40,167,69,0.05)" : "white",
                }}>
                  <div style={{
                    width: 28, height: 28, borderRadius: 4, display: "flex", alignItems: "center", justifyContent: "center",
                    fontWeight: 700, fontSize: 12, flexShrink: 0,
                    background: checked ? "#28a745" : "#f0e8d8", color: checked ? "white" : "#5a3a00",
                  }}>
                    {checked ? <Icon name="check" size={14} /> : o.label}
                  </div>
                  <input type="checkbox" value={o.key}
                    checked={checked}
                    onChange={() => {
                      const next = checked
                        ? selected.filter((k) => k !== o.key)
                        : [...selected, o.key];
                      updateJawaban(currentNo, next.length > 0 ? next : null);
                    }}
                    style={{ display: "none" }} />
                  <span style={{ fontSize: 12, lineHeight: 1.4 }}>{o.text}</span>
                </label>
              );
            })}
          </div>
        );
      }

      case "Benar/Salah": {
        const pernyataan = commonOpts().filter((o) => o.text && o.text.trim());
        const jawabObj = typeof jawab === "object" && !Array.isArray(jawab) ? jawab : {};
        return (
          <div className="table-wrap" style={{ marginTop: 8 }}>
            <table className="approval-table" style={{ fontSize: 12 }}>
              <thead>
                <tr><th style={{ width: "60%" }}>Pernyataan</th><th style={{ width: "20%" }}>Benar</th><th style={{ width: "20%" }}>Salah</th></tr>
              </thead>
              <tbody>
                {pernyataan.map((o, idx) => (
                  <tr key={idx}>
                    <td>{o.text}</td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name={`tf_${currentNo}_${idx}`} value="Benar"
                        checked={jawabObj[idx] === "Benar"}
                        onChange={() => {
                          const newObj = { ...jawabObj, [idx]: "Benar" };
                          updateJawaban(currentNo, newObj);
                        }} />
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <input type="radio" name={`tf_${currentNo}_${idx}`} value="Salah"
                        checked={jawabObj[idx] === "Salah"}
                        onChange={() => {
                          const newObj = { ...jawabObj, [idx]: "Salah" };
                          updateJawaban(currentNo, newObj);
                        }} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      }

      case "Menjodohkan": {
        const kunci = currentQ.jawaban_benar || "";
        const pairs = kunci
          .replace(/[\[\]]/g, "")
          .split("|")
          .map((p) => p.trim())
          .filter(Boolean)
          .map((p) => {
            const [kiri, kanan] = p.includes(":") ? p.split(":") : [p, ""];
            return { kiri: kiri.trim(), kanan: kanan.trim() };
          })
          .filter((p) => p.kiri && p.kanan);

        const jawabObj = typeof jawab === "object" && !Array.isArray(jawab) ? jawab : {};

        if (pairs.length === 0) return <div style={{ color: "#9a7a30", fontSize: 12 }}>Soal menjodohkan belum memiliki pasangan yang valid.</div>;

        // Shuffle right column
        const shuffle = (arr) => [...arr].sort(() => Math.random() - 0.5);
        const shuffleKey = useRef(0);
        if (!shuffleKey.current) shuffleKey.current = Date.now();
        const [shuffledRight, setShuffledRight] = useState(
          () => shuffle(pairs.map((p) => p.kanan))
        );

        const handleDragStart = (e, kiri) => {
          e.dataTransfer.setData("text/plain", kiri);
        };

        const handleDrop = (e, kanan) => {
          e.preventDefault();
          const kiri = e.dataTransfer.getData("text/plain");
          const newObj = {};
          // Preserve other mappings
          Object.entries(jawabObj).forEach(([k, v]) => {
            if (v !== kanan) newObj[k] = v;
          });
          newObj[kiri] = kanan;
          updateJawaban(currentNo, newObj);
        };

        const handleDragOver = (e) => e.preventDefault();

        return (
          <div style={{ fontSize: 12 }}>
            <p style={{ color: "#9a7a30", marginBottom: 8 }}>Seret (drag) item kiri ke kanan yang sesuai:</p>
            <table className="matching-table" style={{ width: "100%" }}>
              <tbody>
                {pairs.map((p) => {
                  const matched = jawabObj[p.kiri] || "";
                  return (
                    <tr key={p.kiri}>
                      <td style={{ width: "40%", padding: 6 }}>
                        <div draggable onDragStart={(e) => handleDragStart(e, p.kiri)}
                          style={{
                            padding: "8px 12px", background: "#f8f4ec", border: "1px solid #d4b86a",
                            borderRadius: 6, cursor: "grab", textAlign: "center", fontWeight: 600,
                          }}>
                          {p.kiri}
                        </div>
                      </td>
                      <td style={{ width: "10%", textAlign: "center", color: "#9a7a30", fontSize: 16 }}>→</td>
                      <td style={{ width: "50%", padding: 6 }}>
                        <div onDrop={(e) => handleDrop(e, p.kanan)} onDragOver={handleDragOver}
                          style={{
                            padding: "8px 12px", border: `2px dashed ${matched === p.kanan ? "#28a745" : "#d4b86a"}`,
                            borderRadius: 6, minHeight: 36, textAlign: "center",
                            background: matched === p.kanan ? "rgba(40,167,69,0.05)" : "white",
                            transition: "all 0.2s",
                          }}>
                          {matched === p.kanan ? p.kanan : <span style={{ color: "#d4b86a" }}>Letakkan di sini</span>}
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
            onChange={(e) => updateJawaban(currentNo, e.target.value || null)}
            className="essay-textarea" placeholder="Tulis jawaban Anda di sini..."
            style={{ width: "100%", minHeight: 160, borderRadius: 8, border: "1px solid #d4b86a", padding: 12, fontSize: 12, resize: "vertical" }}
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
          background: "linear-gradient(135deg, #2a1200, #5a3a00)",
          color: "white", padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button onClick={() => { autoSaveJawaban(kode_soal, jawaban, waktuSisa); navigate("/siswa/ujian"); }}
              style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", padding: "6px 12px", borderRadius: 6, cursor: "pointer", fontSize: 12 }}>
              <Icon name="x" size={14} style={{ marginRight: 4 }} />Keluar
            </button>
            <span style={{ fontSize: 13, fontWeight: 700 }}>{currentQ?.mapel || "Ujian"}</span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            <span style={{ fontSize: 11, opacity: 0.7, minWidth: 80, textAlign: "right" }}>{autoSaveStatus}</span>

            <div style={{ display: "flex", gap: 4 }}>
              <button onClick={() => setFontSize((p) => Math.min(p + 10, 150))} title="Perbesar"
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 28, height: 28, borderRadius: 4, cursor: "pointer", fontSize: 14 }}>+</button>
              <button onClick={() => setFontSize((p) => Math.max(p - 10, 70))} title="Perkecil"
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 28, height: 28, borderRadius: 4, cursor: "pointer", fontSize: 14 }}>−</button>
              <button onClick={() => setFontSize(100)} title="Reset"
                style={{ background: "rgba(255,255,255,0.15)", border: "none", color: "white", width: 28, height: 28, borderRadius: 4, cursor: "pointer", fontSize: 10 }}>↺</button>
            </div>

            <div id="texttimer" style={{
              fontWeight: 700, fontSize: 16, fontFamily: "monospace",
              color: timerLow ? "#ff6b6b" : "white",
              background: timerLow ? "rgba(255,0,0,0.2)" : "rgba(255,255,255,0.1)",
              padding: "4px 12px", borderRadius: 6, minWidth: 70, textAlign: "center",
            }}>
              <span id="timer">{fmtTimer(waktuSisa)}</span>
            </div>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div style={{ padding: 80 }}>
            <TableSkeleton rows={5} cols={1} />
          </div>
        ) : error ? (
          <div style={{ padding: 40, textAlign: "center", color: "#b02020" }}>
            <p>{error}</p>
            <button className="btn-primary" onClick={() => navigate("/siswa/ujian")}>Kembali</button>
          </div>
        ) : questions.length === 0 ? (
          <div style={{ padding: 40, textAlign: "center", color: "#9a7a30" }}>
            <p>Tidak ada soal ditemukan.</p>
          </div>
        ) : (
          <>
            <div style={{ padding: "64px 16px 80px", maxWidth: 800, margin: "0 auto" }}>
              {/* Question Number Badge */}
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
                <span style={{
                  background: "#b89440", color: "white", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700,
                }}>
                  Soal {currentIndex + 1} dari {questions.length}
                </span>
                <span style={{
                  background: "rgba(23,162,184,0.1)", color: "#17a2b8",
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700, border: "1px solid #9fd6e8",
                }}>{currentQ.tipe_soal}</span>
                <span style={{
                  background: isAnswered(currentNo) ? "rgba(40,167,69,0.1)" : "rgba(208,53,53,0.1)",
                  color: isAnswered(currentNo) ? "#1e5010" : "#b02020",
                  padding: "4px 10px", borderRadius: 20, fontSize: 10, fontWeight: 700,
                  border: `1px solid ${isAnswered(currentNo) ? "#a5d6a7" : "#f5a0a0"}`,
                }}>
                  {isAnswered(currentNo) ? "Terjawab" : "Belum Dijawab"}
                </span>
              </div>

              {/* Question Text */}
              <div className="question-text" style={{
                fontSize: `${fontSize}%`, lineHeight: 1.6, marginBottom: 20,
                background: "white", padding: "16px 20px", borderRadius: 10,
                border: "1px solid #e8d8a8",
              }}
                dangerouslySetInnerHTML={{ __html: currentQ.pertanyaan || "<i>Tidak ada pertanyaan</i>" }}
              />

              {/* Options */}
              {renderQuestion()}
            </div>

            {/* Bottom Navigation Bar */}
            <div style={{
              position: "fixed", bottom: 0, left: 0, right: 0, zIndex: 100,
              background: "white", borderTop: "2px solid #d4b86a",
              padding: "8px 16px", display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <button className="btn-cancel" onClick={() => setCurrentIndex((p) => Math.max(0, p - 1))}
                disabled={currentIndex === 0} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                <Icon name="chevron-left" size={14} /> Sebelumnya
              </button>

              <button onClick={() => setShowNav(true)} className="btn-primary"
                style={{ fontSize: 12, display: "flex", alignItems: "center", gap: 4 }}>
                <Icon name="page" size={14} /> Daftar Soal
              </button>

              <div style={{ display: "flex", gap: 8 }}>
                {currentIndex < questions.length - 1 ? (
                  <button className="btn-primary" onClick={() => setCurrentIndex((p) => Math.min(questions.length - 1, p + 1))}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    Berikutnya <Icon name="chevron-right" size={14} />
                  </button>
                ) : (
                  <button className="btn-success" onClick={() => setShowSubmitConfirm(true)}
                    style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12 }}>
                    <Icon name="check" size={14} /> Selesai
                  </button>
                )}
              </div>
            </div>

            {/* Floating Nav Button */}
            <button onClick={() => setShowNav(true)}
              style={{
                position: "fixed", bottom: 70, right: 16, zIndex: 100,
                width: 48, height: 48, borderRadius: "50%",
                background: "linear-gradient(135deg, #b89440, #d4b86a)",
                border: "none", color: "#2a1200", cursor: "pointer", boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
              <Icon name="page" size={20} />
            </button>
          </>
        )}

        {/* Question Navigation Modal */}
        {showNav && (
          <div className="modal-backdrop" onClick={() => setShowNav(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400, maxHeight: "70vh", overflowY: "auto" }}>
              <div className="modal-head">
                <h3 style={{ fontSize: 14, margin: 0 }}>Daftar Soal</h3>
                <button className="modal-close" onClick={() => setShowNav(false)}><Icon name="x" size={18} /></button>
              </div>
              <div className="modal-body">
                <p style={{ fontSize: 11, color: "#9a7a30", marginBottom: 8 }}>
                  {Object.keys(jawaban).filter((k) => isAnswered(parseInt(k))).length} dari {questions.length} terjawab
                </p>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                  {questions.map((q, idx) => (
                    <button key={q.id_soal} onClick={() => { setCurrentIndex(idx); setShowNav(false); }}
                      style={{
                        width: 40, height: 40, borderRadius: 8, border: `2px solid ${isAnswered(q.nomer_soal) ? "#28a745" : "#e0d8c8"}`,
                        background: currentIndex === idx ? "#b89440" : isAnswered(q.nomer_soal) ? "rgba(40,167,69,0.1)" : "white",
                        color: currentIndex === idx ? "white" : isAnswered(q.nomer_soal) ? "#1e5010" : "#5a3a00",
                        fontWeight: 700, fontSize: 12, cursor: "pointer",
                      }}>
                      {q.nomer_soal}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Submit Confirmation */}
        {showSubmitConfirm && (
          <div className="modal-backdrop" onClick={() => setShowSubmitConfirm(false)}>
            <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 400 }}>
              <div className="modal-head">
                <h3 style={{ fontSize: 14, margin: 0 }}>Selesaikan Ujian?</h3>
                <button className="modal-close" onClick={() => setShowSubmitConfirm(false)}><Icon name="x" size={18} /></button>
              </div>
              <div className="modal-body" style={{ fontSize: 12, lineHeight: 1.6 }}>
                <p>Pastikan semua jawaban sudah diisi sebelum mengakhiri ujian.</p>
                <p>
                  Terjawab: <strong>{Object.keys(jawaban).filter((k) => isAnswered(parseInt(k))).length}/{questions.length}</strong>
                </p>
                {Object.keys(jawaban).filter((k) => !isAnswered(parseInt(k))).length > 0 && (
                  <p style={{ color: "#cc0033" }}>{Object.keys(jawaban).filter((k) => !isAnswered(parseInt(k))).length} soal belum dijawab.</p>
                )}
              </div>
              <div className="modal-foot">
                <button className="btn-cancel" onClick={() => setShowSubmitConfirm(false)}>Cek Lagi</button>
                <button className="btn-success" onClick={handleSubmit} disabled={submitting}
                  style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  {submitting && <span className="t-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />}
                  {submitting ? "Menyimpan..." : "Selesai & Kirim"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview Modal */}
        <div id="imageModal" className="modal-img" onClick={(e) => {
          if (e.target === e.currentTarget) {
            document.getElementById("imageModal").classList.remove("show");
          }
        }} style={{ display: "none" }}>
          <span className="close-btn" onClick={() => document.getElementById("imageModal").classList.remove("show")}>&times;</span>
          <img id="modalImage" className="modal-content-img" alt="Preview" />
        </div>

        {/* Copyright footer */}
        <div style={{
          position: "fixed", bottom: 56, left: 0, right: 0, zIndex: 99,
          textAlign: "center", fontSize: 9, color: "rgba(0,0,0,0.3)",
          background: "transparent", pointerEvents: "none", padding: "2px 0",
        }}>
          &copy; Naha 2026
        </div>
      </main>

      {/* Add CSS for image modal */}
      <style>{`
        .modal-img {
          position: fixed; top: 0; left: 0; width: 100%; height: 100%;
          background: rgba(0,0,0,0.85); z-index: 9999;
          display: none; align-items: center; justify-content: center;
          cursor: pointer;
        }
        .modal-img.show { display: flex; }
        .modal-content-img {
          max-width: 90%; max-height: 90%; border-radius: 8px; box-shadow: 0 8px 32px rgba(0,0,0,0.5);
        }
        .close-btn {
          position: absolute; top: 20px; right: 30px; color: white; font-size: 40px;
          font-weight: bold; cursor: pointer; z-index: 10000;
        }
        .question-text img { max-width: 100%; height: auto; cursor: zoom-in; border-radius: 4px; }
        .question-text img:hover { opacity: 0.9; }
      `}</style>

    </div>
  );
}
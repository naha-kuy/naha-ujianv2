import Icon from "../Icon";
import RichEditor from "../RichEditor";

const QUESTION_TYPES = [
  "Pilihan Ganda", "Pilihan Ganda Kompleks", "Benar/Salah", "Menjodohkan", "Uraian",
];

export default function ModalButirSoal({ editId, form, saving, onClose, onSave, onChange }) {
  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 720 }}>
        <div className="modal-head">
          <h3 style={{ fontSize: 15 }}>{editId ? "Edit Butir Soal" : "Tambah Butir Soal"}</h3>
          <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
        </div>
        <div className="modal-body" style={{ maxHeight: "70vh", overflowY: "auto" }}>
          <div style={{ display: "flex", gap: 12, marginBottom: 14 }}>
            <div className="input-wrap" style={{ width: 100 }}>
              <label>No. Soal *</label>
              <input type="number" min={1} value={form.nomer_soal}
                onChange={(e) => onChange({ ...form, nomer_soal: e.target.value })} />
            </div>
            <div className="input-wrap" style={{ flex: 1 }}>
              <label>Tipe Soal *</label>
              <select value={form.tipe_soal}
                onChange={(e) => onChange({ ...form, tipe_soal: e.target.value, jawaban_benar: "" })}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
          </div>

          <div style={{ marginBottom: 14 }}>
            <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 4 }}>Pertanyaan *</label>
            <RichEditor value={form.pertanyaan}
              onChange={(html) => onChange({ ...form, pertanyaan: html })}
              placeholder="Tulis pertanyaan di sini..." minHeight={120} />
          </div>

          {form.tipe_soal === "Pilihan Ganda" && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 6 }}>Pilihan Jawaban</label>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <input type="radio" name="pg_jawaban" checked={form.jawaban_benar === `pilihan_${n}`}
                    onChange={() => onChange({ ...form, jawaban_benar: `pilihan_${n}` })}
                    style={{ accentColor: "#b89440" }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", width: 20 }}>{String.fromCharCode(64 + n)}.</span>
                  <input type="text" value={form[`pilihan_${n}`] || ""}
                    onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
                    style={{ flex: 1, border: "1px solid #d4b86a", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none" }}
                    placeholder={`Pilihan ${String.fromCharCode(64 + n)}`} />
                </div>
              ))}
            </div>
          )}

          {form.tipe_soal === "Pilihan Ganda Kompleks" && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 6 }}>Pilihan Jawaban (centang yang benar)</label>
              {[1, 2, 3, 4].map((n) => {
                const checked = form.jawaban_benar?.split(",").includes(`pilihan_${n}`);
                return (
                  <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                    <input type="checkbox" checked={!!checked}
                      onChange={() => {
                        const arr = (form.jawaban_benar || "").split(",").filter(Boolean);
                        const key = `pilihan_${n}`;
                        const idx = arr.indexOf(key);
                        if (idx >= 0) arr.splice(idx, 1); else arr.push(key);
                        onChange({ ...form, jawaban_benar: arr.join(",") });
                      }}
                      style={{ accentColor: "#b89440" }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", width: 20 }}>{String.fromCharCode(64 + n)}.</span>
                    <input type="text" value={form[`pilihan_${n}`] || ""}
                      onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
                      style={{ flex: 1, border: "1px solid #d4b86a", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none" }}
                      placeholder={`Pilihan ${String.fromCharCode(64 + n)}`} />
                  </div>
                );
              })}
            </div>
          )}

          {form.tipe_soal === "Benar/Salah" && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 6 }}>Pernyataan (Benar/Salah)</label>
              {[1, 2, 3, 4].map((n) => {
                const answer = (form.jawaban_benar || "").split("|")[n - 1] || "";
                return (
                  <div key={n} style={{ marginBottom: 8, padding: 8, border: "1px solid #f0e0c0", borderRadius: 6, background: "#fefae8" }}>
                    <div style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", marginBottom: 4 }}>Pernyataan {n}:</div>
                    <input type="text" value={form[`pilihan_${n}`] || ""}
                      onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
                      style={{ width: "100%", border: "1px solid #d4b86a", borderRadius: 6, padding: "6px 10px", fontSize: 12, outline: "none", marginBottom: 4, boxSizing: "border-box" }}
                      placeholder={`Teks pernyataan ${n}`} />
                    <div style={{ display: "flex", gap: 12 }}>
                      <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="radio" name={`bs_${n}`} checked={answer === "Benar"}
                          onChange={() => {
                            const arr = (form.jawaban_benar || "").split("|");
                            arr[n - 1] = "Benar";
                            onChange({ ...form, jawaban_benar: arr.join("|") });
                          }} style={{ accentColor: "#28a745" }} /> Benar
                      </label>
                      <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer" }}>
                        <input type="radio" name={`bs_${n}`} checked={answer === "Salah"}
                          onChange={() => {
                            const arr = (form.jawaban_benar || "").split("|");
                            arr[n - 1] = "Salah";
                            onChange({ ...form, jawaban_benar: arr.join("|") });
                          }} style={{ accentColor: "#cc0033" }} /> Salah
                      </label>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {form.tipe_soal === "Menjodohkan" && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 6 }}>Pasangan (Kiri = Soal, Kanan = Jawaban)</label>
              {(() => {
                const pairs = (form.jawaban_benar || "").split("|").map((p) => {
                  const parts = p.split(":");
                  return { soal: parts[0] || "", jawab: parts.slice(1).join(":") || "" };
                });
                while (pairs.length < 8) pairs.push({ soal: "", jawab: "" });
                return pairs.map((pair, i) => (
                  <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#9a7a30", width: 16 }}>{i + 1}.</span>
                    <input type="text" value={pair.soal}
                      onChange={(e) => {
                        const p = [...pairs];
                        p[i].soal = e.target.value;
                        onChange({ ...form, jawaban_benar: p.filter((x) => x.soal || x.jawab).map((x) => `${x.soal}:${x.jawab}`).join("|") });
                      }}
                      style={{ flex: 1, border: "1px solid #d4b86a", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }}
                      placeholder="Pilihan kiri" />
                    <span style={{ color: "#9a7a30" }}>↔</span>
                    <input type="text" value={pair.jawab}
                      onChange={(e) => {
                        const p = [...pairs];
                        p[i].jawab = e.target.value;
                        onChange({ ...form, jawaban_benar: p.filter((x) => x.soal || x.jawab).map((x) => `${x.soal}:${x.jawab}`).join("|") });
                      }}
                      style={{ flex: 1, border: "1px solid #d4b86a", borderRadius: 6, padding: "5px 8px", fontSize: 12, outline: "none" }}
                      placeholder="Pasangan kanan" />
                  </div>
                ));
              })()}
            </div>
          )}

          {form.tipe_soal === "Uraian" && (
            <div>
              <label style={{ display: "block", fontSize: 10, fontWeight: 700, color: "#7a5a20", marginBottom: 4 }}>Kunci Jawaban (opsional)</label>
              <textarea value={form.jawaban_benar}
                onChange={(e) => onChange({ ...form, jawaban_benar: e.target.value })}
                style={{ width: "100%", border: "1px solid #d4b86a", borderRadius: 6, padding: "8px 10px", fontSize: 12, outline: "none", minHeight: 80, resize: "vertical", boxSizing: "border-box" }}
                placeholder="Tulis jawaban referensi untuk koreksi manual..." />
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

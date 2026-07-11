import { useRef, useState } from "react";
import Icon from "../Icon";
import RichEditor from "../RichEditor";
import ModalEquation from "./ModalEquation";

const QUESTION_TYPES = [
  "Pilihan Ganda", "Pilihan Ganda Kompleks", "Benar/Salah", "Menjodohkan", "Uraian",
];

const inputBase = {
  border: "1px solid #d4b86a", borderRadius: 6, padding: "6px 10px",
  fontSize: 12, outline: "none",
};

const groupBox = {
  padding: 10, border: "1px solid #f0e0c0", borderRadius: 8,
  background: "#fefae8", marginBottom: 6,
};

export default function ModalButirSoal({ editId, form, saving, onClose, onSave, onChange }) {
  const editorRef = useRef(null);
  const [showEquation, setShowEquation] = useState(false);

  const handleEquationInsert = (latex) => {
    if (editorRef.current) {
      editorRef.current.insertMathInline(latex);
    }
  };

  const optLabel = (n) => String.fromCharCode(64 + n);

  const renderPilihanGanda = () => (
    <div>
      <label>Pilihan Jawaban</label>
      {[1, 2, 3, 4].map((n) => (
        <div key={n} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
          <input type="radio" name="pg_jawaban" checked={form.jawaban_benar === `pilihan_${n}`}
            onChange={() => onChange({ ...form, jawaban_benar: `pilihan_${n}` })}
            style={{ accentColor: "#b89440", width: "auto" }} />
          <span style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", width: 20, flexShrink: 0 }}>{optLabel(n)}.</span>
          <input type="text" value={form[`pilihan_${n}`] || ""}
            onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
            style={{ ...inputBase, flex: 1 }} placeholder={`Pilihan ${optLabel(n)}`} />
        </div>
      ))}
    </div>
  );

  const renderPilihanGandaKompleks = () => (
    <div>
      <label>Pilihan Jawaban <span style={{ fontWeight: 400, textTransform: "none", color: "#9a7a30" }}>(centang yang benar)</span></label>
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
              style={{ accentColor: "#b89440", width: "auto" }} />
            <span style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", width: 20, flexShrink: 0 }}>{optLabel(n)}.</span>
            <input type="text" value={form[`pilihan_${n}`] || ""}
              onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
              style={{ ...inputBase, flex: 1 }} placeholder={`Pilihan ${optLabel(n)}`} />
          </div>
        );
      })}
    </div>
  );

  const renderBenarSalah = () => (
    <div>
      <label>Pernyataan <span style={{ fontWeight: 400, textTransform: "none", color: "#9a7a30" }}>(pilih Benar/Salah)</span></label>
      {[1, 2, 3, 4].map((n) => {
        const answer = (form.jawaban_benar || "").split("|")[n - 1] || "";
        return (
          <div key={n} style={groupBox}>
            <div style={{ fontSize: 11, fontWeight: 600, color: "#5a3a00", marginBottom: 4 }}>Pernyataan {n}:</div>
            <input type="text" value={form[`pilihan_${n}`] || ""}
              onChange={(e) => onChange({ ...form, [`pilihan_${n}`]: e.target.value })}
              style={{ ...inputBase, width: "100%", boxSizing: "border-box", marginBottom: 6 }}
              placeholder={`Teks pernyataan ${n}`} />
            <div style={{ display: "flex", gap: 14 }}>
              <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0, textTransform: "none" }}>
                <input type="radio" name={`bs_${n}`} checked={answer === "Benar"}
                  onChange={() => {
                    const arr = (form.jawaban_benar || "").split("|");
                    arr[n - 1] = "Benar";
                    onChange({ ...form, jawaban_benar: arr.join("|") });
                  }} style={{ accentColor: "#28a745", width: "auto" }} /> Benar
              </label>
              <label style={{ fontSize: 11, display: "flex", alignItems: "center", gap: 4, cursor: "pointer", margin: 0, textTransform: "none" }}>
                <input type="radio" name={`bs_${n}`} checked={answer === "Salah"}
                  onChange={() => {
                    const arr = (form.jawaban_benar || "").split("|");
                    arr[n - 1] = "Salah";
                    onChange({ ...form, jawaban_benar: arr.join("|") });
                  }} style={{ accentColor: "#cc0033", width: "auto" }} /> Salah
              </label>
            </div>
          </div>
        );
      })}
    </div>
  );

  const renderMenjodohkan = () => (
    <div>
      <label>Pasangan <span style={{ fontWeight: 400, textTransform: "none", color: "#9a7a30" }}>(kiri = soal, kanan = jawaban)</span></label>
      {(() => {
        const pairs = (form.jawaban_benar || "").split("|").map((p) => {
          const parts = p.split(":");
          return { soal: parts[0] || "", jawab: parts.slice(1).join(":") || "" };
        });
        while (pairs.length < 8) pairs.push({ soal: "", jawab: "" });
        return pairs.map((pair, i) => (
          <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, alignItems: "center" }}>
            <span style={{ fontSize: 10, fontWeight: 700, color: "#9a7a30", width: 16, flexShrink: 0 }}>{i + 1}.</span>
            <input type="text" value={pair.soal}
              onChange={(e) => {
                const p = [...pairs];
                p[i].soal = e.target.value;
                onChange({ ...form, jawaban_benar: p.filter((x) => x.soal || x.jawab).map((x) => `${x.soal}:${x.jawab}`).join("|") });
              }}
              style={{ ...inputBase, flex: 1 }} placeholder="Pilihan kiri" />
            <span style={{ color: "#9a7a30", flexShrink: 0 }}>↔</span>
            <input type="text" value={pair.jawab}
              onChange={(e) => {
                const p = [...pairs];
                p[i].jawab = e.target.value;
                onChange({ ...form, jawaban_benar: p.filter((x) => x.soal || x.jawab).map((x) => `${x.soal}:${x.jawab}`).join("|") });
              }}
              style={{ ...inputBase, flex: 1 }} placeholder="Pasangan kanan" />
          </div>
        ));
      })()}
    </div>
  );

  const renderUraian = () => (
    <div>
      <label>Kunci Jawaban <span style={{ fontWeight: 400, textTransform: "none", color: "#9a7a30" }}>(opsional)</span></label>
      <textarea value={form.jawaban_benar}
        onChange={(e) => onChange({ ...form, jawaban_benar: e.target.value })}
        placeholder="Tulis jawaban referensi untuk koreksi manual..."
        rows={4} />
    </div>
  );

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div style={{ display: "flex", gap: 4, alignItems: "flex-start", flexWrap: "wrap", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
        <div className="modal-card" style={{ maxWidth: 720, display: showEquation ? "none" : "" }}>
          <div className="modal-head">
            <h3>
              <Icon name="pencil" size={15} style={{ marginRight: 6, opacity: 0.7 }} />
              {editId ? "Edit Butir Soal" : "Tambah Butir Soal"}
            </h3>
            <button className="modal-close" onClick={onClose}><Icon name="x" size={18} /></button>
          </div>

          <div className="modal-body" style={{ maxHeight: "75vh", overflowY: "auto" }}>
            <div className="input-wrap" style={{ marginBottom: 14 }}>
              <label>Tipe Soal</label>
              <select value={form.tipe_soal}
                onChange={(e) => onChange({ ...form, tipe_soal: e.target.value, jawaban_benar: "" })}>
                {QUESTION_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>

            <div className="input-wrap" style={{ marginBottom: 16 }}>
              <label>Pertanyaan</label>
              <RichEditor ref={editorRef}
                value={form.pertanyaan}
                onChange={(html) => onChange({ ...form, pertanyaan: html })}
                placeholder="Tulis pertanyaan di sini..."
                minHeight={120}
                onEquationClick={() => setShowEquation(true)} />
            </div>

            <div style={{ borderTop: "1px solid #e8d8a8", paddingTop: 14, marginBottom: 4 }}>
              {form.tipe_soal === "Pilihan Ganda" && renderPilihanGanda()}
              {form.tipe_soal === "Pilihan Ganda Kompleks" && renderPilihanGandaKompleks()}
              {form.tipe_soal === "Benar/Salah" && renderBenarSalah()}
              {form.tipe_soal === "Menjodohkan" && renderMenjodohkan()}
              {form.tipe_soal === "Uraian" && renderUraian()}
            </div>
          </div>

          <div className="modal-foot">
            <button className="btn-cancel" onClick={onClose} type="button">Batal</button>
            <button className="btn-primary" onClick={onSave} disabled={saving}
              style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Icon name="save" size={14} />
              {saving ? "Menyimpan..." : "Simpan"}
            </button>
          </div>
        </div>

        {showEquation && (
          <ModalEquation
            onInsert={handleEquationInsert}
            onClose={() => setShowEquation(false)}
          />
        )}
      </div>
    </div>
  );
}

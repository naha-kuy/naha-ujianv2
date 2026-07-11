import { useState, useMemo, useCallback } from "react";
import katex from "katex";
import Icon from "../Icon";

const commonSymbols = [
  { label: "\\frac{a}{b}", insert: "\\frac{}{}" },
  { label: "\\sqrt{x}", insert: "\\sqrt{}" },
  { label: "x^2", insert: "^{}" },
  { label: "x_2", insert: "_{}" },
  { label: "\\int", insert: "\\int" },
  { label: "\\sum", insert: "\\sum" },
  { label: "\\pi", insert: "\\pi" },
  { label: "\\alpha", insert: "\\alpha" },
  { label: "\\beta", insert: "\\beta" },
  { label: "\\theta", insert: "\\theta" },
  { label: "\\infty", insert: "\\infty" },
  { label: "\\leq", insert: "\\leq" },
  { label: "\\geq", insert: "\\geq" },
  { label: "\\neq", insert: "\\neq" },
  { label: "\\times", insert: "\\times" },
  { label: "\\pm", insert: "\\pm" },
  { label: "\\rightarrow", insert: "\\rightarrow" },
  { label: "\\Rightarrow", insert: "\\Rightarrow" },
];

const inputStyle = {
  width: "100%",
  border: "1px solid #d4b86a",
  borderRadius: 6,
  padding: "8px 10px",
  fontSize: 13,
  fontFamily: '"Courier New", monospace',
  outline: "none",
  background: "rgba(255,255,255,0.9)",
  color: "#2a1200",
  boxSizing: "border-box",
  resize: "vertical",
};

const SYMBOL_BTN = {
  padding: "4px 8px",
  border: "1px solid #d4b86a",
  borderRadius: 4,
  background: "rgba(206,173,106,0.08)",
  cursor: "pointer",
  fontSize: 11,
  fontFamily: '"Courier New", monospace',
  color: "#5a3a00",
  transition: "all 0.12s",
  lineHeight: 1.2,
};

export default function ModalEquation({ onInsert, onClose }) {
  const [latex, setLatex] = useState("");
  const [error, setError] = useState("");
  const [displayMode, setDisplayMode] = useState(false);

  const previewHtml = useMemo(() => {
    if (!latex.trim()) return "";
    try {
      setError("");
      return katex.renderToString(latex, {
        displayMode,
        throwOnError: false,
        output: "html",
      });
    } catch (e) {
      setError("Error: " + e.message);
      return "";
    }
  }, [latex, displayMode]);

  const insertSymbol = useCallback((sym) => {
    setLatex((prev) => prev + sym);
  }, []);

  const handleInsert = () => {
    if (!latex.trim()) return;
    onInsert(latex);
    onClose();
  };

  return (
    <div className="equation-panel" onClick={(e) => e.stopPropagation()}>
      <div className="equation-panel-head">
        <h3>
          <Icon name="graduation" size={14} /> Equation Editor
        </h3>
        <button className="modal-close" onClick={onClose}><Icon name="x" size={16} /></button>
      </div>

      <div className="equation-panel-body">
        <div className="equation-section">
          <label>Input LaTeX</label>
          <textarea
            value={latex}
            onChange={(e) => setLatex(e.target.value)}
            placeholder="\\frac{x^2 + y^2}{a^2 - b^2}"
            rows={5}
            style={inputStyle}
            spellCheck={false}
          />
        </div>

        <div className="equation-section">
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 6 }}>
            <label style={{ margin: 0 }}>Preview</label>
            <label style={{ display: "flex", alignItems: "center", gap: 6, cursor: "pointer", fontSize: 10, fontWeight: 600, color: "#7a5a20" }}>
              <input type="checkbox" checked={displayMode}
                onChange={(e) => setDisplayMode(e.target.checked)}
                style={{ accentColor: "#b89440", width: "auto" }} />
              Display mode
            </label>
          </div>
          <div className="equation-preview">
            {previewHtml ? (
              <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
            ) : (
              <span className="equation-preview-placeholder">Hasil preview akan muncul di sini...</span>
            )}
          </div>
          {error && <div style={{ color: "#cc0033", fontSize: 10, fontWeight: 600, marginTop: 4 }}>{error}</div>}
        </div>

        <div className="equation-section">
          <label>Simbol Cepat</label>
          <div className="equation-symbols">
            {commonSymbols.map((s) => (
              <button key={s.label} type="button" style={SYMBOL_BTN}
                onMouseEnter={(e) => { e.target.style.background = "rgba(206,173,106,0.2)"; e.target.style.borderColor = "#b89440"; }}
                onMouseLeave={(e) => { e.target.style.background = "rgba(206,173,106,0.08)"; e.target.style.borderColor = "#d4b86a"; }}
                onClick={() => insertSymbol(s.insert)}>{s.label}</button>
            ))}
          </div>
        </div>
      </div>

      <div className="equation-panel-foot">
        <button className="btn-cancel" onClick={onClose} type="button">Batal</button>
        <button className="btn-primary" onClick={handleInsert} disabled={!latex.trim()}
          type="button" style={{ display: "flex", alignItems: "center", gap: 6 }}>
          <Icon name="check" size={14} /> Insert
        </button>
      </div>
    </div>
  );
}

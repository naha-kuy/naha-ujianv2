import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";
import { getCurrentUser, logout, createStudent } from "../../controllers/AuthController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";

export default function AdminImportSiswa() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const fileRef = useRef(null);
  const handleLogout = () => { logout(); navigate("/"); };

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState([]);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const downloadTemplate = () => {
    const wb = XLSX.utils.book_new();
    const data = [
      ["Nama Lengkap", "Username", "Password", "Email", "Kelas", "Jurusan", "Rombel"],
      ["Contoh: Ahmad Fauzi", "ahmad", "ahmad123", "ahmad@sekolah.sch.id", "12", "IPA", "A"],
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    ws["!cols"] = [{ wch: 25 }, { wch: 15 }, { wch: 15 }, { wch: 25 }, { wch: 8 }, { wch: 10 }, { wch: 8 }];
    XLSX.utils.book_append_sheet(wb, ws, "Siswa");
    XLSX.writeFile(wb, "template_import_siswa.xlsx");
  };

  const handleFile = (e) => {
    const f = e.target.files[0];
    if (!f) return;
    setFile(f);
    setError("");
    setResult(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const wb = XLSX.read(evt.target.result, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1 });

        if (rows.length < 2) {
          setError("File Excel kosong atau tidak memiliki data");
          return;
        }

        const parsed = [];
        for (let i = 1; i < rows.length; i++) {
          const r = rows[i];
          if (!r[0] || !r[1] || !r[2]) continue;
          parsed.push({
            name: String(r[0] || "").trim(),
            username: String(r[1] || "").trim(),
            password: String(r[2] || "").trim(),
            email: String(r[3] || "").trim() || null,
            kelas: String(r[4] || "").trim() || null,
            jurusan: String(r[5] || "").trim() || null,
            student_group: String(r[6] || "").trim() || null,
          });
        }

        if (parsed.length === 0) {
          setError("Tidak ada data valid ditemukan. Pastikan format sesuai template.");
          return;
        }

        setPreview(parsed);
      } catch (err) {
        setError("Gagal membaca file Excel: " + err.message);
      }
    };
    reader.readAsArrayBuffer(f);
  };

  const doImport = async () => {
    if (preview.length === 0) return;
    setImporting(true);
    setError("");
    setResult(null);

    let berhasil = 0;
    let gagal = 0;
    let duplikat = 0;

    for (let i = 0; i < preview.length; i++) {
      const s = preview[i];
      setProgress({ current: i + 1, total: preview.length });

      const r = await createStudent({
        name: s.name,
        username: s.username,
        password: s.password,
        email: s.email,
        kelas: s.kelas,
        jurusan: s.jurusan,
        student_group: s.student_group,
      });

      if (r.success) {
        berhasil++;
      } else {
        if (r.message?.toLowerCase().includes("sudah terdaftar")) {
          duplikat++;
        } else {
          gagal++;
        }
      }
    }

    setResult({ berhasil, gagal, duplikat });
    setImporting(false);
    setProgress({ current: 0, total: 0 });
  };

  const resetForm = () => {
    setFile(null);
    setPreview([]);
    setResult(null);
    setError("");
    setProgress({ current: 0, total: 0 });
    if (fileRef.current) fileRef.current.value = "";
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content" style={{ maxWidth: 800 }}>
          {error && (
            <div className="alert-anim" style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>
              <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} /> {error}
            </div>
          )}

          {result && (
            <div className="alert-anim" style={{
              marginBottom: 12, borderRadius: 8, padding: "12px 16px", fontSize: 12,
              background: result.berhasil > 0 ? "rgba(30,80,16,0.08)" : "rgba(208,53,53,0.1)",
              border: result.berhasil > 0 ? "1px solid rgba(30,80,16,0.15)" : "1px solid rgba(208,53,53,0.2)",
              color: result.berhasil > 0 ? "#1e5010" : "#b02020", fontWeight: 600,
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>Import Selesai!</span>
                <button onClick={() => setResult(null)} style={{ background: "none", border: "none", cursor: "pointer", color: "inherit", padding: 0 }}><Icon name="x" size={14} /></button>
              </div>
              <div style={{ marginTop: 6, display: "flex", gap: 16, fontSize: 13 }}>
                <span>✅ Berhasil: <strong>{result.berhasil}</strong></span>
                <span>⚠️ Duplikat: <strong>{result.duplikat}</strong></span>
                <span>❌ Gagal: <strong>{result.gagal}</strong></span>
              </div>
            </div>
          )}

          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
              <div>
                <button onClick={() => navigate("/admin/siswa")} style={{ background: "none", border: "none", cursor: "pointer", color: "#b89440", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <Icon name="chevron-left" size={14} /> Kembali ke Manajemen Siswa
                </button>
                <h1 style={{ fontSize: 18, display: "flex", alignItems: "center", gap: 8 }}>
                  <Icon name="save" size={20} /> Import Siswa dari Excel
                </h1>
              </div>
              <button className="btn-primary" onClick={downloadTemplate} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                <Icon name="save" size={14} /> Download Template
              </button>
            </div>

            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 16 }}>
              Upload file Excel (.xlsx) dengan format yang sesuai. Gunakan tombol <strong>Download Template</strong> untuk melihat format yang benar.
            </p>

            {/* Upload area */}
            <div style={{
              border: "2px dashed #d4b86a", borderRadius: 12, padding: 24, textAlign: "center",
              background: "rgba(255,255,255,0.5)", marginBottom: 16,
            }}>
              <Icon name="save" size={32} style={{ color: "#d4b86a", opacity: 0.5, marginBottom: 8 }} />
              <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 8 }}>Pilih file Excel (.xlsx) yang berisi data siswa</p>
              <input type="file" ref={fileRef} accept=".xlsx,.xls" onChange={handleFile}
                style={{ fontSize: 12, padding: "6px 12px", width: "auto", display: "inline-block" }} />
              {file && <p style={{ fontSize: 11, color: "#5a3a00", marginTop: 6 }}>File: {file.name}</p>}
            </div>

            {/* Preview Table */}
            {preview.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: "#5a3a00", marginBottom: 8 }}>
                  Pratinjau: {preview.length} data siap diimport
                </p>
                <div className="table-wrap" style={{ maxHeight: 240, overflowY: "auto" }}>
                  <table className="approval-table" style={{ fontSize: 11 }}>
                    <thead>
                      <tr>
                        <th>No</th>
                        <th>Nama</th>
                        <th>Username</th>
                        <th>Email</th>
                        <th>Kelas</th>
                        <th>Jurusan</th>
                        <th>Rombel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {preview.map((s, i) => (
                        <tr key={i}>
                          <td>{i + 1}</td>
                          <td className="td-name">{s.name}</td>
                          <td style={{ fontFamily: "monospace", fontSize: 11 }}>{s.username}</td>
                          <td style={{ fontSize: 11, color: "#7a5a20" }}>{s.email || "-"}</td>
                          <td>{s.kelas || "-"}</td>
                          <td>{s.jurusan || "-"}</td>
                          <td>{s.student_group || "-"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Progress bar */}
            {importing && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#9a7a30", marginBottom: 4 }}>
                  <span>Mengimport data...</span>
                  <span>{progress.current} / {progress.total}</span>
                </div>
                <div style={{ width: "100%", height: 8, background: "#f0e0c0", borderRadius: 4, overflow: "hidden" }}>
                  <div style={{
                    width: `${(progress.current / progress.total) * 100}%`, height: "100%",
                    background: "linear-gradient(90deg, #28a745, #1e7e34)", borderRadius: 4,
                    transition: "width 0.3s ease",
                  }} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8 }}>
              {preview.length > 0 && !importing && (
                <button className="btn-success" onClick={doImport} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="save" size={14} /> Import {preview.length} Siswa
                </button>
              )}
              {(preview.length > 0 || file) && !importing && (
                <button className="btn-cancel" onClick={resetForm}>Reset</button>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
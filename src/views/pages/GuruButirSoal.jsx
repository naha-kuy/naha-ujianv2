import { useState, useEffect, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import {
  getButirSoalList, createButirSoal, updateButirSoal, deleteButirSoal, getNextNomer,
} from "../../controllers/SoalController";
import * as XLSX from "xlsx";
import GuruSidebar from "../components/sidebars/GuruSidebar";
import Icon from "../components/Icon";
import { TableSkeleton } from "../components/Skeleton";
import ModalButirSoal from "../components/modal/ModalButirSoal";
import ModalConfirm from "../components/modal/ModalConfirm";

const QUESTION_TYPES = [
  "Pilihan Ganda", "Pilihan Ganda Kompleks", "Benar/Salah", "Menjodohkan", "Uraian",
];

function typeBadge(t) {
  const colors = {
    "Pilihan Ganda": ["#17a2b8", "#9fd6e8"],
    "Pilihan Ganda Kompleks": ["#6f42c1", "#c9a8e8"],
    "Benar/Salah": ["#fd7e14", "#fbc99d"],
    "Menjodohkan": ["#28a745", "#a5d6a7"],
    "Uraian": ["#dc3545", "#f0a0a0"],
  };
  const [bg, border] = colors[t] || ["#6c757d", "#ccc"];
  return <span style={{ display: "inline-block", padding: "2px 8px", borderRadius: 20, fontSize: 9, fontWeight: 700, background: bg + "1a", color: bg, border: `1px solid ${border}` }}>{t}</span>;
}

export default function GuruButirSoal() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const kode_soal = params.get("kode_soal");
  const nama_soal = params.get("nama") || "Soal";

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({
    nomer_soal: "", tipe_soal: "Pilihan Ganda", pertanyaan: "",
    pilihan_1: "", pilihan_2: "", pilihan_3: "", pilihan_4: "", jawaban_benar: "",
  });
  const [saving, setSaving] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);

  const handleLogout = () => { logout(); navigate("/"); };

  const fetchData = useCallback(async () => {
    if (!kode_soal) return;
    setLoading(true); setError("");
    const r = await getButirSoalList(kode_soal);
    if (r.success) setData(r.data); else setError(r.message);
    setLoading(false);
  }, [kode_soal]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const back = () => navigate("/guru/bank-soal");

  const openAdd = async () => {
    const next = await getNextNomer(kode_soal);
    setEditId(null);
    setForm({
      nomer_soal: next.success ? next : 1,
      tipe_soal: "Pilihan Ganda", pertanyaan: "",
      pilihan_1: "", pilihan_2: "", pilihan_3: "", pilihan_4: "", jawaban_benar: "",
    });
    setShowForm(true);
  };

  const openEdit = (q) => {
    setEditId(q.id_soal);
    setForm({
      nomer_soal: q.nomer_soal, tipe_soal: q.tipe_soal,
      pertanyaan: q.pertanyaan || "",
      pilihan_1: q.pilihan_1 || "", pilihan_2: q.pilihan_2 || "",
      pilihan_3: q.pilihan_3 || "", pilihan_4: q.pilihan_4 || "",
      jawaban_benar: q.jawaban_benar || "",
    });
    setShowForm(true);
  };

  const handleSave = async () => {
    if (!form.pertanyaan.trim() || !form.nomer_soal) {
      setError("Pertanyaan dan nomor soal wajib diisi"); return;
    }
    setSaving(true); setError(""); setSuccess("");
    const payload = { ...form, kode_soal, nomer_soal: parseInt(form.nomer_soal) };
    const r = editId ? await updateButirSoal(editId, payload) : await createButirSoal(payload);
    setSaving(false);
    if (r.success) {
      setSuccess(editId ? "Butir soal diperbarui" : "Butir soal ditambahkan");
      setShowForm(false); await fetchData();
    } else {
      setError(r.message);
    }
  };

  const handleDelete = async (id) => {
    setSaving(true); setError(""); setSuccess("");
    const r = await deleteButirSoal(id);
    setSaving(false);
    if (r.success) { setSuccess("Butir soal dihapus"); setShowDeleteConfirm(null); await fetchData(); }
    else setError(r.message);
  };

  const stripHtml = (html) => {
    const d = document.createElement("div");
    d.innerHTML = html;
    return d.textContent || d.innerText || "";
  };

  const exportExcel = () => {
    const rows = data.map((q, i) => ({
      No: i + 1,
      "Nomor Soal": q.nomer_soal,
      Pertanyaan: stripHtml(q.pertanyaan),
      "Tipe Soal": q.tipe_soal,
      "Pilihan 1": stripHtml(q.pilihan_1 || ""),
      "Pilihan 2": stripHtml(q.pilihan_2 || ""),
      "Pilihan 3": stripHtml(q.pilihan_3 || ""),
      "Pilihan 4": stripHtml(q.pilihan_4 || ""),
      "Jawaban Benar": q.jawaban_benar || "",
      Status: q.status_soal || "",
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Butir Soal");
    XLSX.writeFile(wb, `butir_soal_${kode_soal}.xlsx`);
  };

  return (
    <div className="dash-layout">
      <GuruSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          {error && <div className="alert-anim" style={{ background: "rgba(208,53,53,0.1)", border: "1px solid rgba(208,53,53,0.2)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#b02020", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{error}</div>}
          {success && <div className="alert-anim" style={{ background: "rgba(30,80,16,0.08)", border: "1px solid rgba(30,80,16,0.15)", borderRadius: 8, padding: "10px 14px", fontSize: 12, color: "#1e5010", textAlign: "center", fontWeight: 600, marginBottom: 12 }}>{success}</div>}

          <div className="welcome-card" style={{ padding: "16px 20px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <div>
                <button onClick={back} style={{ background: "none", border: "none", cursor: "pointer", color: "#b89440", fontSize: 12, display: "flex", alignItems: "center", gap: 4, marginBottom: 4 }}>
                  <Icon name="chevron-left" size={14} /> Kembali
                </button>
                <h1 style={{ fontSize: 17 }}>Butir Soal — {nama_soal}</h1>
                <span style={{ fontSize: 11, color: "#9a7a30" }}>Kode: {kode_soal} | {data.length} soal</span>
              </div>
              <div style={{ display: "flex", gap: 6 }}>
                {data.length > 0 && (
                  <button onClick={exportExcel}
                    style={{ padding: "6px 14px", background: "#28a745", color: "white", border: "none", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: 4 }}>
                    <Icon name="save" size={12} /> Export Excel
                  </button>
                )}
                <button className="btn-primary" onClick={openAdd} style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Icon name="save" size={14} /> Tambah Butir
                </button>
              </div>
            </div>

            {data.length > 0 && (
              <div style={{ display: "flex", gap: 6, marginBottom: 12, flexWrap: "wrap" }}>
                {QUESTION_TYPES.map((t) => {
                  const count = data.filter((q) => q.tipe_soal === t).length;
                  return count > 0 ? <span key={t}>{typeBadge(t)} <span style={{ fontSize: 10, color: "#9a7a30" }}>{count}x</span></span> : null;
                })}
              </div>
            )}

            {loading ? <TableSkeleton rows={3} cols={5} /> : data.length === 0 ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#9a7a30" }}>
                <Icon name="page" size={36} style={{ opacity: 0.4, marginBottom: 10 }} />
                <p style={{ fontSize: 13 }}>Belum ada butir soal.</p>
              </div>
            ) : (
              <div className="table-wrap">
                <table className="approval-table">
                  <thead>
                    <tr>
                      <th style={{ width: 50 }}>No</th>
                      <th>Pertanyaan</th>
                      <th style={{ width: 130 }}>Tipe</th>
                      <th style={{ width: 100 }}>Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((q) => (
                      <tr key={q.id_soal}>
                        <td style={{ fontWeight: 700 }}>{q.nomer_soal}</td>
                        <td style={{ fontSize: 12, maxWidth: 400, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {stripHtml(q.pertanyaan) || <span style={{ color: "#ccc", fontStyle: "italic" }}>(kosong)</span>}
                        </td>
                        <td>{typeBadge(q.tipe_soal)}</td>
                        <td className="td-actions">
                          <button className="action-btn" title="Edit"
                            onClick={() => openEdit(q)}
                            style={{ color: "#b89440", border: "1px solid #e0c878" }}>
                            <Icon name="edit" size={14} />
                          </button>
                          <button className="action-btn" title="Hapus"
                            onClick={() => setShowDeleteConfirm(q)}
                            style={{ color: "#cc0033", border: "1px solid #f5a0a0" }}>
                            <Icon name="trash" size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Add/Edit Question Modal */}
      {showForm && (
        <ModalButirSoal
          editId={editId}
          form={form}
          saving={saving}
          onClose={() => setShowForm(false)}
          onSave={handleSave}
          onChange={(f) => setForm(f)}
        />
      )}

      <ModalConfirm
        show={!!showDeleteConfirm}
        title="Hapus Butir Soal"
        message={`Yakin hapus soal nomor ${showDeleteConfirm?.nomer_soal || ""}?`}
        saving={saving}
        onClose={() => setShowDeleteConfirm(null)}
        onConfirm={() => handleDelete(showDeleteConfirm?.id_soal)}
      />
    </div>
  );
}

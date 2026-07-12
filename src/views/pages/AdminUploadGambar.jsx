import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useNotification } from "../../contexts/NotificationContext";
import { getCurrentUser, logout } from "../../controllers/AuthController";
import { uploadImage, getImageList, deleteImage } from "../../controllers/ExamController";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";

export default function AdminUploadGambar() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };
  const fileRef = useRef(null);

  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const notif = useNotification();
  const [preview, setPreview] = useState(null);

  const fetchImages = async () => {
    setLoading(true);
    const r = await getImageList("umum");
    if (r.success) setImages(r.data);
    else notif.addNotification("error", r.message);
    setLoading(false);
  };

  useEffect(() => { fetchImages(); }, []);

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const r = await uploadImage(file, "umum");
    setUploading(false);
    if (r.success) {
      notif.addNotification("success", "Gambar berhasil diupload!");
      fetchImages();
      if (fileRef.current) fileRef.current.value = "";
    } else {
      notif.addNotification("error", r.message);
    }
  };

  const handleDelete = async (path, name) => {
    if (!window.confirm(`Hapus "${name}"?`)) return;
    const r = await deleteImage(path);
    if (r.success) {
      notif.addNotification("success", "Gambar dihapus");
      fetchImages();
    } else {
      notif.addNotification("error", r.message);
    }
  };

  const copyUrl = (url) => {
    navigator.clipboard.writeText(url);
    notif.addNotification("success", "URL disalin!");
  };

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="welcome-card" style={{ padding: "20px 24px" }}>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Upload Gambar</h2>
            <p style={{ fontSize: 12, color: "#9a7a30", marginBottom: 16 }}>Upload gambar untuk digunakan di soal (max 2MB, format: JPG, PNG, GIF, WebP)</p>

            <div style={{
              border: "2px dashed #d4b86a", borderRadius: 12, padding: 24, textAlign: "center",
              background: "rgba(255,255,255,0.5)", marginBottom: 20,
            }}>
              <input type="file" ref={fileRef} accept="image/*" onChange={handleUpload}
                disabled={uploading} style={{ fontSize: 12 }} />
              {uploading && <p style={{ fontSize: 11, color: "#5a3a00", marginTop: 6 }}>Uploading...</p>}
            </div>

            {loading ? (
              <p style={{ textAlign: "center", color: "#9a7a30", fontSize: 12 }}>Memuat gambar...</p>
            ) : images.length === 0 ? (
              <div style={{ textAlign: "center", padding: 20, color: "#9a7a30", fontSize: 12 }}>
                <Icon name="save" size={32} style={{ opacity: 0.3, marginBottom: 8 }} /><br />
                Belum ada gambar.
              </div>
            ) : (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(160px, 1fr))", gap: 12 }}>
                {images.map((img) => (
                  <div key={img.name} style={{
                    border: "1px solid #e8d8a8", borderRadius: 8, overflow: "hidden", background: "white",
                  }}>
                    <div style={{
                      height: 120, background: "#f8f4ec", display: "flex", alignItems: "center", justifyContent: "center",
                      cursor: "pointer", overflow: "hidden",
                    }} onClick={() => setPreview(img.url)}>
                      <img src={img.url} alt={img.name} style={{ maxWidth: "100%", maxHeight: "100%", objectFit: "contain" }} />
                    </div>
                    <div style={{ padding: "6px 8px", fontSize: 10, color: "#9a7a30", wordBreak: "break-all" }}>
                      <div style={{ fontWeight: 600, color: "#5a3a00", marginBottom: 4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{img.name}</div>
                      <div style={{ display: "flex", gap: 4 }}>
                        <button onClick={() => copyUrl(img.url)} style={{ fontSize: 10, padding: "2px 6px", background: "#f0e8d8", border: "1px solid #d4b86a", borderRadius: 4, cursor: "pointer" }}>Copy URL</button>
                        <button onClick={() => handleDelete(`umum/${img.name}`, img.name)} style={{ fontSize: 10, padding: "2px 6px", background: "#fce8e8", border: "1px solid #f5a0a0", borderRadius: 4, color: "#cc0033", cursor: "pointer" }}>Hapus</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>

      {preview && (
        <div className="modal-backdrop" onClick={() => setPreview(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{ maxWidth: "90%", maxHeight: "90%" }}>
            <img src={preview} alt="Preview" style={{ maxWidth: "100%", maxHeight: "90vh", borderRadius: 8 }} />
            <button onClick={() => setPreview(null)} style={{ position: "absolute", top: 20, right: 30, color: "white", fontSize: 30, background: "none", border: "none", cursor: "pointer" }}>&times;</button>
          </div>
        </div>
      )}
    </div>
  );
}
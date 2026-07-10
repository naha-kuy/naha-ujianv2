import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout, updateProfile, changePassword } from "../../controllers/AuthController";
import GuruSidebar from "../components/sidebars/GuruSidebar";
import Icon from "../components/Icon";

export default function GuruProfil() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [fullName, setFullName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setMsg(null);

    if (!fullName.trim()) {
      setMsg({ type: "error", text: "Nama lengkap tidak boleh kosong" });
      return;
    }
    if (!username.trim()) {
      setMsg({ type: "error", text: "Username tidak boleh kosong" });
      return;
    }

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        setMsg({ type: "error", text: "Password lama harus diisi" });
        return;
      }
      if (newPassword.length < 6) {
        setMsg({ type: "error", text: "Password baru minimal 6 karakter" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setMsg({ type: "error", text: "Konfirmasi password tidak cocok" });
        return;
      }
    }

    setLoading(true);
    const profileRes = await updateProfile({ name: fullName, username });
    if (profileRes.success) {
      if (oldPassword && newPassword) {
        const passRes = await changePassword(oldPassword, newPassword);
        if (passRes.success) {
          setMsg({ type: "success", text: "Profil dan password berhasil diperbarui!" });
        } else {
          setMsg({ type: "error", text: passRes.message });
        }
      } else {
        setMsg({ type: "success", text: "Profil berhasil diperbarui!" });
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setMsg({ type: "error", text: profileRes.message });
    }
    setLoading(false);
  }

  return (
    <div className="dash-layout">
      <GuruSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content" style={{ maxWidth: "700px" }}>
          <div className="welcome-card" style={{ borderLeft: "5px solid #28a745" }}>
            <h1>Edit Profil Guru</h1>
            <p>Perbarui informasi profil dan password Anda</p>
          </div>

          {msg && (
            <div className={msg.type === "success" ? "alert-success" : "alert-error"}>
              {msg.text}
            </div>
          )}

          <div className="settings-panel">
            <form onSubmit={handleSubmit}>
              <div className="form-row">
                <div className="form-group">
                  <label>Nama Lengkap</label>
                  <input type="text" className="form-control" value={fullName}
                    onChange={(e) => setFullName(e.target.value)} required
                    placeholder="Masukkan nama lengkap" />
                  <div className="form-hint">Nama yang akan ditampilkan di sistem</div>
                </div>
                <div className="form-group">
                  <label>Username</label>
                  <input type="text" className="form-control" value={username}
                    onChange={(e) => setUsername(e.target.value)} required
                    placeholder="Masukkan username" />
                  <div className="form-hint">Username untuk login ke sistem</div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "2px solid #d4b86a", margin: "20px 0" }} />

              <p style={{ fontSize: "12px", color: "#9a7a30", marginBottom: "16px", fontWeight: 500 }}>
                  <Icon name="lock" size={14} /> Biarkan kolom password kosong jika tidak ingin mengubah password
              </p>

              <div className="form-row">
                <div className="form-group">
                  <label>Password Lama</label>
                  <input type="password" className="form-control" value={oldPassword}
                    onChange={(e) => setOldPassword(e.target.value)}
                    placeholder="Masukkan password lama" />
                </div>
                <div className="form-group"></div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Password Baru</label>
                  <input type="password" className="form-control" value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Minimal 6 karakter" />
                </div>
                <div className="form-group">
                  <label>Konfirmasi Password Baru</label>
                  <input type="password" className="form-control" value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ulangi password baru" />
                </div>
              </div>

              <button type="submit" className="btn-success" style={{ marginTop: "12px" }}
                disabled={loading || (newPassword !== "" && newPassword !== confirmPassword)}>
                {loading ? "Menyimpan..." : <><Icon name="person" size={16} /> Update Profil</>}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getCurrentUser, logout, updateProfile, changePassword } from "../../controllers/AuthController";
import { getSettings, updateSettings } from "../../models/settings";
import AdminSidebar from "../components/sidebars/AdminSidebar";
import Icon from "../components/Icon";

export default function AdminPengaturan() {
  const user = getCurrentUser();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); navigate("/"); };

  const [tab, setTab] = useState("settings");

  // Settings state
  const [appName, setAppName] = useState("CBT-Eschool");
  const [syncInterval, setSyncInterval] = useState(60);
  const [hideScores, setHideScores] = useState(false);
  const [allowMultipleLogin, setAllowMultipleLogin] = useState(false);
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsMsg, setSettingsMsg] = useState(null);

  // Profile state
  const [fullName, setFullName] = useState(user?.name || "");
  const [username, setUsername] = useState(user?.username || "");
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [profileMsg, setProfileMsg] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setSettingsLoading(true);
    const res = await getSettings();
    if (res.success) {
      setAppName(res.data.app_name || "CBT-Eschool");
      setSyncInterval(res.data.sync_interval_seconds || 60);
      setHideScores(res.data.hide_scores || false);
      setAllowMultipleLogin(res.data.allow_multiple_login || false);
    }
    setSettingsLoading(false);
  }

  async function handleSaveSettings(e) {
    e.preventDefault();
    setSettingsMsg(null);

    if (syncInterval < 60) {
      setSettingsMsg({ type: "error", text: "Waktu sinkronisasi minimal 60 detik" });
      return;
    }

    const res = await updateSettings({
      app_name: appName,
      sync_interval_seconds: parseInt(syncInterval),
      hide_scores: hideScores,
      allow_multiple_login: allowMultipleLogin,
    });

    if (res.success) {
      setSettingsMsg({ type: "success", text: "Pengaturan berhasil disimpan!" });
    } else {
      setSettingsMsg({ type: "error", text: res.message });
    }
  }

  async function handleUpdateProfile(e) {
    e.preventDefault();
    setProfileMsg(null);

    if (!fullName.trim()) {
      setProfileMsg({ type: "error", text: "Nama lengkap tidak boleh kosong" });
      return;
    }
    if (!username.trim()) {
      setProfileMsg({ type: "error", text: "Username tidak boleh kosong" });
      return;
    }

    if (oldPassword || newPassword || confirmPassword) {
      if (!oldPassword) {
        setProfileMsg({ type: "error", text: "Password lama harus diisi" });
        return;
      }
      if (newPassword.length < 6) {
        setProfileMsg({ type: "error", text: "Password baru minimal 6 karakter" });
        return;
      }
      if (newPassword !== confirmPassword) {
        setProfileMsg({ type: "error", text: "Konfirmasi password tidak cocok" });
        return;
      }
    }

    setProfileLoading(true);
    const profileRes = await updateProfile({ name: fullName, username });
    if (profileRes.success) {
      if (oldPassword && newPassword) {
        const passRes = await changePassword(oldPassword, newPassword);
        if (passRes.success) {
          setProfileMsg({ type: "success", text: "Profil dan password berhasil diperbarui!" });
        } else {
          setProfileMsg({ type: "error", text: passRes.message });
        }
      } else {
        setProfileMsg({ type: "success", text: "Profil berhasil diperbarui!" });
      }
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } else {
      setProfileMsg({ type: "error", text: profileRes.message });
    }
    setProfileLoading(false);
  }

  return (
    <div className="dash-layout">
      <AdminSidebar userName={user?.name} onLogout={handleLogout} />
      <main className="dash-main">
        <div className="dash-content">
          <div className="settings-tabs">
            <button className={`settings-tab ${tab === "settings" ? "active" : ""}`} onClick={() => setTab("settings")}>
              <Icon name="gear" size={16} /> Pengaturan Aplikasi
            </button>
            <button className={`settings-tab ${tab === "profile" ? "active" : ""}`} onClick={() => setTab("profile")}>
              <Icon name="person" size={16} /> Edit Profil
            </button>
          </div>

          {tab === "settings" && (
            <div className="settings-panel">
              {settingsMsg && (
                <div className={settingsMsg.type === "success" ? "alert-success" : "alert-error"}>
                  {settingsMsg.text}
                </div>
              )}
              {settingsLoading ? (
                <div className="loading-text">Memuat pengaturan...</div>
              ) : (
                <form onSubmit={handleSaveSettings}>
                  <div className="form-row">
                    <div className="form-group">
                      <label>Nama Aplikasi</label>
                      <input type="text" className="form-control" value={appName}
                        onChange={(e) => setAppName(e.target.value)} required
                        placeholder="Masukkan nama aplikasi" />
                      <div className="form-hint">Nama yang akan ditampilkan di aplikasi</div>
                    </div>
                    <div className="form-group">
                      <label>Waktu Sinkronisasi</label>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <input type="number" className="form-control" value={syncInterval}
                          onChange={(e) => setSyncInterval(e.target.value)} min="60" required
                          style={{ width: "120px" }} />
                        <span style={{ fontSize: "12px", color: "#9a7a30", fontWeight: 500 }}>detik</span>
                      </div>
                      <div className="form-hint">Interval penyimpanan otomatis jawaban siswa (min 60 detik)</div>
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group">
                      <label>Status Login Ganda</label>
                      <select className="select-control" value={allowMultipleLogin ? "izinkan" : "blokir"}
                        onChange={(e) => setAllowMultipleLogin(e.target.value === "izinkan")}>
                        <option value="izinkan">Izinkan</option>
                        <option value="blokir">Blokir</option>
                      </select>
                      <div className="form-hint">Apakah siswa boleh login dari beberapa perangkat?</div>
                    </div>
                    <div className="form-group">
                      <label>Privasi Nilai Siswa</label>
                      <div className="toggle-wrap">
                        <div className={`toggle ${hideScores ? "on" : ""}`} onClick={() => setHideScores(!hideScores)}>
                          <div className="toggle-knob" />
                        </div>
                        <span className="toggle-label">{hideScores ? "Nilai disembunyikan" : "Nilai dapat dilihat siswa"}</span>
                      </div>
                      <div className="form-hint">Siswa tidak dapat melihat nilai ujian mereka jika diaktifkan</div>
                    </div>
                  </div>

                  <button type="submit" className="btn-primary" style={{ marginTop: "12px" }}>
                    <Icon name="save" size={16} /> Simpan Pengaturan
                  </button>
                </form>
              )}
            </div>
          )}

          {tab === "profile" && (
            <div className="settings-panel">
              {profileMsg && (
                <div className={profileMsg.type === "success" ? "alert-success" : "alert-error"}>
                  {profileMsg.text}
                </div>
              )}
              <form onSubmit={handleUpdateProfile}>
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
                    <div className="form-hint">Username untuk identifikasi (login pakai email)</div>
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
                  disabled={profileLoading || (newPassword !== "" && newPassword !== confirmPassword)}>
                  {profileLoading ? "Menyimpan..." : <><Icon name="person" size={16} /> Update Profil</>}
                </button>
              </form>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

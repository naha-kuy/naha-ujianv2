import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { login } from "../../controllers/AuthController";

const roleColors = {
  admin: "#dc3545",
  guru: "#28a745",
  siswa: "#007bff",
};

const roleInfo = {
  admin: { label: "Admin", icon: "🛡️" },
  guru: { label: "Guru", icon: "📚" },
  siswa: { label: "Siswa", icon: "🎓" },
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await login(username, password);
    setLoading(false);
    if (result.success) {
      navigate(`/${result.user.role}`);
    } else {
      setError(result.message);
    }
  };

  const fillCredential = (role) => {
    setSelectedRole(role);
    setUsername(role);
    setPassword(role);
    setError("");
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Selamat Datang</h1>
          <p>Silakan login untuk melanjutkan</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
            />
          </div>

          {error && <div className="error-msg">{error}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Memproses..." : "Masuk"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Belum punya akun? <Link to="/register">Daftar di sini</Link>
          </p>
        </div>

        <div className="role-selector">
          <p>Pilih角色 untuk login cepat:</p>
          <div className="role-buttons">
            {Object.entries(roleInfo).map(([role, info]) => (
              <button
                key={role}
                type="button"
                className={`role-btn ${selectedRole === role ? "active" : ""}`}
                style={{
                  "--role-color": roleColors[role],
                  borderColor: selectedRole === role ? roleColors[role] : "#ddd",
                }}
                onClick={() => fillCredential(role)}
              >
                <span className="role-icon">{info.icon}</span>
                <span className="role-label">{info.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

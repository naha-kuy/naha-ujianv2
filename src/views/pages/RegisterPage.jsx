import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { register } from "../../controllers/AuthController";

const roleOptions = [
  { value: "siswa", label: "Siswa", icon: "🎓" },
  { value: "guru", label: "Guru", icon: "📚" },
];

export default function RegisterPage() {
  const [form, setForm] = useState({ username: "", password: "", confirmPassword: "", name: "", role: "siswa" });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (form.password.length < 6) {
      setError("Password minimal 6 karakter");
      return;
    }
    if (form.password !== form.confirmPassword) {
      setError("Konfirmasi password tidak cocok");
      return;
    }

    setLoading(true);
    const result = await register({
      username: form.username,
      password: form.password,
      name: form.name,
      role: form.role,
    });
    setLoading(false);

    if (result.success) {
      setSuccess(result.message);
      setTimeout(() => navigate("/"), 2000);
    } else {
      setError(result.message);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-header">
          <h1>Daftar Akun</h1>
          <p>Buat akun baru untuk bergabung</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="name">Nama Lengkap</label>
            <input id="name" name="name" type="text" value={form.name} onChange={handleChange} placeholder="Masukkan nama lengkap" required />
          </div>

          <div className="form-group">
            <label htmlFor="username">Username</label>
            <input id="username" name="username" type="text" value={form.username} onChange={handleChange} placeholder="Masukkan username" required />
          </div>

          <div className="form-group">
            <label>Daftar Sebagai</label>
            <div className="role-buttons" style={{ marginTop: 6 }}>
              {roleOptions.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  className={`role-btn ${form.role === opt.value ? "active" : ""}`}
                  style={{
                    "--role-color": opt.value === "guru" ? "#28a745" : "#007bff",
                    borderColor: form.role === opt.value ? (opt.value === "guru" ? "#28a745" : "#007bff") : "#ddd",
                  }}
                  onClick={() => setForm((prev) => ({ ...prev, role: opt.value }))}
                >
                  <span className="role-icon">{opt.icon}</span>
                  <span className="role-label">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input id="password" name="password" type="password" value={form.password} onChange={handleChange} placeholder="Minimal 6 karakter" required minLength={6} />
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Konfirmasi Password</label>
            <input id="confirmPassword" name="confirmPassword" type="password" value={form.confirmPassword} onChange={handleChange} placeholder="Ulangi password" required />
          </div>

          {error && <div className="error-msg">{error}</div>}
          {success && <div className="success-msg">{success}</div>}

          <button type="submit" className="btn-login" disabled={loading}>
            {loading ? "Mendaftarkan..." : "Daftar"}
          </button>
        </form>

        <div className="login-footer">
          <p>
            Sudah punya akun? <Link to="/">Login di sini</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

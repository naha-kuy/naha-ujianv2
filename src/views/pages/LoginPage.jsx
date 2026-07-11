import { useState, useRef, useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { login, register } from "../../controllers/AuthController";

import Icon from "../components/Icon";

const roleInfo = {
  admin: { label: "Admin", emoji: "shield", iconSize: 14 },
  guru: { label: "Guru", emoji: "book", iconSize: 14 },
  siswa: { label: "Siswa", emoji: "graduation", iconSize: 14 },
};

const roleOpts = [
  { value: "siswa", label: "Siswa", emoji: "graduation", iconSize: 16 },
  { value: "guru", label: "Guru", emoji: "book", iconSize: 16 },
];

export default function LoginPage() {
  const navigate = useNavigate();
  const cardRef = useRef(null);
  const leverRef = useRef(null);
  const steamRef = useRef(null);
  const busy = useRef(false);

  const [view, setView] = useState("login"); // login | register | welcome
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [statusMsg, setStatusMsg] = useState("");
  const [statusType, setStatusType] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});

  // Auto-clear errors after 6s
  useEffect(() => {
    if (!error) return;
    const t = setTimeout(() => setError(null), 6000);
    return () => clearTimeout(t);
  }, [error]);

  // Login fields
  const [lUser, setLUser] = useState("");
  const [lPass, setLPass] = useState("");
  const [selRole, setSelRole] = useState(null);

  // Register fields
  const [reg, setReg] = useState({
    name: "", email: "", username: "", role: "siswa",
    password: "", confirmPassword: "",
    mataPelajaran: "", catatan: "", kelas: "", jurusan: "", namaSekolah: "",
  });

  const userInputRef = useRef(null);
  const passInputRef = useRef(null);

  const triggerSteam = () => {
    const sp = steamRef.current?.querySelectorAll(".t-sp");
    if (!sp) return;
    sp.forEach((el) => {
      el.classList.remove("go");
      void el.offsetWidth;
      el.classList.add("go");
    });
  };

  const shakeInput = (id) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.add("error");
    setTimeout(() => el.classList.remove("error"), 450);
  };

  const setFieldError = (id, msg) => {
    if (id) setFieldErrors((prev) => ({ ...prev, [id]: msg }));
    if (id) shakeInput(id);
  };

  const clearFieldErrors = () => setFieldErrors({});

  const doPull = useCallback(async () => {
    if (busy.current) return;
    busy.current = true;
    setError(null);
    setStatusMsg("");
    clearFieldErrors();

    const lever = leverRef.current;
    const card = cardRef.current;

    const isReg = view === "register";

    if (isReg && reg.password !== reg.confirmPassword) {
      busy.current = false;
      return;
    }

    // --- Validate ---
    let hasError = false;
    if (isReg) {
      const required = [
        { id: "regName", val: reg.name, label: "Nama lengkap" },
        { id: "regEmail", val: reg.email, label: "Email" },
        { id: "regUser", val: reg.username, label: "Username" },
        { id: "regPass", val: reg.password, label: "Password" },
        { id: "regPassConfirm", val: reg.confirmPassword, label: "Konfirmasi password" },
      ];
      const extraFields = reg.role === "guru"
        ? [{ id: "regMapel", val: reg.mataPelajaran, label: "Mata pelajaran" }]
        : [{ id: "regKelas", val: reg.kelas, label: "Kelas" }, { id: "regSekolah", val: reg.namaSekolah, label: "Nama sekolah" }];

      [...required, ...extraFields].forEach((f) => {
        if (!f.val?.trim()) {
          setFieldError(f.id, `${f.label} harus diisi`);
          hasError = true;
        }
      });

      if (reg.password !== reg.confirmPassword) {
        setFieldError("regPass", "Password tidak cocok");
        setFieldError("regPassConfirm", "Password tidak cocok");
        hasError = true;
      }

      if (reg.password.length < 6) {
        setFieldError("regPass", "Minimal 6 karakter");
        hasError = true;
      }
    } else {
      if (!lUser.trim()) { setFieldError("lUser", "Username harus diisi"); hasError = true; }
      if (!lPass.trim()) { setFieldError("lPass", "Password harus diisi"); hasError = true; }
    }

    if (hasError) {
      setStatusMsg("Periksa kembali isian Anda");
      setStatusType("err");
      busy.current = false;
      pullAnimate(lever);
      return;
    }

    // --- Pull lever & sink ---
    setLoading(true);
    lever?.classList.add("pulled");
    card?.classList.remove("pop");
    card?.classList.add("sink");

    const doAfterSink = isReg ? 500 : 400;
    await new Promise((r) => setTimeout(r, doAfterSink));

    // --- Process ---
    let result;
    if (isReg) {
      const payload = {
        username: reg.username, email: reg.email, password: reg.password,
        name: reg.name, role: reg.role,
      };
      if (reg.role === "guru") {
        payload.mata_pelajaran = reg.mataPelajaran;
        payload.catatan_pendaftaran = reg.catatan;
      } else {
        payload.kelas = reg.kelas;
        payload.jurusan = reg.jurusan || null;
        payload.nama_sekolah = reg.namaSekolah;
      }
      result = await register(payload);
    } else {
      result = await login(lUser, lPass);
    }

    setLoading(false);

    if (result.success) {
      setView("welcome");
      setStatusMsg(isReg ? "Akun berhasil dibuat!" : "Login berhasil!");
      setStatusType("ok");

      card?.classList.remove("sink");
      await new Promise((r) => setTimeout(r, 300));
      card?.classList.add("pop");
      lever?.classList.remove("pulled");
      triggerSteam();

      await new Promise((r) => setTimeout(r, isReg ? 2500 : 1800));

      if (isReg) {
        resetToLogin();
      } else {
        card?.classList.remove("pop");
        await new Promise((r) => setTimeout(r, 600));
        resetToLogin();
        navigate(`/${result.user.role}`);
      }
    } else {
      setError({ message: result.message, action: result.action || null });
      setStatusMsg(result.message);
      setStatusType("err");

      card?.classList.remove("sink");
      await new Promise((r) => setTimeout(r, 300));
      card?.classList.remove("pop");
      lever?.classList.remove("pulled");
      busy.current = false;
    }
  }, [view, lUser, lPass, reg, navigate]);

  const pullAnimate = (lever) => {
    lever?.classList.add("pulled");
    setTimeout(() => lever?.classList.remove("pulled"), 320);
  };

  const resetToLogin = () => {
    setView("login");
    setError(null);
    setStatusMsg("");
    setStatusType("");
    setLoading(false);
    busy.current = false;
    clearFieldErrors();
    const card = cardRef.current;
    card?.classList.remove("sink", "pop");
  };

  const switchView = (v) => {
    setView(v);
    setError(null);
    setStatusMsg("");
    setStatusType("");
    setLoading(false);
    clearFieldErrors();
  };

  const toggleRole = (role) => {
    setSelRole(role);
    setLUser(role);
    setLPass(role);
    setError(null);
  };

  const updateReg = (field, value) => {
    setReg((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) setFieldErrors((prev) => { const n = { ...prev }; delete n[field]; return n; });
  };

  const isGuru = reg.role === "guru";
  const regPassMatch = view === "register" && reg.confirmPassword !== ""
    ? reg.password === reg.confirmPassword
    : true;

  const inputCls = (id) => `input-wrap ${fieldErrors[id] ? "input-error" : ""}`;

  return (
    <div className="toaster-page">
      <img src="/logo.png" alt="Logo" style={{ height: 60, marginBottom: 8, zIndex: 1 }} />

      <div className="toaster-wrap">
        {/* Steam */}
        <div className="t-steam" ref={steamRef}>
          <div className="t-sp"></div>
          <div className="t-sp"></div>
          <div className="t-sp"></div>
        </div>

        {/* Card */}
        <div className={`t-card ${view === "register" ? "register-open" : ""}`} ref={cardRef}>

          {/* LOGIN VIEW */}
          {view === "login" && (
            <div>
              <div className="card-title">Log In</div>

              <div className="field-label">Username</div>
              <div className={inputCls("lUser")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input id="lUser" type="text" value={lUser} onChange={(e) => { setLUser(e.target.value); if (fieldErrors.lUser) setFieldErrors((p) => { const n = { ...p }; delete n.lUser; return n; }); }}
                  placeholder="Username" autoComplete="off" ref={userInputRef}
                  onKeyDown={(e) => { if (e.key === "Enter") passInputRef.current?.focus(); }} />
              </div>
              {fieldErrors.lUser && <div className="t-field-err">{fieldErrors.lUser}</div>}

              <div className="field-label">Password</div>
              <div className={inputCls("lPass")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input id="lPass" type="password" value={lPass} onChange={(e) => { setLPass(e.target.value); if (fieldErrors.lPass) setFieldErrors((p) => { const n = { ...p }; delete n.lPass; return n; }); }}
                  placeholder="Password" ref={passInputRef}
                  onKeyDown={(e) => { if (e.key === "Enter") doPull(); }} />
              </div>
              {fieldErrors.lPass && <div className="t-field-err">{fieldErrors.lPass}</div>}

              <div className="field-label" style={{ marginBottom: 4 }}>Login Cepat</div>
              <div className="t-quick-roles">
                {Object.entries(roleInfo).map(([role, info]) => (
                  <button key={role} type="button"
                    className={`t-quick-btn ${selRole === role ? "active" : ""}`}
                    onClick={() => toggleRole(role)}
                  >
                    <Icon name={info.emoji} size={info.iconSize} /> {info.label}
                  </button>
                ))}
              </div>

              {error && (
                <div className="error-block" style={{ animation: "fadeSlideIn 0.3s ease" }}>
                  <div className="t-error-msg">{error.message}</div>
                  {error.action?.type === "whatsapp" && (
                    <a href={`https://wa.me/${error.action.phone}?text=${encodeURIComponent(error.action.text)}`}
                      target="_blank" rel="noopener noreferrer" className="btn-wa">
                      <svg className="wa-icon" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                      </svg>
                      Hubungi Admin via WhatsApp
                    </a>
                  )}
                </div>
              )}

              <div className="t-divider">
                <hr /><span>klik tuas merah untuk masuk</span><hr />
              </div>
              <div className="t-toggle-link">
                Belum punya akun? <span onClick={() => switchView("register")}>Daftar</span>
              </div>
            </div>
          )}

          {/* REGISTER VIEW */}
          {view === "register" && (
            <div className="t-card-inner">
              <div className="card-title" style={{ fontSize: 13 }}>Daftar Akun</div>

              <div className="field-label">Nama Lengkap</div>
              <div className={inputCls("regName")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input id="regName" type="text" value={reg.name} onChange={(e) => updateReg("name", e.target.value)}
                  placeholder="Nama lengkap" autoComplete="off" />
              </div>
              {fieldErrors.regName && <div className="t-field-err">{fieldErrors.regName}</div>}

              <div className="field-label">Email</div>
              <div className={inputCls("regEmail")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="2" y="4" width="20" height="16" rx="2" />
                  <path d="M22 4l-10 8L2 4" />
                </svg>
                <input id="regEmail" type="email" value={reg.email} onChange={(e) => updateReg("email", e.target.value)}
                  placeholder="Email aktif" autoComplete="off" />
              </div>
              {fieldErrors.regEmail && <div className="t-field-err">{fieldErrors.regEmail}</div>}

              <div className="field-label">Username</div>
              <div className={inputCls("regUser")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                  <circle cx="12" cy="7" r="4" />
                </svg>
                <input id="regUser" type="text" value={reg.username} onChange={(e) => updateReg("username", e.target.value)}
                  placeholder="Username" autoComplete="off" />
              </div>
              {fieldErrors.regUser && <div className="t-field-err">{fieldErrors.regUser}</div>}

              <div className="field-label">Daftar Sebagai</div>
              <div className="t-role-tog">
                {roleOpts.map((opt) => (
                  <button key={opt.value} type="button"
                    className={`t-role-btn ${reg.role === opt.value ? "active" : ""}`}
                    onClick={() => updateReg("role", opt.value)}
                  >
                    <span className="role-emoji"><Icon name={opt.emoji} size={opt.iconSize} /></span> {opt.label}
                  </button>
                ))}
              </div>

              {isGuru ? (
                <>
                  <div className="field-label">Mata Pelajaran</div>
                  <div className={inputCls("regMapel")}>
                    <input id="regMapel" type="text" value={reg.mataPelajaran}
                      onChange={(e) => updateReg("mataPelajaran", e.target.value)}
                      placeholder="Contoh: Matematika" style={{ paddingLeft: 11 }} />
                  </div>
                  {fieldErrors.regMapel && <div className="t-field-err">{fieldErrors.regMapel}</div>}
                  <div className="field-label">Catatan Permohonan</div>
                  <div className="input-wrap">
                    <textarea id="regCatatan" value={reg.catatan}
                      onChange={(e) => updateReg("catatan", e.target.value)}
                      placeholder="Sampaikan catatan ke admin..." rows={2} />
                  </div>
                </>
              ) : (
                <>
                  <div className="field-label">Kelas</div>
                  <div className={inputCls("regKelas")}>
                    <input id="regKelas" type="text" value={reg.kelas}
                      onChange={(e) => updateReg("kelas", e.target.value)}
                      placeholder="Contoh: X" style={{ paddingLeft: 11 }} />
                  </div>
                  {fieldErrors.regKelas && <div className="t-field-err">{fieldErrors.regKelas}</div>}
                  <div className="field-label">Jurusan <span style={{ fontWeight: 400, color: "#aaa", fontSize: 8 }}>(opsional)</span></div>
                  <div className="input-wrap">
                    <input type="text" value={reg.jurusan}
                      onChange={(e) => updateReg("jurusan", e.target.value)}
                      placeholder="Contoh: IPA, RPL" style={{ paddingLeft: 11 }} />
                  </div>
                  <div className="field-label">Nama Sekolah</div>
                  <div className={inputCls("regSekolah")}>
                    <input id="regSekolah" type="text" value={reg.namaSekolah}
                      onChange={(e) => updateReg("namaSekolah", e.target.value)}
                      placeholder="Nama sekolah" style={{ paddingLeft: 11 }} />
                  </div>
                  {fieldErrors.regSekolah && <div className="t-field-err">{fieldErrors.regSekolah}</div>}
                </>
              )}

              <div className="field-label">Password</div>
              <div className={inputCls("regPass")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input id="regPass" type="password" value={reg.password}
                  onChange={(e) => updateReg("password", e.target.value)} placeholder="Min 6 karakter" />
              </div>
              {fieldErrors.regPass && <div className="t-field-err">{fieldErrors.regPass}</div>}

              <div className="field-label">Konfirmasi Password</div>
              <div className={inputCls("regPassConfirm")}>
                <svg className="input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                  <rect x="3" y="11" width="18" height="11" rx="2" />
                  <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                </svg>
                <input id="regPassConfirm" type="password" value={reg.confirmPassword}
                  onChange={(e) => updateReg("confirmPassword", e.target.value)} placeholder="Ulangi password" />
              </div>
              {fieldErrors.regPassConfirm && <div className="t-field-err">{fieldErrors.regPassConfirm}</div>}

              <div className="t-divider">
                <hr /><span>klik tuas merah untuk daftar</span><hr />
              </div>
              <div className="t-toggle-link">
                Sudah punya akun? <span onClick={() => switchView("login")}>Masuk</span>
              </div>
            </div>
          )}

          {/* WELCOME VIEW */}
          {view === "welcome" && (
            <div className="welcome-view" style={{ display: "flex" }}>
              <div className="w-icon"><Icon name="check" size={38} style={{ color: "#28a745" }} /></div>
              <div className="w-title">Welcome<br />Back!</div>
              <div className="w-sub">Successfully toasted</div>
            </div>
          )}
        </div>

        {/* Toaster Body */}
        <div className="t-body">
          <div className="t-slots">
            <div className="t-slot"></div>
            <div className="t-slot"></div>
          </div>
          <div className="t-lever" ref={leverRef} onClick={loading ? undefined : doPull}
            style={{
              opacity: view === "register" && !regPassMatch ? 0.35 : loading ? 0.5 : 1,
              cursor: (view === "register" && !regPassMatch) || loading ? "not-allowed" : "pointer",
              transition: "opacity 0.2s",
            }}>
            <div className="t-lever-head"></div>
            <div className="t-lever-rod"></div>
          </div>
        </div>

        {/* Toaster Base */}
        <div className="t-base">
          <div className="t-vents">
            <div className="t-vent"></div>
            <div className="t-vent"></div>
            <div className="t-vent"></div>
          </div>
          <div className="t-tray"></div>
          <div className="t-feet">
            <div className="t-foot"></div>
            <div className="t-foot"></div>
          </div>
        </div>
      </div>

      <p className={`t-status ${statusType}`} style={{ animation: statusMsg ? "fadeSlideIn 0.3s ease" : "none" }}>
        {statusMsg && (
          <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
            {statusType === "err" && <Icon name="warning" size={14} />}
            {statusType === "ok" && <Icon name="check" size={14} />}
            {statusMsg}
          </span>
        )}
      </p>
    </div>
  );
}

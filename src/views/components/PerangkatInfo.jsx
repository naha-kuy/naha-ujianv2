import { useState, useEffect } from "react";
import Icon from "./Icon";

function Cell({ label, value, status, fullWidth }) {
  return (
    <div style={{
      gridColumn: fullWidth ? "1 / -1" : undefined,
      display: "flex",
      alignItems: "baseline",
      gap: 8,
      padding: "8px 14px",
      borderBottom: "1px solid #f0e0c0",
      fontSize: 12,
    }}>
      <span style={{ fontWeight: 600, color: "#5a3a00", whiteSpace: "nowrap", minWidth: fullWidth ? 160 : 120 }}>{label}</span>
      <span style={{ color: "#3a2500", wordBreak: "break-all", lineHeight: 1.4 }}>
        {status === "online" && <span style={{ color: "#28a745", fontWeight: 700 }}>Online</span>}
        {status === "offline" && <span style={{ color: "#cc0033", fontWeight: 700 }}>Offline</span>}
        {!status && value}
      </span>
    </div>
  );
}

export default function PerangkatInfo() {
  const [online, setOnline] = useState(navigator.onLine);
  const [ip, setIp] = useState("Memuat...");
  const [batLevel, setBatLevel] = useState(null);
  const [batCharging, setBatCharging] = useState(false);
  const [time, setTime] = useState(new Date().toLocaleString());

  useEffect(() => {
    const t = setInterval(() => setTime(new Date().toLocaleString()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const go = () => setOnline(true);
    const gf = () => setOnline(false);
    window.addEventListener("online", go);
    window.addEventListener("offline", gf);
    return () => { window.removeEventListener("online", go); window.removeEventListener("offline", gf); };
  }, []);

  useEffect(() => {
    fetch("https://api.ipify.org?format=json")
      .then((r) => r.json())
      .then((d) => setIp(d.ip))
      .catch(() => setIp("Tidak tersedia"));
  }, []);

  useEffect(() => {
    if ("getBattery" in navigator) {
      navigator.getBattery().then((b) => {
        setBatLevel(b.level);
        setBatCharging(b.charging);
        const updLvl = () => setBatLevel(b.level);
        const updChg = () => setBatCharging(b.charging);
        b.addEventListener("levelchange", updLvl);
        b.addEventListener("chargingchange", updChg);
      });
    }
  }, []);

  const ua = navigator.userAgent.toLowerCase();
  const deviceType = /mobile|android|iphone|ipad/.test(ua) ? "Mobile/Tablet" : "Desktop";
  const batPct = batLevel !== null ? Math.round(batLevel * 100) : null;

  const items = [
    { label: "Status Koneksi", value: "", status: online ? "online" : "offline" },
    { label: "IP Address", value: ip },
    { label: "RAM (perkiraan)", value: navigator.deviceMemory ? `${navigator.deviceMemory} GB` : "Tidak tersedia" },
    { label: "Resolusi Layar", value: `${screen.width} x ${screen.height}` },
    { label: "Ukuran Viewport", value: `${window.innerWidth} x ${window.innerHeight}` },
    { label: "Bahasa Sistem", value: navigator.language || navigator.userLanguage || "-" },
    { label: "Waktu Lokal", value: time },
    { label: "Zona Waktu", value: Intl.DateTimeFormat().resolvedOptions().timeZone || "Tidak tersedia" },
    { label: "Platform", value: navigator.platform || "Tidak tersedia" },
    { label: "Cookie Diaktifkan", value: navigator.cookieEnabled ? "Aktif" : "Nonaktif" },
    { label: "Jenis Perangkat", value: deviceType },
    { label: "Touch Support", value: "ontouchstart" in window || navigator.maxTouchPoints > 0 ? "Touchscreen" : "Non-Touch" },
    { label: "Status Baterai", value: batPct !== null ? `${batPct}%${batCharging ? " (Charging)" : ""}` : (batLevel === null ? "Memeriksa..." : "Tidak didukung") },
  ];

  // Split into left and right columns (evenly)
  const half = Math.ceil(items.length / 2);
  const leftCol = items.slice(0, half);
  const rightCol = items.slice(half);

  return (
    <div>
      <div style={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr",
        border: "1px solid #f0e0c0",
        borderRadius: 8,
        overflow: "hidden",
        background: "white",
      }}>
        {/* Left column */}
        <div style={{ borderRight: "1px solid #f0e0c0" }}>
          {leftCol.map((r) => <Cell key={r.label} {...r} />)}
        </div>
        {/* Right column */}
        <div>
          {rightCol.map((r) => <Cell key={r.label} {...r} />)}
        </div>
        {/* Full-width row for OS & Browser */}
        <div style={{
          gridColumn: "1 / -1",
          borderTop: "1px solid #f0e0c0",
          display: "flex",
          alignItems: "baseline",
          gap: 8,
          padding: "8px 14px",
          fontSize: 12,
        }}>
          <span style={{ fontWeight: 600, color: "#5a3a00", whiteSpace: "nowrap", minWidth: 120 }}>OS & Browser</span>
          <span style={{ color: "#3a2500", wordBreak: "break-all", lineHeight: 1.4, fontSize: 10 }}>{navigator.userAgent}</span>
        </div>
      </div>

      {batPct !== null && batPct <= 20 && !batCharging && (
        <div style={{
          marginTop: 8, padding: "8px 14px", fontSize: 11, color: "#cc0033",
          background: "rgba(208,53,53,0.06)", borderRadius: 8, textAlign: "center",
        }}>
          <Icon name="warning" size={14} style={{ verticalAlign: "middle", marginRight: 4 }} />
          Baterai rendah ({batPct}%). Hubungkan charger untuk kenyamanan ujian.
        </div>
      )}
    </div>
  );
}

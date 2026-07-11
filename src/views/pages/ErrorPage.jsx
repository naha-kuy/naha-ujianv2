import { useNavigate } from "react-router-dom";
import Icon from "../components/Icon";

const errorData = {
  404: {
    title: "404",
    subtitle: "Halaman Tidak Ditemukan",
    msg: "Maaf, halaman yang kamu cari tidak ada atau telah dipindahkan.",
    icon: "map",
    color: "#b89440",
  },
  403: {
    title: "403",
    subtitle: "Akses Ditolak",
    msg: "Kamu tidak memiliki izin untuk mengakses halaman ini.",
    icon: "lock",
    color: "#cc0033",
  },
  500: {
    title: "500",
    subtitle: "Kesalahan Server",
    msg: "Terjadi kesalahan pada server. Silakan coba lagi nanti.",
    icon: "warning",
    color: "#fd7e14",
  },
};

export default function ErrorPage({ code = 404 }) {
  const navigate = useNavigate();
  const e = errorData[code] || errorData[404];

  return (
    <div style={{
      minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center",
      background: "linear-gradient(135deg, #fdf6e3, #f5e6c8)", fontFamily: "sans-serif",
    }}>
      <div style={{ textAlign: "center", maxWidth: 400, padding: 40 }}>
        <div style={{
          width: 80, height: 80, borderRadius: "50%", background: e.color + "15",
          display: "flex", alignItems: "center", justifyContent: "center",
          margin: "0 auto 20px", color: e.color,
        }}>
          <Icon name={e.icon} size={36} />
        </div>
        <h1 style={{ fontSize: 56, fontWeight: 800, color: e.color, margin: 0, lineHeight: 1 }}>
          {e.title}
        </h1>
        <h2 style={{ fontSize: 18, color: "#5a3a00", margin: "8px 0 12px" }}>{e.subtitle}</h2>
        <p style={{ fontSize: 13, color: "#9a7a30", lineHeight: 1.5, marginBottom: 24 }}>
          {e.msg}
        </p>
        <div style={{ display: "flex", gap: 12, justifyContent: "center" }}>
          <button onClick={() => navigate(-1)}
            style={{ padding: "8px 20px", background: "white", border: "1px solid #d4b86a", borderRadius: 8, fontSize: 12, cursor: "pointer", color: "#5a3a00" }}>
            Kembali
          </button>
          <button onClick={() => navigate("/")}
            style={{ padding: "8px 20px", background: "#b89440", color: "white", border: "none", borderRadius: 8, fontSize: 12, cursor: "pointer", fontWeight: 600 }}>
            Ke Halaman Login
          </button>
        </div>
      </div>
    </div>
  );
}

import { useNotification } from "../../contexts/NotificationContext";
import Icon from "./Icon";

const ICON_MAP = {
  success: "check",
  error: "warning",
  info: "bell",
  warning: "warning",
};

const COLOR_MAP = {
  success: { bg: "#28a745", border: "#1e7e34" },
  error: { bg: "#dc3545", border: "#bd2130" },
  info: { bg: "#17a2b8", border: "#138496" },
  warning: { bg: "#ffc107", border: "#d39e00" },
};

export default function NotificationContainer() {
  const { notifications, removeNotification } = useNotification();

  if (notifications.length === 0) return null;

  return (
    <div style={{
      position: "fixed", top: 12, right: 12, zIndex: 99999,
      display: "flex", flexDirection: "column", gap: 6,
      pointerEvents: "none",
    }}>
      {notifications.map((n) => {
        const colors = COLOR_MAP[n.type] || COLOR_MAP.info;
        return (
          <div key={n.id} style={{
            pointerEvents: "auto",
            display: "flex", alignItems: "center", gap: 8,
            padding: "10px 14px", borderRadius: 8,
            background: colors.bg,
            color: n.type === "warning" ? "#333" : "white",
            fontSize: 12, fontWeight: 600,
            minWidth: 220, maxWidth: 360,
            boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
            animation: "notifSlideIn 0.25s ease",
          }}>
            <Icon name={ICON_MAP[n.type] || "bell"} size={16} />
            <span style={{ flex: 1, lineHeight: 1.3 }}>{n.message}</span>
            <button onClick={() => removeNotification(n.id)}
              style={{ background: "none", border: "none", color: "inherit", cursor: "pointer", padding: 0, opacity: 0.7, flexShrink: 0 }}>
              <Icon name="x" size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
}

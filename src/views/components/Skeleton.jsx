export default function Skeleton({ width = "100%", height = 16, borderRadius = 6, style = {} }) {
  return (
    <div
      className="skeleton"
      style={{
        width,
        height,
        borderRadius,
        background: "linear-gradient(90deg, #e0d0b0 25%, #f0e0c0 50%, #e0d0b0 75%)",
        backgroundSize: "200% 100%",
        animation: "shimmer 1.5s ease-in-out infinite",
        ...style,
      }}
    />
  );
}

export function TableSkeleton({ rows = 5, cols = 6 }) {
  return (
    <div style={{ padding: "16px 0" }}>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} style={{ display: "flex", gap: 12, padding: "10px 14px", borderBottom: "1px solid rgba(180,150,80,0.15)" }}>
          {Array.from({ length: cols }).map((_, c) => (
            <Skeleton key={c} height={14} style={{ flex: c === 0 ? "0 0 30px" : c === cols - 1 ? "0 0 80px" : 1 }} />
          ))}
        </div>
      ))}
    </div>
  );
}

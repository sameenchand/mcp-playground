import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MCP Server Quality Dashboard — MCP Playground";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          background: "oklch(0.145 0 0)",
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "28px",
          padding: "80px",
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "700px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.35)", fontSize: "18px" }}>
          <span>MCP Playground</span>
          <span>→</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>Quality Dashboard</span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: "68px", fontWeight: 700, color: "white", letterSpacing: "-2px", lineHeight: 1.1, textAlign: "center" }}>
          MCP Server Quality Leaderboard
        </div>

        {/* Sub */}
        <div style={{ fontSize: "26px", color: "rgba(255,255,255,0.45)", textAlign: "center", maxWidth: "800px", lineHeight: 1.5 }}>
          Live quality grades for 600+ MCP servers. Scanned using 15+ lint rules covering schema completeness, descriptions, and metadata.
        </div>

        {/* Stats row */}
        <div style={{ display: "flex", gap: "24px", marginTop: "8px" }}>
          {[
            { label: "Servers Scanned", value: "600+" },
            { label: "Lint Rules", value: "15+" },
            { label: "Grades", value: "A – F" },
          ].map(({ label, value }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "4px",
                padding: "16px 28px",
                borderRadius: "12px",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "rgba(255,255,255,0.04)",
              }}
            >
              <span style={{ fontSize: "28px", fontWeight: 700, color: "white" }}>{value}</span>
              <span style={{ fontSize: "14px", color: "rgba(255,255,255,0.35)" }}>{label}</span>
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

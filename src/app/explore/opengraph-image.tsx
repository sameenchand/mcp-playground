import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Explore MCP Servers — MCP Playground";
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
            width: "600px",
            height: "400px",
            background: "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Breadcrumb */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "rgba(255,255,255,0.35)", fontSize: "18px" }}>
          <span>MCP Playground</span>
          <span>→</span>
          <span style={{ color: "rgba(255,255,255,0.6)" }}>Explore Servers</span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: "72px", fontWeight: 700, color: "white", letterSpacing: "-2px", lineHeight: 1.1, textAlign: "center" }}>
          Browse 800+ MCP Servers
        </div>

        {/* Sub */}
        <div style={{ fontSize: "26px", color: "rgba(255,255,255,0.45)", textAlign: "center", maxWidth: "780px", lineHeight: 1.5 }}>
          Filter by live endpoints, auth requirements, and category. Test any server instantly — no installation needed.
        </div>

        {/* Category pills */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "center", maxWidth: "800px" }}>
          {["AI", "Productivity", "Data", "Search", "Developer", "Finance"].map((cat) => (
            <div
              key={cat}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "18px",
              }}
            >
              {cat}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

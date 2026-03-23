import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "Schema Linter — MCP Playground";
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
          <span style={{ color: "rgba(255,255,255,0.6)" }}>Schema Linter</span>
        </div>

        {/* Headline */}
        <div style={{ fontSize: "72px", fontWeight: 700, color: "white", letterSpacing: "-2px", lineHeight: 1.1, textAlign: "center" }}>
          Grade Your MCP Server
        </div>

        {/* Sub */}
        <div style={{ fontSize: "26px", color: "rgba(255,255,255,0.45)", textAlign: "center", maxWidth: "780px", lineHeight: 1.5 }}>
          Check tool descriptions, JSON Schema completeness, and token cost. Get a letter grade A–F.
        </div>

        {/* Grade pills */}
        <div style={{ display: "flex", gap: "12px", marginTop: "4px" }}>
          {[
            { grade: "A", color: "#22c55e" },
            { grade: "B", color: "#3b82f6" },
            { grade: "C", color: "#eab308" },
            { grade: "D", color: "#f97316" },
            { grade: "F", color: "#ef4444" },
          ].map(({ grade, color }) => (
            <div
              key={grade}
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "12px",
                background: `${color}22`,
                border: `1px solid ${color}44`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "28px",
                fontWeight: 700,
                color,
              }}
            >
              {grade}
            </div>
          ))}
        </div>
      </div>
    ),
    { ...size },
  );
}

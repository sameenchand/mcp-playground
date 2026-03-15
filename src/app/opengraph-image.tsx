import { ImageResponse } from "next/og";

export const runtime = "edge";

export const alt = "MCP Playground — Test any MCP server in your browser";

export const size = {
  width: 1200,
  height: 630,
};

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
          gap: "24px",
          padding: "80px",
          position: "relative",
        }}
      >
        {/* Background glow */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            width: "600px",
            height: "400px",
            background:
              "radial-gradient(ellipse at center, rgba(255,255,255,0.04) 0%, transparent 70%)",
            borderRadius: "50%",
          }}
        />

        {/* Logo badge */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            padding: "8px 18px",
            borderRadius: "999px",
            border: "1px solid rgba(255,255,255,0.12)",
            background: "rgba(255,255,255,0.05)",
            marginBottom: "8px",
          }}
        >
          <div
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: "#22c55e",
            }}
          />
          <span
            style={{
              color: "rgba(255,255,255,0.5)",
              fontSize: "16px",
              fontFamily: "monospace",
            }}
          >
            modelcontextprotocol.io
          </span>
        </div>

        {/* Headline */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: "4px",
          }}
        >
          <div
            style={{
              fontSize: "80px",
              fontWeight: 700,
              color: "white",
              letterSpacing: "-2px",
              lineHeight: 1.1,
              textAlign: "center",
            }}
          >
            <span style={{ color: "rgba(255,255,255,0.9)" }}>MCP </span>
            <span style={{ color: "rgba(255,255,255,0.55)" }}>Playground</span>
          </div>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "rgba(255,255,255,0.45)",
            textAlign: "center",
            maxWidth: "800px",
            lineHeight: 1.5,
          }}
        >
          Test any MCP server in your browser. No installation needed.
        </div>

        {/* Feature pills */}
        <div
          style={{
            display: "flex",
            gap: "12px",
            marginTop: "8px",
          }}
        >
          {["Browse Registry", "Inspect Tools", "Run Live"].map((label) => (
            <div
              key={label}
              style={{
                padding: "8px 20px",
                borderRadius: "999px",
                border: "1px solid rgba(255,255,255,0.1)",
                background: "rgba(255,255,255,0.06)",
                color: "rgba(255,255,255,0.6)",
                fontSize: "18px",
              }}
            >
              {label}
            </div>
          ))}
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

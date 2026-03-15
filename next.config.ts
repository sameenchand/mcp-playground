import type { NextConfig } from "next";

const cspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'", // Next.js needs unsafe-eval in dev
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self'", // Only allow API calls to our own origin
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

// Relaxed CSP for the WebContainer sandbox — needs blob:, worker-src, wasm for WASM execution
const sandboxCspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob:",
  "font-src 'self' data:",
  "connect-src 'self' blob: data: https:",
  "worker-src 'self' blob:",
  "child-src 'self' blob:",
  "frame-ancestors 'self'",
  "base-uri 'self'",
  "form-action 'self'",
  "object-src 'none'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
];

const nextConfig: NextConfig = {
  async headers() {
    const isProd = process.env.NODE_ENV === "production";
    return [
      // WebContainer sandbox route — needs COEP/COOP + relaxed CSP
      {
        source: "/playground/sandbox",
        headers: [
          {
            key: "Content-Security-Policy",
            value: isProd ? sandboxCspHeader.replace("'unsafe-eval' ", "") : sandboxCspHeader,
          },
          { key: "Cross-Origin-Embedder-Policy", value: "require-corp" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...securityHeaders,
        ],
      },
      // All other routes — standard CSP
      {
        source: "/(.*)",
        headers: [
          {
            key: "Content-Security-Policy",
            value: isProd ? cspHeader.replace("'unsafe-eval' ", "") : cspHeader,
          },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;

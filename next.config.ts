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

// Relaxed CSP for the WebContainer sandbox.
// @webcontainer/api v1.x boots by loading https://stackblitz.com/headless in a hidden
// iframe and communicating via postMessage. Without frame-src allowing stackblitz.com,
// the iframe is silently blocked and WebContainer.boot() hangs forever.
const sandboxCspHeader = [
  "default-src 'self'",
  "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data:",
  // stackblitz.com hosts the WebContainer runtime; the iframe postMessages back to boot
  "connect-src 'self' blob: data: https: wss:",
  "worker-src 'self' blob:",
  "child-src 'self' blob: https://stackblitz.com https://*.stackblitz.com https://*.stackblitz.io",
  // frame-src is the critical directive — allows the hidden runtime iframe
  "frame-src 'self' https://stackblitz.com https://*.stackblitz.com https://*.stackblitz.io",
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
      // IMPORTANT: Order matters! When multiple source patterns match the
      // same path, the LAST matching entry wins for duplicate header keys.
      // The catch-all must come FIRST so that the sandbox-specific headers
      // (with relaxed CSP + COEP/COOP) override it for /playground/sandbox.

      // All routes — standard CSP (applied first, overridden by sandbox below)
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
      // WebContainer sandbox route — needs COEP/COOP + relaxed CSP.
      // This MUST come after the catch-all so its CSP wins for this route.
      // COEP: credentialless is more compatible than require-corp — it
      // allows cross-origin subresources (like StackBlitz's iframe) without
      // requiring them to send CORP headers.
      {
        source: "/playground/sandbox",
        headers: [
          {
            key: "Content-Security-Policy",
            value: isProd ? sandboxCspHeader.replace("'unsafe-eval' ", "") : sandboxCspHeader,
          },
          { key: "Cross-Origin-Embedder-Policy", value: "credentialless" },
          { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
          ...securityHeaders,
        ],
      },
    ];
  },
};

export default nextConfig;

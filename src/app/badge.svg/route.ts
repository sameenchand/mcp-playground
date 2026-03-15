import { NextResponse } from "next/server";

// Shields.io-style SVG badge: "Try in MCP Playground"
function buildBadge(): string {
  const leftText = "MCP";
  const rightText = "Try in Playground";
  const leftWidth = 40;
  const rightWidth = 122;
  const totalWidth = leftWidth + rightWidth;
  const height = 20;
  const leftColor = "#555";
  const rightColor = "#0066cc";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="${leftColor}"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${rightColor}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">▶ ${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14">▶ ${rightText}</text>
  </g>
</svg>`;
}

export function GET() {
  return new NextResponse(buildBadge(), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=86400, immutable",
      "X-Content-Type-Options": "nosniff",
    },
  });
}

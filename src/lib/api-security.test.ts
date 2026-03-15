import { describe, it, expect } from "vitest";
import { isPrivateIp, checkRateLimit, validateMcpUrl } from "./api-security";

describe("isPrivateIp", () => {
  it("blocks localhost", () => {
    expect(isPrivateIp("localhost")).toBe(true);
  });

  it("blocks 127.x.x.x loopback", () => {
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("127.1.2.3")).toBe(true);
  });

  it("blocks RFC 1918 ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("172.31.255.255")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
  });

  it("blocks cloud metadata IP", () => {
    expect(isPrivateIp("169.254.169.254")).toBe(true);
  });

  it("blocks IPv6 loopback", () => {
    expect(isPrivateIp("::1")).toBe(true);
  });

  it("blocks IPv6 unique local", () => {
    expect(isPrivateIp("fc00::1")).toBe(true);
    expect(isPrivateIp("fd12::1")).toBe(true);
  });

  it("blocks IPv4-mapped IPv6", () => {
    expect(isPrivateIp("::ffff:127.0.0.1")).toBe(true);
    expect(isPrivateIp("::ffff:192.168.1.1")).toBe(true);
  });

  it("allows public IPs", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("1.1.1.1")).toBe(false);
    expect(isPrivateIp("93.184.216.34")).toBe(false);
  });

  it("allows public hostnames (not resolved)", () => {
    expect(isPrivateIp("example.com")).toBe(false);
    expect(isPrivateIp("mcp.deepwiki.com")).toBe(false);
  });
});

describe("checkRateLimit", () => {
  it("allows requests under the limit", () => {
    const map = new Map<string, number[]>();
    expect(checkRateLimit(map, "1.2.3.4", 5, 60000)).toBe(false);
    expect(checkRateLimit(map, "1.2.3.4", 5, 60000)).toBe(false);
  });

  it("blocks requests over the limit", () => {
    const map = new Map<string, number[]>();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(map, "1.2.3.4", 5, 60000);
    }
    expect(checkRateLimit(map, "1.2.3.4", 5, 60000)).toBe(true);
  });

  it("isolates different IPs", () => {
    const map = new Map<string, number[]>();
    for (let i = 0; i < 5; i++) {
      checkRateLimit(map, "1.2.3.4", 5, 60000);
    }
    expect(checkRateLimit(map, "5.6.7.8", 5, 60000)).toBe(false);
  });
});

describe("validateMcpUrl", () => {
  it("rejects non-http URLs", async () => {
    const result = await validateMcpUrl("ftp://example.com", false);
    expect("error" in result).toBe(true);
  });

  it("rejects invalid URLs", async () => {
    const result = await validateMcpUrl("not a url", false);
    expect("error" in result).toBe(true);
  });

  it("accepts valid http URLs when not blocking private", async () => {
    const result = await validateMcpUrl("https://example.com/mcp", false);
    expect("hostname" in result).toBe(true);
    if ("hostname" in result) {
      expect(result.hostname).toBe("example.com");
    }
  });

  it("accepts valid https URLs", async () => {
    const result = await validateMcpUrl("https://mcp.deepwiki.com/mcp", false);
    expect("hostname" in result).toBe(true);
  });
});

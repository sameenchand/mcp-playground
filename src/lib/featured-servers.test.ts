import { describe, it, expect } from "vitest";
import { featuredServers, curatedServers } from "./featured-servers";

describe("featured-servers", () => {
  it("has at least one featured server", () => {
    expect(featuredServers.length).toBeGreaterThan(0);
  });

  it("every server has required fields", () => {
    for (const server of featuredServers) {
      expect(server.id).toBeTruthy();
      expect(server.name).toBeTruthy();
      expect(server.url).toBeTruthy();
      expect(server.description).toBeTruthy();
      expect(Array.isArray(server.tags)).toBe(true);
    }
  });

  it("all URLs are valid", () => {
    for (const server of featuredServers) {
      expect(() => new URL(server.url)).not.toThrow();
    }
  });

  it("ids are unique", () => {
    const ids = featuredServers.map((s) => s.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("curatedServers excludes auth-required and local-test", () => {
    for (const server of curatedServers) {
      expect(server.requiresAuth).not.toBe(true);
      expect(server.id).not.toBe("local-test");
    }
  });

  it("curatedServers is a subset of featuredServers", () => {
    const allIds = new Set(featuredServers.map((s) => s.id));
    for (const server of curatedServers) {
      expect(allIds.has(server.id)).toBe(true);
    }
  });
});

import { describe, expect, it, vi } from "vitest";
import { isPrivateIp, validateRemoteMcpEndpoint } from "./validate-endpoint";

describe("isPrivateIp", () => {
  it("blocks private and metadata ranges", () => {
    expect(isPrivateIp("10.0.0.1")).toBe(true);
    expect(isPrivateIp("127.0.0.1")).toBe(true);
    expect(isPrivateIp("172.16.0.1")).toBe(true);
    expect(isPrivateIp("192.168.1.1")).toBe(true);
    expect(isPrivateIp("169.254.169.254")).toBe(true);
    expect(isPrivateIp("::1")).toBe(true);
  });

  it("allows public addresses", () => {
    expect(isPrivateIp("8.8.8.8")).toBe(false);
    expect(isPrivateIp("2606:4700:4700::1111")).toBe(false);
  });
});

describe("validateRemoteMcpEndpoint", () => {
  it("accepts https public hostnames", async () => {
    const result = await validateRemoteMcpEndpoint("https://mcp.example.com/mcp", {
      resolve4: vi.fn().mockResolvedValue([{ address: "93.184.216.34" }]),
      resolve6: vi.fn().mockRejectedValue(new Error("no ipv6")),
    });

    expect(result.ok).toBe(true);
  });

  it("rejects non-https endpoints", async () => {
    const result = await validateRemoteMcpEndpoint("http://mcp.example.com/mcp");

    expect(result).toEqual({
      ok: false,
      reason: "Remote MCP endpoints must use HTTPS.",
    });
  });

  it("rejects hostnames resolving to private addresses", async () => {
    const result = await validateRemoteMcpEndpoint("https://mcp.example.com/mcp", {
      resolve4: vi.fn().mockResolvedValue([{ address: "10.0.0.5" }]),
      resolve6: vi.fn().mockRejectedValue(new Error("no ipv6")),
    });

    expect(result.ok).toBe(false);
    expect(result.ok ? "" : result.reason).toContain("blocked network address");
  });

  it("rejects credentials embedded in URLs", async () => {
    const result = await validateRemoteMcpEndpoint(
      "https://user:pass@mcp.example.com/mcp",
    );

    expect(result).toEqual({
      ok: false,
      reason: "Do not include credentials in the MCP URL.",
    });
  });
});

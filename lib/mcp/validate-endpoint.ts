import dns from "node:dns/promises";
import net from "node:net";

const DEFAULT_TIMEOUT_MS = 5_000;

type ResolveAddress = {
  address: string;
};

export type EndpointValidationResult =
  | { ok: true; url: URL }
  | { ok: false; reason: string };

type ValidateEndpointOptions = {
  resolve4?: (hostname: string) => Promise<Array<ResolveAddress | string>>;
  resolve6?: (hostname: string) => Promise<Array<ResolveAddress | string>>;
};

const METADATA_IPS = new Set(["169.254.169.254"]);

export function isPrivateIp(address: string): boolean {
  if (net.isIPv4(address)) {
    const parts = address.split(".").map(Number);
    const [a, b] = parts;

    return (
      a === 10 ||
      a === 127 ||
      (a === 172 && b >= 16 && b <= 31) ||
      (a === 192 && b === 168) ||
      (a === 169 && b === 254) ||
      a === 0 ||
      a >= 224 ||
      METADATA_IPS.has(address)
    );
  }

  if (net.isIPv6(address)) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe80:")
    );
  }

  return true;
}

export async function validateRemoteMcpEndpoint(
  endpoint: string,
  options: ValidateEndpointOptions = {},
): Promise<EndpointValidationResult> {
  let url: URL;

  try {
    url = new URL(endpoint);
  } catch {
    return { ok: false, reason: "Enter a valid MCP server URL." };
  }

  if (url.protocol !== "https:") {
    return { ok: false, reason: "Remote MCP endpoints must use HTTPS." };
  }

  if (url.username || url.password) {
    return { ok: false, reason: "Do not include credentials in the MCP URL." };
  }

  const hostname = url.hostname;
  const literalVersion = net.isIP(hostname);
  const addresses: ResolveAddress[] = [];

  if (literalVersion) {
    addresses.push({ address: hostname });
  } else {
    const resolve4 = options.resolve4 ?? dns.resolve4;
    const resolve6 = options.resolve6 ?? dns.resolve6;
    const results = await Promise.allSettled([
      resolve4(hostname),
      resolve6(hostname),
    ]);

    for (const result of results) {
      if (result.status === "fulfilled") {
        addresses.push(...result.value.map(normalizeResolvedAddress));
      }
    }
  }

  if (addresses.length === 0) {
    return { ok: false, reason: "Could not resolve the MCP server hostname." };
  }

  const blockedAddress = addresses.find((item) => isPrivateIp(item.address));
  if (blockedAddress) {
    return {
      ok: false,
      reason: `MCP endpoint resolves to a blocked network address (${blockedAddress.address}).`,
    };
  }

  return { ok: true, url };
}

function normalizeResolvedAddress(value: ResolveAddress | string): ResolveAddress {
  return typeof value === "string" ? { address: value } : value;
}

export async function guardedFetch(
  input: string | URL | Request,
  init: RequestInit = {},
): Promise<Response> {
  const inputUrl =
    input instanceof Request ? input.url : input instanceof URL ? input.href : input;
  const validation = await validateRemoteMcpEndpoint(inputUrl);

  if (!validation.ok) {
    throw new Error(validation.reason);
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), DEFAULT_TIMEOUT_MS);

  try {
    const response = await fetch(validation.url, {
      ...init,
      redirect: "manual",
      signal: init.signal ?? controller.signal,
    });

    if (
      response.status >= 300 &&
      response.status < 400 &&
      response.headers.has("location")
    ) {
      const location = response.headers.get("location");
      const redirectedUrl = new URL(location!, validation.url);
      const redirectValidation = await validateRemoteMcpEndpoint(redirectedUrl.href);

      if (!redirectValidation.ok) {
        throw new Error(`Blocked unsafe MCP redirect: ${redirectValidation.reason}`);
      }
    }

    return response;
  } finally {
    clearTimeout(timeout);
  }
}

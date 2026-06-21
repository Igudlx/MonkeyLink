import { getProjectByApiKey, type Project } from "./store";

/**
 * Extracts a Bearer token from the Authorization header.
 * Returns null if the header is missing or malformed.
 */
export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

/**
 * Validates the API key from a request's Authorization header.
 * Returns the matching project or null.
 */
export function validateApiKey(authHeader: string | null): Project | null {
  const token = extractBearer(authHeader);
  if (!token) return null;
  return getProjectByApiKey(token) ?? null;
}

/**
 * Simple admin check — compares a plain-text token against the
 * ADMIN_PASSWORD env var.  Not meant for production without HTTPS.
 */
export function isAdminToken(token: string): boolean {
  const adminPass = process.env.ADMIN_PASSWORD ?? "monkeylink-admin";
  return token === adminPass;
}

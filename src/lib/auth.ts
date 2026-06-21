import { getProjectByApiKey, type Project } from "./store";

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

export async function validateApiKey(authHeader: string | null): Promise<Project | null> {
  const token = extractBearer(authHeader);
  if (!token) return null;
  return await getProjectByApiKey(token);
}

export function isAdminToken(token: string): boolean {
  const adminPass = process.env.ADMIN_PASSWORD ?? "monkeylink-admin";
  return token === adminPass;
}

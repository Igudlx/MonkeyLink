import { timingSafeEqual } from "crypto";
import { adminAuth } from "./firebaseAdmin";
import { getProjectApiKey } from "./store";

export function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const parts = authHeader.split(" ");
  if (parts.length !== 2 || parts[0].toLowerCase() !== "bearer") return null;
  return parts[1] || null;
}

export interface SignedInUser {
  uid: string;
  email: string | null;
}

export async function verifyUser(authHeader: string | null): Promise<SignedInUser | null> {
  const token = extractBearer(authHeader);
  if (!token) return null;
  try {
    const decoded = await adminAuth().verifyIdToken(token);
    return { uid: decoded.uid, email: decoded.email ?? null };
  } catch {
    return null;
  }
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export type ProjectAuthResult = "ok" | "not_found" | "unauthorized";

export async function checkProjectKey(
  projectId: string,
  authHeader: string | null
): Promise<ProjectAuthResult> {
  const storedKey = await getProjectApiKey(projectId);
  if (!storedKey) return "not_found";
  const token = extractBearer(authHeader);
  if (!token || !safeEqual(token, storedKey)) return "unauthorized";
  return "ok";
}

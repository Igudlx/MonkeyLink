import { createHmac, timingSafeEqual } from "crypto";

export function getDocsPassword(): string | null {
  const value = (process.env.APIDOCS_PASSWORD ?? "").trim();
  return value.length > 0 ? value : null;
}

export function docsTokenFor(password: string): string {
  return createHmac("sha256", password).update("monkeylink-apidocs-v1").digest("hex");
}

export function safeEqualStrings(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

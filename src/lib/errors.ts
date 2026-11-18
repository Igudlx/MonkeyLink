export function errorDetail(err: unknown): string {
  const raw = err instanceof Error ? err.message : String(err);
  return raw
    .replace(/access_token=[^&\s"']+/g, "access_token=***")
    .replace(/-----BEGIN[\s\S]*?-----END[^-]*-----/g, "***")
    .replace(/\s+/g, " ")
    .slice(0, 400);
}

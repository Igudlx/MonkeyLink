import { cert, getApps, initializeApp, type App, type Credential } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";

let cachedCredential: Credential | null = null;
let cachedApp: App | null = null;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
  let parsed;
  try {
    parsed = JSON.parse(raw.trim());
  } catch {
    throw new Error("FIREBASE_SERVICE_ACCOUNT is not valid JSON. Paste the whole downloaded file.");
  }
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

export function getCredential(): Credential {
  if (!cachedCredential) cachedCredential = cert(loadServiceAccount());
  return cachedCredential;
}

export function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  cachedApp = existing.length > 0 ? existing[0] : initializeApp({ credential: getCredential() });
  return cachedApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function databaseBaseUrl(): string {
  let url = (process.env.FIREBASE_DATABASE_URL ?? "").trim();
  if (!url) throw new Error("Missing FIREBASE_DATABASE_URL environment variable");
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  return url.replace(/\/+$/, "");
}

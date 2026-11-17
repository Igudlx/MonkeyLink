import { cert, getApps, initializeApp, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getDatabase } from "firebase-admin/database";

let cachedApp: App | null = null;

function loadServiceAccount() {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT;
  if (!raw) throw new Error("Missing FIREBASE_SERVICE_ACCOUNT environment variable");
  const parsed = JSON.parse(raw);
  if (typeof parsed.private_key === "string") {
    parsed.private_key = parsed.private_key.replace(/\\n/g, "\n");
  }
  return parsed;
}

export function getAdminApp(): App {
  if (cachedApp) return cachedApp;
  const existing = getApps();
  if (existing.length > 0) {
    cachedApp = existing[0];
    return cachedApp;
  }
  const databaseURL = process.env.FIREBASE_DATABASE_URL;
  if (!databaseURL) throw new Error("Missing FIREBASE_DATABASE_URL environment variable");
  cachedApp = initializeApp({
    credential: cert(loadServiceAccount()),
    databaseURL,
  });
  return cachedApp;
}

export function adminAuth() {
  return getAuth(getAdminApp());
}

export function adminDb() {
  return getDatabase(getAdminApp());
}

import { NextResponse } from "next/server";
import { adminAuth } from "@/lib/firebaseAdmin";
import { rtdbGet } from "@/lib/rtdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    NEXT_PUBLIC_FIREBASE_APP_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    FIREBASE_DATABASE_URL: Boolean(process.env.FIREBASE_DATABASE_URL),
    FIREBASE_SERVICE_ACCOUNT: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
  };

  let database = "ok";
  try {
    await rtdbGet("healthcheck");
  } catch (err) {
    database = `error: ${(err as Error).message}`;
  }

  let auth = "ok";
  try {
    await adminAuth().listUsers(1);
  } catch (err) {
    auth = `error: ${(err as Error).message}`;
  }

  return NextResponse.json(
    { ok: database === "ok" && auth === "ok", env, database, auth },
    { headers: { "Cache-Control": "no-store" } }
  );
}

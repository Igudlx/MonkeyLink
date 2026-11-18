import { NextResponse } from "next/server";
import { adminAuth, databaseBaseUrl, getCredential } from "@/lib/firebaseAdmin";
import { errorDetail } from "@/lib/errors";
import { rtdbGet } from "@/lib/rtdb";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function check(run: () => Promise<string | void>): Promise<string> {
  try {
    const result = await run();
    return result ? `ok (${result})` : "ok";
  } catch (err) {
    return `error: ${errorDetail(err)}`;
  }
}

export async function GET() {
  const env = {
    NEXT_PUBLIC_FIREBASE_API_KEY: Boolean(process.env.NEXT_PUBLIC_FIREBASE_API_KEY),
    NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN: Boolean(process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN),
    NEXT_PUBLIC_FIREBASE_PROJECT_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID),
    NEXT_PUBLIC_FIREBASE_APP_ID: Boolean(process.env.NEXT_PUBLIC_FIREBASE_APP_ID),
    FIREBASE_DATABASE_URL: Boolean(process.env.FIREBASE_DATABASE_URL),
    FIREBASE_SERVICE_ACCOUNT: Boolean(process.env.FIREBASE_SERVICE_ACCOUNT),
  };

  const serviceAccount = await check(async () => {
    getCredential();
  });

  const accessToken = await check(async () => {
    await getCredential().getAccessToken();
  });

  const databaseUrl = await check(async () => {
    const host = new URL(databaseBaseUrl()).host;
    const looksRight = host.endsWith(".firebaseio.com") || host.endsWith(".firebasedatabase.app");
    if (!looksRight) throw new Error(`${host} does not look like a Realtime Database URL`);
    return host;
  });

  const database = await check(async () => {
    await rtdbGet("healthcheck");
  });

  const auth = await check(async () => {
    await adminAuth().listUsers(1);
  });

  const ok = [serviceAccount, accessToken, databaseUrl, database, auth].every((value) =>
    value.startsWith("ok")
  );

  return NextResponse.json(
    { ok, env, serviceAccount, accessToken, databaseUrl, database, auth },
    { headers: { "Cache-Control": "no-store" } }
  );
}

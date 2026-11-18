import { NextRequest, NextResponse } from "next/server";
import { docsTokenFor, getDocsPassword, safeEqualStrings } from "@/lib/docsAccess";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const NO_STORE = { "Cache-Control": "no-store" };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const configured = getDocsPassword();
  if (!configured) {
    return NextResponse.json(
      { success: false, error: "APIDOCS_PASSWORD is not set in Vercel." },
      { status: 500, headers: NO_STORE }
    );
  }

  let body: { password?: unknown; token?: unknown };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid request" },
      { status: 400, headers: NO_STORE }
    );
  }

  const expectedToken = docsTokenFor(configured);

  if (typeof body.token === "string" && body.token.length > 0) {
    if (safeEqualStrings(body.token, expectedToken)) {
      return NextResponse.json({ success: true, token: expectedToken }, { headers: NO_STORE });
    }
    return NextResponse.json(
      { success: false, error: "Session expired" },
      { status: 401, headers: NO_STORE }
    );
  }

  if (typeof body.password === "string" && body.password.length > 0) {
    if (safeEqualStrings(docsTokenFor(body.password.trim()), expectedToken)) {
      return NextResponse.json({ success: true, token: expectedToken }, { headers: NO_STORE });
    }
    await sleep(500);
    return NextResponse.json(
      { success: false, error: "Wrong password" },
      { status: 401, headers: NO_STORE }
    );
  }

  return NextResponse.json(
    { success: false, error: "Enter the password" },
    { status: 400, headers: NO_STORE }
  );
}

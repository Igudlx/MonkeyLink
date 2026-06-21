import { NextRequest, NextResponse } from "next/server";
import { isAdminToken } from "@/lib/auth";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let body: { password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.password) {
    return NextResponse.json(
      { success: false, error: "Missing password" },
      { status: 400 }
    );
  }

  if (!isAdminToken(body.password)) {
    return NextResponse.json(
      { success: false, error: "Invalid password" },
      { status: 401 }
    );
  }

  // The token IS the password (simple setup). The client stores it in localStorage.
  return NextResponse.json({ success: true, token: body.password });
}

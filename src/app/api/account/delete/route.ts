import { NextRequest, NextResponse } from "next/server";
import { verifyUser } from "@/lib/auth";
import { adminAuth } from "@/lib/firebaseAdmin";
import { deleteAllUserData } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request.headers.get("Authorization"));
    if (!user || !user.email) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: { password?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    if (!body.password) {
      return NextResponse.json({ success: false, error: "Enter your password" }, { status: 400 });
    }

    const check = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.NEXT_PUBLIC_FIREBASE_API_KEY}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: user.email,
          password: body.password,
          returnSecureToken: false,
        }),
      }
    );

    if (!check.ok) {
      return NextResponse.json({ success: false, error: "Wrong password" }, { status: 401 });
    }

    await deleteAllUserData(user.uid);
    await adminAuth().deleteUser(user.uid);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error. Check the Firebase environment variables in Vercel." },
      { status: 500 }
    );
  }
}

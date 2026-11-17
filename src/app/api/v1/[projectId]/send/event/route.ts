import { NextRequest, NextResponse } from "next/server";
import { checkProjectKey } from "@/lib/auth";
import { setEvent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const auth = await checkProjectKey(projectId, request.headers.get("Authorization"));
    if (auth === "not_found") {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    if (auth === "unauthorized") {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    let body: { name?: string; time?: string | number };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON body" }, { status: 400 });
    }

    if (!body.name || body.time === undefined) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: name, time" },
        { status: 400 }
      );
    }

    await setEvent(projectId, { name: String(body.name), time: String(body.time) });

    return NextResponse.json({ success: true, message: "Event queued" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

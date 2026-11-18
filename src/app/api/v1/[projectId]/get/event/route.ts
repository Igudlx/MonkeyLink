import { NextRequest, NextResponse } from "next/server";
import { errorDetail } from "@/lib/errors";
import { checkProjectKey } from "@/lib/auth";
import { consumeEvent } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
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

    const eventPayload = await consumeEvent(projectId);

    if (!eventPayload) {
      return NextResponse.json({ success: true, type: "event", payload: null });
    }

    return NextResponse.json({
      success: true,
      type: "event",
      payload: JSON.stringify(eventPayload),
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error", detail: errorDetail(err) }, { status: 500 });
  }
}

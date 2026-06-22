import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getProject, consumeEvent } from "@/lib/store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  // Validate project exists
  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  // Validate API key
  const authed = validateApiKey(request.headers.get("Authorization"));
  if (!authed || authed.id !== projectId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  // Consume and return the event (or empty payload)
  const eventPayload = consumeEvent(projectId);

  if (!eventPayload) {
    return NextResponse.json({ success: true, type: "event", payload: null });
  }

  return NextResponse.json({
    success: true,
    type: "event",
    payload: JSON.stringify(eventPayload),
  });
}

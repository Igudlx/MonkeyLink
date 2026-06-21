import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getProject, setEvent } from "@/lib/store";

export const runtime = "nodejs";

export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  const project = await getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const authed = await validateApiKey(request.headers.get("Authorization"));
  if (!authed || authed.id !== projectId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { name?: string; time?: string | number };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.name || body.time === undefined) {
    return NextResponse.json(
      { success: false, error: "Missing required fields: name, time" },
      { status: 400 }
    );
  }

  await setEvent(projectId, {
    name: String(body.name),
    time: String(body.time),
  });

  return NextResponse.json({ success: true, message: "Event queued" });
}

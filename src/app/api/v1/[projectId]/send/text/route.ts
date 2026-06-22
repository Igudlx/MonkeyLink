import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getProject, setText } from "@/lib/store";

export const runtime = "nodejs";

/**
 * POST body:
 * {
 *   "message": "Hello from the web!"
 * }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  const { projectId } = params;

  const project = getProject(projectId);
  if (!project) {
    return NextResponse.json(
      { success: false, error: "Project not found" },
      { status: 404 }
    );
  }

  const authed = validateApiKey(request.headers.get("Authorization"));
  if (!authed || authed.id !== projectId) {
    return NextResponse.json(
      { success: false, error: "Unauthorized" },
      { status: 401 }
    );
  }

  let body: { message?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { success: false, error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  if (!body.message) {
    return NextResponse.json(
      { success: false, error: "Missing required field: message" },
      { status: 400 }
    );
  }

  setText(projectId, body.message);

  return NextResponse.json({ success: true, message: "Text queued" });
}

import { NextRequest, NextResponse } from "next/server";
import { validateApiKey } from "@/lib/auth";
import { getProject, clearAll } from "@/lib/store";

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

  await clearAll(projectId);

  return NextResponse.json({ success: true, message: "Queue cleared" });
}

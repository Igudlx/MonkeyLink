import { NextRequest, NextResponse } from "next/server";
import { checkProjectKey } from "@/lib/auth";
import { clearAll } from "@/lib/store";

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

    await clearAll(projectId);

    return NextResponse.json({ success: true, message: "Queue cleared" });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ success: false, error: "Server error" }, { status: 500 });
  }
}

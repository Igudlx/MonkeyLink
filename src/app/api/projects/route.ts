import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { verifyUser } from "@/lib/auth";
import { createProject, deleteProject, listProjects } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function generateApiKey(): string {
  return (
    "ml_" +
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

function unauthorized() {
  return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
}

function serverError(err: unknown) {
  console.error(err);
  return NextResponse.json(
    { success: false, error: "Server error. Check the Firebase environment variables in Vercel." },
    { status: 500 }
  );
}

export async function GET(request: NextRequest) {
  try {
    const user = await verifyUser(request.headers.get("Authorization"));
    if (!user) return unauthorized();
    return NextResponse.json({ success: true, projects: await listProjects(user.uid) });
  } catch (err) {
    return serverError(err);
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await verifyUser(request.headers.get("Authorization"));
    if (!user) return unauthorized();

    let body: { name?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
    }

    const name = body.name?.trim();
    if (!name) {
      return NextResponse.json(
        { success: false, error: "Missing required field: name" },
        { status: 400 }
      );
    }

    const project = await createProject(user.uid, uuidv4(), name.slice(0, 60), generateApiKey());
    return NextResponse.json({ success: true, project }, { status: 201 });
  } catch (err) {
    return serverError(err);
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await verifyUser(request.headers.get("Authorization"));
    if (!user) return unauthorized();

    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return NextResponse.json({ success: false, error: "Missing id" }, { status: 400 });
    }

    const deleted = await deleteProject(user.uid, id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Project not found" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    return serverError(err);
  }
}

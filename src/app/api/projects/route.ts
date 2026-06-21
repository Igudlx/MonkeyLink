import { NextRequest, NextResponse } from "next/server";
import { v4 as uuidv4 } from "uuid";
import { extractBearer, isAdminToken } from "@/lib/auth";
import { getAllProjects, createProject } from "@/lib/store";

export const runtime = "nodejs";

function generateApiKey(): string {
  return (
    "ml_" +
    Array.from(crypto.getRandomValues(new Uint8Array(16)))
      .map((b) => b.toString(16).padStart(2, "0"))
      .join("")
  );
}

export async function GET(request: NextRequest) {
  const token = extractBearer(request.headers.get("Authorization"));
  if (!token || !isAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  const projects = await getAllProjects();
  return NextResponse.json({ success: true, projects });
}

export async function POST(request: NextRequest) {
  const token = extractBearer(request.headers.get("Authorization"));
  if (!token || !isAdminToken(token)) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
  }

  let body: { name?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ success: false, error: "Invalid JSON" }, { status: 400 });
  }

  if (!body.name || body.name.trim().length === 0) {
    return NextResponse.json(
      { success: false, error: "Missing required field: name" },
      { status: 400 }
    );
  }

  const id = uuidv4();
  const apiKey = generateApiKey();
  const project = await createProject(id, body.name.trim(), apiKey);

  return NextResponse.json({ success: true, project }, { status: 201 });
}

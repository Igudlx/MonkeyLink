import { NextRequest, NextResponse } from "next/server";
import { errorDetail } from "@/lib/errors";
import { checkProjectKey } from "@/lib/auth";
import { consumePending } from "@/lib/store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 10;

const MAX_WAIT_SECONDS = 6;
const CHECK_INTERVAL_MS = 250;
const NO_STORE = { "Cache-Control": "no-store" };

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function GET(
  request: NextRequest,
  { params }: { params: { projectId: string } }
) {
  try {
    const { projectId } = params;

    const auth = await checkProjectKey(projectId, request.headers.get("Authorization"));
    if (auth === "not_found") {
      return NextResponse.json(
        { success: false, error: "Project not found" },
        { status: 404, headers: NO_STORE }
      );
    }
    if (auth === "unauthorized") {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401, headers: NO_STORE }
      );
    }

    const requested = Number(request.nextUrl.searchParams.get("wait") ?? "0");
    const waitSeconds = Number.isFinite(requested)
      ? Math.min(Math.max(requested, 0), MAX_WAIT_SECONDS)
      : 0;
    const deadline = Date.now() + waitSeconds * 1000;

    for (;;) {
      const pending = await consumePending(projectId);
      const hasData = pending.event !== null || pending.text !== null;

      if (hasData || Date.now() >= deadline || request.signal.aborted) {
        return NextResponse.json(
          {
            success: true,
            eventPayload: pending.event ? JSON.stringify(pending.event) : "",
            textPayload: pending.text ?? "",
          },
          { headers: NO_STORE }
        );
      }

      await sleep(Math.min(CHECK_INTERVAL_MS, Math.max(deadline - Date.now(), 0)));
    }
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Server error", detail: errorDetail(err) },
      { status: 500, headers: NO_STORE }
    );
  }
}

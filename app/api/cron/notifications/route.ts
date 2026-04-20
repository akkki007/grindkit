import { NextRequest, NextResponse } from "next/server";
import { dispatchScheduledNotifications } from "@/lib/notifications/dispatch";

export const runtime = "nodejs";
export const maxDuration = 60;

/**
 * Hourly scheduled push dispatcher. Triggered by Vercel Cron (see
 * vercel.json). Vercel attaches `Authorization: Bearer $CRON_SECRET` to
 * cron invocations — we require that before doing anything.
 *
 * Locally you can hit this with the same header to dry-run.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "CRON_SECRET not configured" },
      { status: 500 }
    );
  }
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${secret}`) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const startedAt = Date.now();
  try {
    const report = await dispatchScheduledNotifications(new Date());
    console.log(
      `[cron/notifications] ok ${Date.now() - startedAt}ms`,
      report
    );
    return NextResponse.json({ ok: true, report });
  } catch (err) {
    console.error("[cron/notifications] failed", err);
    return NextResponse.json(
      { ok: false, error: err instanceof Error ? err.message : "Dispatch failed" },
      { status: 500 }
    );
  }
}

import "server-only";

import nodemailer from "nodemailer";
import { ID, Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergePrefs,
  type NotificationKey,
  type NotificationPrefs,
} from "@/lib/data/notifications";
import {
  buildDailyActivityAdmin,
  countDueReviewsAdmin,
} from "./admin-queries";
import { computeStreak, toDayKey } from "@/lib/streak/calculator";

const GMAIL_USER = process.env.GMAIL_USER;
const GMAIL_APP_PASSWORD = process.env.GMAIL_APP_PASSWORD;

let transport: nodemailer.Transporter | null = null;

function getTransport(): nodemailer.Transporter | null {
  if (transport) return transport;
  if (!GMAIL_USER || !GMAIL_APP_PASSWORD) return null;
  transport = nodemailer.createTransport({
    service: "gmail",
    auth: { user: GMAIL_USER, pass: GMAIL_APP_PASSWORD },
  });
  return transport;
}

type UserRow = {
  $id: string;
  userId: string;
  notificationPrefs?: string | null;
  emailNotifications?: boolean | null;
  timezone?: string | null;
};

export type DispatchReport = {
  scannedUsers: number;
  sent: number;
  skipped: number;
  errors: number;
};

const DEDUP_WINDOW_HOURS = 3;

function parsePrefs(raw?: string | null): NotificationPrefs {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    return mergePrefs(JSON.parse(raw) as Partial<NotificationPrefs>);
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

function localTime(tz?: string | null, now = new Date()) {
  try {
    const fmt = new Intl.DateTimeFormat("en-US", {
      timeZone: tz || "UTC",
      hour: "numeric",
      hour12: false,
      weekday: "short",
    });
    const parts = fmt.formatToParts(now);
    const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
    const weekday = parts.find((p) => p.type === "weekday")?.value ?? "";
    return { hour, weekday };
  } catch {
    return { hour: now.getUTCHours(), weekday: "" };
  }
}

async function alreadySent(
  userId: string,
  type: NotificationKey,
  now: Date
): Promise<boolean> {
  const { databases } = createAdminClient();
  const since = new Date(now.getTime() - DEDUP_WINDOW_HOURS * 60 * 60 * 1000);
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.notificationsLog,
      [
        Query.equal("userId", userId),
        Query.equal("type", type),
        Query.greaterThanEqual("sentAt", since.toISOString()),
        Query.limit(1),
      ]
    );
    return res.total > 0;
  } catch {
    return false;
  }
}

async function logSent(userId: string, type: NotificationKey, now: Date) {
  try {
    const { databases } = createAdminClient();
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.notificationsLog,
      ID.unique(),
      { userId, type, sentAt: now.toISOString(), payload: type }
    );
  } catch {
    // non-fatal
  }
}

async function sendEmail(
  to: string,
  subject: string,
  text: string,
  html: string
): Promise<"sent" | "error"> {
  const t = getTransport();
  if (!t) return "error";
  try {
    await t.sendMail({ from: `GrindKit <${GMAIL_USER}>`, to, subject, text, html });
    return "sent";
  } catch {
    return "error";
  }
}

async function listUsers(): Promise<UserRow[]> {
  const { databases } = createAdminClient();
  const out: UserRow[] = [];
  for (let page = 0; page < 50; page++) {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.limit(100), Query.offset(page * 100)]
    );
    out.push(...(res.documents as unknown as UserRow[]));
    if (res.documents.length < 100) break;
  }
  return out;
}

type PlannedEmail = {
  type: NotificationKey;
  subject: string;
  text: string;
  html: string;
};

async function planForUser(
  user: UserRow,
  now: Date
): Promise<PlannedEmail[]> {
  const prefs = parsePrefs(user.notificationPrefs);
  const { hour, weekday } = localTime(user.timezone, now);
  const planned: PlannedEmail[] = [];

  const days = await buildDailyActivityAdmin(user.userId, 90, now);
  const streak = computeStreak(days, now);
  const today = days.get(toDayKey(now));
  const activeToday = Boolean(
    today && (today.problemsSolved > 0 || today.dsaMinutes >= 25)
  );

  if (hour === 9 && prefs.dailyRevision) {
    const due = await countDueReviewsAdmin(user.userId, now);
    if (due > 0) {
      planned.push({
        type: "dailyRevision",
        subject: `GrindKit — ${due} problem${due === 1 ? "" : "s"} due for review`,
        text: `You have ${due} problem${due === 1 ? "" : "s"} waiting in your revision queue.\n\nOpen: ${process.env.APP_URL ?? ""}/app/revise`,
        html: emailHtml(
          "Revision queue",
          `You have <strong>${due} problem${due === 1 ? "" : "s"}</strong> due for review today.`,
          `${process.env.APP_URL ?? ""}/app/revise`,
          "Open revise queue"
        ),
      });
    }
  }

  if (hour === 20 && prefs.streakReminder && !activeToday) {
    const body =
      streak.current > 0
        ? `Don't break your ${streak.current}-day streak — log a problem or 25+ DSA minutes.`
        : "Log a problem or 25+ DSA minutes to start a new streak.";
    planned.push({
      type: "streakReminder",
      subject: "GrindKit — keep the streak alive",
      text: `${body}\n\nOpen: ${process.env.APP_URL ?? ""}/app`,
      html: emailHtml("Keep the streak alive", body, `${process.env.APP_URL ?? ""}/app`, "Open dashboard"),
    });
  }

  if (hour === 23 && prefs.streakAtRisk && !activeToday && streak.current > 0) {
    const body = `${streak.current} days on the line. One problem or 25 min saves it.`;
    planned.push({
      type: "streakAtRisk",
      subject: `GrindKit — ${streak.current}-day streak about to break`,
      text: `${body}\n\nOpen: ${process.env.APP_URL ?? ""}/app`,
      html: emailHtml("Streak about to break", body, `${process.env.APP_URL ?? ""}/app`, "Open dashboard"),
    });
  }

  if (weekday === "Sun" && hour === 19 && prefs.weeklyRecap) {
    const weekTotal = Array.from(days.values()).reduce(
      (acc, d) => acc + d.dsaMinutes + d.devMinutes + d.learningMinutes,
      0
    );
    const solved = Array.from(days.values()).reduce(
      (acc, d) => acc + d.problemsSolved,
      0
    );
    const body = `This week: ${solved} problems solved · ${weekTotal} min logged. Current streak: ${streak.current} day${streak.current === 1 ? "" : "s"}.`;
    planned.push({
      type: "weeklyRecap",
      subject: "GrindKit — weekly recap",
      text: `${body}\n\nOpen: ${process.env.APP_URL ?? ""}/app/analytics`,
      html: emailHtml("Weekly recap", body, `${process.env.APP_URL ?? ""}/app/analytics`, "View analytics"),
    });
  }

  return planned;
}

function emailHtml(title: string, body: string, url: string, cta: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border:1px solid #222;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:monospace">GrindKit</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;letter-spacing:-0.5px">${title}</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#aaa">${body}</p>
          <a href="${url}" style="display:inline-block;background:#f5f5f5;color:#0a0a0a;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:monospace">${cta}</a>
          <p style="margin:24px 0 0;font-size:11px;color:#444;font-family:monospace">
            Manage preferences at <a href="${process.env.APP_URL ?? ""}/app/settings" style="color:#666">/app/settings</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function dispatchScheduledNotifications(
  now = new Date()
): Promise<DispatchReport> {
  if (!getTransport()) {
    return { scannedUsers: 0, sent: 0, skipped: 0, errors: 1 };
  }

  const { users: appwriteUsers } = createAdminClient();
  const userRows = await listUsers();

  const report: DispatchReport = {
    scannedUsers: userRows.length,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  for (const row of userRows) {
    // Skip users who have opted out of email notifications
    if (row.emailNotifications === false) {
      report.skipped++;
      continue;
    }

    // Fetch the user's email from Appwrite auth
    let email: string;
    try {
      const authUser = await appwriteUsers.get(row.userId);
      if (!authUser.email) { report.skipped++; continue; }
      email = authUser.email;
    } catch {
      report.errors++;
      continue;
    }

    let planned: PlannedEmail[] = [];
    try {
      planned = await planForUser(row, now);
    } catch {
      report.errors++;
      continue;
    }

    for (const p of planned) {
      if (await alreadySent(row.userId, p.type, now)) {
        report.skipped++;
        continue;
      }
      const result = await sendEmail(email, p.subject, p.text, p.html);
      if (result === "sent") {
        report.sent++;
        await logSent(row.userId, p.type, now);
      } else {
        report.errors++;
      }
    }
  }

  return report;
}

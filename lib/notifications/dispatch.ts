import "server-only";

import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
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

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:you@example.com";

let vapidConfigured = false;
function ensureVapid(): boolean {
  if (vapidConfigured) return true;
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  vapidConfigured = true;
  return true;
}

type UserRow = {
  $id: string;
  userId: string;
  pushSubscription?: string | null;
  notificationPrefs?: string | null;
  timezone?: string | null;
};

type PushPayload = {
  title: string;
  body: string;
  url?: string;
  tag?: string;
};

export type DispatchReport = {
  scannedUsers: number;
  sent: number;
  skipped: number;
  errors: number;
};

const DEDUP_WINDOW_HOURS = 3;

function parseSubscription(raw: string): WebPushSubscription | null {
  try {
    return JSON.parse(raw) as WebPushSubscription;
  } catch {
    return null;
  }
}

function parsePrefs(raw?: string | null): NotificationPrefs {
  if (!raw) return { ...DEFAULT_NOTIFICATION_PREFS };
  try {
    return mergePrefs(JSON.parse(raw) as Partial<NotificationPrefs>);
  } catch {
    return { ...DEFAULT_NOTIFICATION_PREFS };
  }
}

/**
 * Returns {hour, day} in the user's local timezone. Falls back to UTC if
 * the tz is invalid / missing.
 */
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
    return { hour, weekday, tz: tz || "UTC" };
  } catch {
    return { hour: now.getUTCHours(), weekday: "", tz: "UTC" };
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

async function logSent(
  userId: string,
  type: NotificationKey,
  payload: PushPayload,
  now: Date
) {
  try {
    const { databases } = createAdminClient();
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.notificationsLog,
      ID.unique(),
      {
        userId,
        type,
        sentAt: now.toISOString(),
        payload: JSON.stringify(payload),
      }
    );
  } catch {
    // non-fatal
  }
}

async function sendPush(
  sub: WebPushSubscription,
  payload: PushPayload
): Promise<"sent" | "error"> {
  try {
    await webpush.sendNotification(sub, JSON.stringify(payload));
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
    const docs = res.documents as unknown as UserRow[];
    out.push(...docs);
    if (docs.length < 100) break;
  }
  return out;
}

type PlannedNotification = {
  type: NotificationKey;
  payload: PushPayload;
};

/**
 * Decides which notifications (if any) a user should receive at this
 * tick, based on their local time + activity state.
 */
async function planForUser(
  user: UserRow,
  now: Date
): Promise<PlannedNotification[]> {
  const prefs = parsePrefs(user.notificationPrefs);
  const { hour, weekday } = localTime(user.timezone, now);
  const planned: PlannedNotification[] = [];

  // Daily activity for streak + goal-achieved checks (lightweight: last 7d)
  const days = await buildDailyActivityAdmin(user.userId, 7, now);
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
        payload: {
          title: "Revision queue",
          body: `${due} problem${due === 1 ? "" : "s"} due for review.`,
          url: "/app/revise",
        },
      });
    }
  }

  if (hour === 20 && prefs.streakReminder && !activeToday) {
    planned.push({
      type: "streakReminder",
      payload: {
        title: "Keep the streak alive",
        body:
          streak.current > 0
            ? `Don't break your ${streak.current}-day streak — 25 min or 1 problem does it.`
            : "Log a problem or 25 min DSA to start a streak.",
        url: "/app",
      },
    });
  }

  if (hour === 23 && prefs.streakAtRisk && !activeToday && streak.current > 0) {
    planned.push({
      type: "streakAtRisk",
      payload: {
        title: "Streak about to break",
        body: `${streak.current} days on the line. One problem or 25 min saves it.`,
        url: "/app",
      },
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
    planned.push({
      type: "weeklyRecap",
      payload: {
        title: "Weekly recap",
        body: `${solved} problems · ${weekTotal} min this week. Current streak: ${streak.current}.`,
        url: "/app/analytics",
      },
    });
  }

  return planned;
}

export async function dispatchScheduledNotifications(
  now = new Date()
): Promise<DispatchReport> {
  if (!ensureVapid()) {
    return { scannedUsers: 0, sent: 0, skipped: 0, errors: 1 };
  }

  const users = await listUsers();
  const report: DispatchReport = {
    scannedUsers: users.length,
    sent: 0,
    skipped: 0,
    errors: 0,
  };

  for (const user of users) {
    if (!user.pushSubscription) {
      report.skipped++;
      continue;
    }
    const sub = parseSubscription(user.pushSubscription);
    if (!sub) {
      report.skipped++;
      continue;
    }

    let planned: PlannedNotification[] = [];
    try {
      planned = await planForUser(user, now);
    } catch {
      report.errors++;
      continue;
    }

    for (const p of planned) {
      if (await alreadySent(user.userId, p.type, now)) {
        report.skipped++;
        continue;
      }
      const result = await sendPush(sub, p.payload);
      if (result === "sent") {
        report.sent++;
        await logSent(user.userId, p.type, p.payload, now);
      } else {
        report.errors++;
      }
    }
  }

  return report;
}

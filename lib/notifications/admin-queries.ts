import "server-only";

import { Query } from "node-appwrite";
import { createAdminClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import {
  emptyDay,
  toDayKey,
  type DayActivity,
  type DayKey,
} from "@/lib/streak/calculator";

/**
 * Admin-scoped versions of the dashboard queries, used by the scheduled
 * notifications cron since that runs without a user session.
 */

type ProblemRow = {
  $id: string;
  status: string;
  solvedAt: string;
  patternId: string;
};

type SessionRow = {
  type: "dsa" | "dev" | "learning";
  durationMin: number;
  startedAt: string;
};

export async function buildDailyActivityAdmin(
  userId: string,
  days = 7,
  now = new Date()
): Promise<Map<DayKey, DayActivity>> {
  const { databases } = createAdminClient();
  const since = new Date(now);
  since.setDate(since.getDate() - days);

  const [problemsRes, sessionsRes] = await Promise.all([
    databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.problems, [
      Query.equal("userId", userId),
      Query.greaterThanEqual("solvedAt", since.toISOString()),
      Query.limit(500),
    ]),
    databases.listDocuments(APPWRITE_DATABASE_ID, COLLECTIONS.sessions, [
      Query.equal("userId", userId),
      Query.greaterThanEqual("startedAt", since.toISOString()),
      Query.limit(500),
    ]),
  ]);

  const problems = problemsRes.documents as unknown as ProblemRow[];
  const sessions = sessionsRes.documents as unknown as SessionRow[];

  const map = new Map<DayKey, DayActivity>();
  const ensure = (key: DayKey) => {
    let d = map.get(key);
    if (!d) {
      d = emptyDay(key);
      map.set(key, d);
    }
    return d;
  };

  for (const p of problems) {
    if (p.status !== "solved") continue;
    ensure(toDayKey(new Date(p.solvedAt))).problemsSolved += 1;
  }

  for (const s of sessions) {
    const day = ensure(toDayKey(new Date(s.startedAt)));
    if (s.type === "dsa") day.dsaMinutes += s.durationMin;
    else if (s.type === "dev") day.devMinutes += s.durationMin;
    else day.learningMinutes += s.durationMin;
  }

  return map;
}

export async function countDueReviewsAdmin(
  userId: string,
  now = new Date()
): Promise<number> {
  try {
    const { databases } = createAdminClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      [
        Query.equal("userId", userId),
        Query.lessThanEqual("nextReviewAt", now.toISOString()),
        Query.limit(1),
      ]
    );
    return res.total;
  } catch {
    return 0;
  }
}

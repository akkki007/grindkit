import "server-only";

import { Query } from "node-appwrite";
import { createSessionClient } from "./server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "./config";
import {
  emptyDay,
  toDayKey,
  type DayActivity,
  type DayKey,
} from "@/lib/streak/calculator";

export type UserProblemRow = {
  $id: string;
  libraryId?: string | null;
  title: string;
  url?: string;
  platform: string;
  difficulty: string;
  patternId: string;
  status: string;
  confidence?: number;
  code?: string;
  notes?: string;
  timeTakenMin?: number;
  solvedAt: string;
  nextReviewAt?: string;
  reviewCount?: number;
  easinessFactor?: number;
  interval?: number;
};

export async function listUserProblemsByPattern(
  userId: string,
  patternSlug: string
): Promise<UserProblemRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      [
        Query.equal("userId", userId),
        Query.equal("patternId", patternSlug),
        Query.orderDesc("solvedAt"),
        Query.limit(200),
      ]
    );
    return res.documents as unknown as UserProblemRow[];
  } catch {
    return [];
  }
}

export async function listUserProblems(userId: string): Promise<UserProblemRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      [
        Query.equal("userId", userId),
        Query.orderDesc("solvedAt"),
        Query.limit(500),
      ]
    );
    return res.documents as unknown as UserProblemRow[];
  } catch {
    return [];
  }
}

export async function getUserProblem(
  userId: string,
  id: string
): Promise<UserProblemRow | null> {
  try {
    const { databases } = await createSessionClient();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id
    );
    const typed = doc as unknown as UserProblemRow & { userId: string };
    if (typed.userId !== userId) return null;
    return typed;
  } catch {
    return null;
  }
}

export async function countSolvedPerPattern(
  userId: string
): Promise<Record<string, number>> {
  const problems = await listUserProblems(userId);
  const counts: Record<string, number> = {};
  for (const p of problems) {
    if (p.status === "solved") {
      counts[p.patternId] = (counts[p.patternId] ?? 0) + 1;
    }
  }
  return counts;
}

export type SessionRow = {
  $id: string;
  type: "dsa" | "dev" | "learning";
  durationMin: number;
  startedAt: string;
  endedAt: string;
  problemId?: string | null;
  projectId?: string | null;
  taskId?: string | null;
};

export async function listRecentSessions(
  userId: string,
  sinceISO: string
): Promise<SessionRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.sessions,
      [
        Query.equal("userId", userId),
        Query.greaterThanEqual("startedAt", sinceISO),
        Query.orderDesc("startedAt"),
        Query.limit(500),
      ]
    );
    return res.documents as unknown as SessionRow[];
  } catch {
    return [];
  }
}

export async function buildDailyActivity(
  userId: string,
  days = 90,
  now = new Date()
): Promise<Map<DayKey, DayActivity>> {
  const since = new Date(now);
  since.setDate(since.getDate() - days);
  const [problems, sessions] = await Promise.all([
    listUserProblems(userId),
    listRecentSessions(userId, since.toISOString()),
  ]);

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
    const solved = new Date(p.solvedAt);
    if (solved < since) continue;
    const key = toDayKey(solved);
    ensure(key).problemsSolved += 1;
  }

  for (const s of sessions) {
    const startedAt = new Date(s.startedAt);
    const key = toDayKey(startedAt);
    const day = ensure(key);
    if (s.type === "dsa") day.dsaMinutes += s.durationMin;
    else if (s.type === "dev") day.devMinutes += s.durationMin;
    else day.learningMinutes += s.durationMin;
  }

  return map;
}

export async function listDueReviews(
  userId: string,
  limit = 50,
  now = new Date()
): Promise<UserProblemRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      [
        Query.equal("userId", userId),
        Query.lessThanEqual("nextReviewAt", now.toISOString()),
        Query.orderAsc("nextReviewAt"),
        Query.limit(limit),
      ]
    );
    return res.documents as unknown as UserProblemRow[];
  } catch {
    return [];
  }
}

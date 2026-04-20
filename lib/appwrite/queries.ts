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

export type ProjectRow = {
  $id: string;
  name: string;
  description?: string;
  status: "active" | "paused" | "done" | "archived";
  color?: string;
  createdAt: string;
};

export type TaskRow = {
  $id: string;
  projectId: string;
  title: string;
  status: "backlog" | "in_progress" | "done";
  estimatedHours?: number | null;
  actualHours?: number | null;
  order: number;
  createdAt: string;
  completedAt?: string | null;
};

export async function listUserProjects(userId: string): Promise<ProjectRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      [
        Query.equal("userId", userId),
        Query.orderDesc("createdAt"),
        Query.limit(100),
      ]
    );
    return res.documents as unknown as ProjectRow[];
  } catch {
    return [];
  }
}

export async function getUserProject(
  userId: string,
  id: string
): Promise<ProjectRow | null> {
  try {
    const { databases } = await createSessionClient();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      id
    );
    const typed = doc as unknown as ProjectRow & { userId: string };
    if (typed.userId !== userId) return null;
    return typed;
  } catch {
    return null;
  }
}

function toPlainTask(doc: unknown): TaskRow {
  const d = doc as Record<string, unknown>;
  return {
    $id: String(d.$id ?? ""),
    projectId: String(d.projectId ?? ""),
    title: String(d.title ?? ""),
    status: (d.status as TaskRow["status"]) ?? "backlog",
    estimatedHours:
      typeof d.estimatedHours === "number" ? d.estimatedHours : null,
    actualHours: typeof d.actualHours === "number" ? d.actualHours : null,
    order: typeof d.order === "number" ? d.order : 0,
    createdAt: String(d.createdAt ?? ""),
    completedAt: d.completedAt ? String(d.completedAt) : null,
  };
}

export async function listProjectTasks(
  userId: string,
  projectId: string
): Promise<TaskRow[]> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      [
        Query.equal("userId", userId),
        Query.equal("projectId", projectId),
        Query.orderAsc("order"),
        Query.limit(500),
      ]
    );
    return res.documents.map(toPlainTask);
  } catch {
    return [];
  }
}

export async function countTasksPerProject(
  userId: string
): Promise<Record<string, { total: number; done: number }>> {
  try {
    const { databases } = await createSessionClient();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      [Query.equal("userId", userId), Query.limit(2000)]
    );
    const docs = res.documents as unknown as TaskRow[];
    const counts: Record<string, { total: number; done: number }> = {};
    for (const t of docs) {
      const entry = counts[t.projectId] ?? { total: 0, done: 0 };
      entry.total += 1;
      if (t.status === "done") entry.done += 1;
      counts[t.projectId] = entry;
    }
    return counts;
  } catch {
    return {};
  }
}

export async function analyzeWeakPatterns(
  userId: string,
  sampleSize = 10
): Promise<Array<{ patternId: string; avgConfidence: number; n: number }>> {
  const problems = await listUserProblems(userId);
  const byPattern = new Map<string, number[]>();
  for (const p of problems) {
    if (typeof p.confidence !== "number") continue;
    const arr = byPattern.get(p.patternId) ?? [];
    arr.push(p.confidence);
    byPattern.set(p.patternId, arr);
  }
  const weak: Array<{ patternId: string; avgConfidence: number; n: number }> = [];
  for (const [patternId, scores] of byPattern) {
    const slice = scores.slice(0, sampleSize);
    const avg = slice.reduce((a, b) => a + b, 0) / slice.length;
    if (avg < 3) weak.push({ patternId, avgConfidence: avg, n: slice.length });
  }
  return weak.sort((a, b) => a.avgConfidence - b.avgConfidence);
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

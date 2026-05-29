import "server-only";

import { unstable_cache } from "next/cache";
import { Query } from "node-appwrite";
import { createAdminClient } from "./server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "./config";
import {
  emptyDay,
  toDayKey,
  type DayActivity,
  type DayKey,
} from "@/lib/streak/calculator";
import { cacheTags } from "./cache-tags";

// Re-exported for existing importers; the source of truth lives in the
// client-safe cache-tags module so Server Actions can use it too.
export { cacheTags };

const REVALIDATE_SECONDS = 60;
// Widest window any view needs (analytics heatmap is 84d, dashboard streak
// traces ~90d). We cache this much session history once and slice in memory.
const SESSION_HISTORY_DAYS = 120;

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

/**
 * Single cached fetch of the user's entire problem set (newest first).
 * Keyed by userId so every derived view (counts, due reviews, per-pattern
 * lists, weak topics, heatmap) shares one round-trip. Uses the admin client
 * because cached scopes can't read the session cookie — we scope strictly by
 * userId, which is the same guarantee the per-document permissions give.
 */
function fetchAllProblems(userId: string): Promise<UserProblemRow[]> {
  return unstable_cache(
    async () => {
      try {
        const { databases } = createAdminClient();
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
    },
    ["user-problems", userId],
    { tags: [cacheTags.problems(userId)], revalidate: REVALIDATE_SECONDS }
  )();
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

function fetchRecentSessions(userId: string): Promise<SessionRow[]> {
  return unstable_cache(
    async () => {
      try {
        const { databases } = createAdminClient();
        const since = new Date();
        since.setDate(since.getDate() - SESSION_HISTORY_DAYS);
        const res = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.sessions,
          [
            Query.equal("userId", userId),
            Query.greaterThanEqual("startedAt", since.toISOString()),
            Query.orderDesc("startedAt"),
            Query.limit(500),
          ]
        );
        return res.documents as unknown as SessionRow[];
      } catch {
        return [];
      }
    },
    ["user-sessions", userId],
    { tags: [cacheTags.sessions(userId)], revalidate: REVALIDATE_SECONDS }
  )();
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

function fetchAllProjects(userId: string): Promise<ProjectRow[]> {
  return unstable_cache(
    async () => {
      try {
        const { databases } = createAdminClient();
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
    },
    ["user-projects", userId],
    { tags: [cacheTags.projects(userId)], revalidate: REVALIDATE_SECONDS }
  )();
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

function fetchAllTasks(userId: string): Promise<TaskRow[]> {
  return unstable_cache(
    async () => {
      try {
        const { databases } = createAdminClient();
        const res = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.tasks,
          [
            Query.equal("userId", userId),
            Query.orderAsc("order"),
            Query.limit(2000),
          ]
        );
        return res.documents.map(toPlainTask);
      } catch {
        return [];
      }
    },
    ["user-tasks", userId],
    { tags: [cacheTags.tasks(userId)], revalidate: REVALIDATE_SECONDS }
  )();
}

// --- Derived, in-memory views over the cached datasets ---------------------

export async function listUserProblems(userId: string): Promise<UserProblemRow[]> {
  return fetchAllProblems(userId);
}

export async function listUserProblemsByPattern(
  userId: string,
  patternSlug: string
): Promise<UserProblemRow[]> {
  const problems = await fetchAllProblems(userId);
  return problems.filter((p) => p.patternId === patternSlug);
}

export async function getUserProblem(
  userId: string,
  id: string
): Promise<UserProblemRow | null> {
  const problems = await fetchAllProblems(userId);
  return problems.find((p) => p.$id === id) ?? null;
}

export async function countSolvedPerPattern(
  userId: string
): Promise<Record<string, number>> {
  const problems = await fetchAllProblems(userId);
  const counts: Record<string, number> = {};
  for (const p of problems) {
    if (p.status === "solved") {
      counts[p.patternId] = (counts[p.patternId] ?? 0) + 1;
    }
  }
  return counts;
}

export async function listRecentSessions(
  userId: string,
  sinceISO: string
): Promise<SessionRow[]> {
  const sessions = await fetchRecentSessions(userId);
  return sessions.filter((s) => s.startedAt >= sinceISO);
}

export async function buildDailyActivity(
  userId: string,
  days = 90,
  now = new Date()
): Promise<Map<DayKey, DayActivity>> {
  const since = new Date(now);
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  const [problems, sessions] = await Promise.all([
    fetchAllProblems(userId),
    fetchRecentSessions(userId),
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
    ensure(toDayKey(solved)).problemsSolved += 1;
  }

  for (const s of sessions) {
    if (s.startedAt < sinceISO) continue;
    const day = ensure(toDayKey(new Date(s.startedAt)));
    if (s.type === "dsa") day.dsaMinutes += s.durationMin;
    else if (s.type === "dev") day.devMinutes += s.durationMin;
    else day.learningMinutes += s.durationMin;
  }

  return map;
}

export async function listUserProjects(userId: string): Promise<ProjectRow[]> {
  return fetchAllProjects(userId);
}

export async function getUserProject(
  userId: string,
  id: string
): Promise<ProjectRow | null> {
  const projects = await fetchAllProjects(userId);
  return projects.find((p) => p.$id === id) ?? null;
}

export async function listProjectTasks(
  userId: string,
  projectId: string
): Promise<TaskRow[]> {
  const tasks = await fetchAllTasks(userId);
  return tasks
    .filter((t) => t.projectId === projectId)
    .sort((a, b) => a.order - b.order);
}

export async function countTasksPerProject(
  userId: string
): Promise<Record<string, { total: number; done: number }>> {
  const tasks = await fetchAllTasks(userId);
  const counts: Record<string, { total: number; done: number }> = {};
  for (const t of tasks) {
    const entry = counts[t.projectId] ?? { total: 0, done: 0 };
    entry.total += 1;
    if (t.status === "done") entry.done += 1;
    counts[t.projectId] = entry;
  }
  return counts;
}

export async function analyzeWeakPatterns(
  userId: string,
  sampleSize = 10
): Promise<Array<{ patternId: string; avgConfidence: number; n: number }>> {
  const problems = await fetchAllProblems(userId);
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

export type DailyGoals = { problems: number; minutes: number };

/**
 * Cached daily-goal targets from the user doc (defaults if unset). Lets the
 * dashboard show goal progress without a fresh round-trip on every visit.
 */
export function getDailyGoals(userId: string): Promise<DailyGoals> {
  return unstable_cache(
    async () => {
      try {
        const { databases } = createAdminClient();
        const res = await databases.listDocuments(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.users,
          [Query.equal("userId", userId), Query.limit(1)]
        );
        const doc = res.documents[0] as
          | { dailyGoalProblems?: number; dailyGoalMinutes?: number }
          | undefined;
        return {
          problems: doc?.dailyGoalProblems ?? 3,
          minutes: doc?.dailyGoalMinutes ?? 60,
        };
      } catch {
        return { problems: 3, minutes: 60 };
      }
    },
    ["user-goals", userId],
    { tags: [cacheTags.user(userId)], revalidate: REVALIDATE_SECONDS }
  )();
}

export async function listDueReviews(
  userId: string,
  limit = 50,
  now = new Date()
): Promise<UserProblemRow[]> {
  const problems = await fetchAllProblems(userId);
  const nowISO = now.toISOString();
  return problems
    .filter((p) => p.nextReviewAt && p.nextReviewAt <= nowISO)
    .sort((a, b) => (a.nextReviewAt ?? "").localeCompare(b.nextReviewAt ?? ""))
    .slice(0, limit);
}

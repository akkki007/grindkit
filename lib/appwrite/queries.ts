import "server-only";

import { Query } from "node-appwrite";
import { createSessionClient } from "./server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "./config";

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

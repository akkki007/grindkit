"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ID, Permission, Role } from "node-appwrite";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import {
  difficultyEnum,
  platformEnum,
  problemStatusEnum,
} from "@/lib/appwrite/schemas";
import { initialSRS, applyReview, type SRSState } from "@/lib/srs/sm2";
import { httpUrlOrEmpty } from "@/lib/validators";

const problemInputSchema = z.object({
  libraryId: z.string().optional().nullable(),
  title: z.string().min(1).max(200),
  url: httpUrlOrEmpty,
  platform: platformEnum,
  difficulty: difficultyEnum,
  patternId: z.string().min(1),
  status: problemStatusEnum.default("solved"),
  confidence: z.coerce.number().int().min(1).max(5),
  code: z.string().max(20_000).optional().default(""),
  notes: z.string().max(20_000).optional().default(""),
  timeTakenMin: z.coerce.number().int().min(0).max(1_000).optional().default(0),
});

export type ProblemInput = z.infer<typeof problemInputSchema>;

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProblemAction(
  input: ProblemInput
): Promise<ActionResult> {
  const parsed = problemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const now = new Date();
    const srs = initialSRS(now);
    const confidence = data.confidence as 1 | 2 | 3 | 4 | 5;
    const afterReview = applyReview(srs, confidence, now);

    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      ID.unique(),
      {
        userId: me.$id,
        libraryId: data.libraryId ?? null,
        title: data.title,
        url: data.url || null,
        platform: data.platform,
        difficulty: data.difficulty,
        patternId: data.patternId,
        status: data.status,
        confidence: data.confidence,
        code: data.code,
        notes: data.notes,
        timeTakenMin: data.timeTakenMin,
        solvedAt: now.toISOString(),
        nextReviewAt: afterReview.nextReviewAt,
        reviewCount: afterReview.reviewCount,
        easinessFactor: afterReview.easinessFactor,
        interval: afterReview.interval,
      },
      [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
        Permission.delete(Role.user(me.$id)),
      ]
    );

    revalidatePath("/app/patterns");
    revalidatePath(`/app/patterns/${data.patternId}`);
    revalidatePath("/app");
    revalidatePath("/app/revise");

    return { ok: true, id: doc.$id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save problem";
    return { ok: false, error: message };
  }
}

export async function updateProblemAction(
  id: string,
  input: ProblemInput
): Promise<ActionResult> {
  const parsed = problemInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id
    );
    if ((existing as unknown as { userId: string }).userId !== me.$id) {
      return { ok: false, error: "Not found" };
    }
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id,
      {
        title: data.title,
        url: data.url || null,
        platform: data.platform,
        difficulty: data.difficulty,
        patternId: data.patternId,
        status: data.status,
        confidence: data.confidence,
        code: data.code,
        notes: data.notes,
        timeTakenMin: data.timeTakenMin,
      }
    );

    revalidatePath(`/app/problems/${id}`);
    revalidatePath(`/app/patterns/${data.patternId}`);
    revalidatePath("/app/patterns");
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update problem";
    return { ok: false, error: message };
  }
}

const reviewSchema = z.object({
  confidence: z.coerce.number().int().min(1).max(5),
});

type ReviewResult =
  | { ok: true; nextReviewAt: string; interval: number }
  | { ok: false; error: string };

export async function reviewProblemAction(
  id: string,
  confidence: number
): Promise<ReviewResult> {
  const parsed = reviewSchema.safeParse({ confidence });
  if (!parsed.success) {
    return { ok: false, error: "Invalid confidence" };
  }

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id
    );
    const prev = doc as unknown as Partial<SRSState> & {
      patternId: string;
      userId?: string;
    };
    if (prev.userId !== me.$id) {
      return { ok: false, error: "Not found" };
    }
    const next = applyReview(
      prev,
      parsed.data.confidence as 1 | 2 | 3 | 4 | 5
    );
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id,
      {
        confidence: parsed.data.confidence,
        easinessFactor: next.easinessFactor,
        interval: next.interval,
        reviewCount: next.reviewCount,
        nextReviewAt: next.nextReviewAt,
      }
    );

    revalidatePath("/app/revise");
    revalidatePath("/app");
    revalidatePath(`/app/patterns/${prev.patternId}`);
    return {
      ok: true,
      nextReviewAt: next.nextReviewAt,
      interval: next.interval,
    };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Review failed";
    return { ok: false, error: message };
  }
}

export async function deleteProblemAction(id: string, patternSlug?: string) {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.problems,
      id
    );
    if ((existing as unknown as { userId: string }).userId === me.$id) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.problems,
        id
      );
    }
  } catch {
    // ignore
  }
  if (patternSlug) revalidatePath(`/app/patterns/${patternSlug}`);
  revalidatePath("/app/patterns");
  redirect("/app/patterns");
}

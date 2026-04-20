"use server";

import { revalidatePath } from "next/cache";
import { ID, Permission, Query, Role } from "node-appwrite";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { PROFILE_KEYS, type Profiles } from "@/lib/data/profiles";

const urlOrEmpty = z.string().trim().url().or(z.literal("")).optional();
const profilesSchema = z.object({
  leetcode: urlOrEmpty,
  neetcode: urlOrEmpty,
  codeforces: urlOrEmpty,
  codechef: urlOrEmpty,
  hackerrank: urlOrEmpty,
  gfg: urlOrEmpty,
  github: urlOrEmpty,
  hashnode: urlOrEmpty,
  linkedin: urlOrEmpty,
});

export type ProfileUpdateInput = z.infer<typeof profilesSchema>;

type ActionResult = { ok: true } | { ok: false; error: string };

export async function getUserProfile(): Promise<{
  userId: string;
  profiles: Profiles;
  dailyGoalProblems?: number;
  dailyGoalMinutes?: number;
  hasPushSubscription: boolean;
} | null> {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("userId", me.$id), Query.limit(1)]
    );
    if (res.total === 0) {
      return { userId: me.$id, profiles: {}, hasPushSubscription: false };
    }
    const doc = res.documents[0] as unknown as {
      userId: string;
      profiles?: string;
      pushSubscription?: string | null;
      dailyGoalProblems?: number;
      dailyGoalMinutes?: number;
    };
    let profiles: Profiles = {};
    if (doc.profiles) {
      try {
        profiles = JSON.parse(doc.profiles) as Profiles;
      } catch {
        profiles = {};
      }
    }
    return {
      userId: doc.userId,
      profiles,
      dailyGoalProblems: doc.dailyGoalProblems,
      dailyGoalMinutes: doc.dailyGoalMinutes,
      hasPushSubscription: Boolean(doc.pushSubscription),
    };
  } catch {
    return null;
  }
}

export async function updateProfilesAction(
  input: ProfileUpdateInput
): Promise<ActionResult> {
  const parsed = profilesSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid URL" };
  }
  // Drop empty strings so we store a clean map
  const profiles: Profiles = {};
  for (const key of PROFILE_KEYS) {
    const val = parsed.data[key];
    if (typeof val === "string" && val.trim()) profiles[key] = val.trim();
  }

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();

    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("userId", me.$id), Query.limit(1)]
    );

    const payload = {
      userId: me.$id,
      name: me.name ?? "",
      profiles: JSON.stringify(profiles),
      joinedAt: new Date().toISOString(),
    };

    if (existing.total === 0) {
      await databases.createDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.users,
        ID.unique(),
        payload,
        [
          Permission.read(Role.user(me.$id)),
          Permission.update(Role.user(me.$id)),
          Permission.delete(Role.user(me.$id)),
        ]
      );
    } else {
      await databases.updateDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.users,
        existing.documents[0].$id,
        { profiles: JSON.stringify(profiles) }
      );
    }

    revalidatePath("/app/settings");
    revalidatePath("/app", "layout");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save profiles";
    return { ok: false, error: message };
  }
}

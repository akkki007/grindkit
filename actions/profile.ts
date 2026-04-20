"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ID, Permission, Query, Role } from "node-appwrite";
import { z } from "zod";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import {
  APPWRITE_DATABASE_ID,
  COLLECTIONS,
  SESSION_COOKIE,
} from "@/lib/appwrite/config";
import { PROFILE_KEYS, type Profiles } from "@/lib/data/profiles";
import { httpUrlOrEmpty as urlOrEmpty } from "@/lib/validators";
import {
  DEFAULT_NOTIFICATION_PREFS,
  mergePrefs,
  NOTIFICATION_KEYS,
  type NotificationPrefs,
} from "@/lib/data/notifications";

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

export type FullProfile = {
  userId: string;
  email?: string;
  name?: string;
  profiles: Profiles;
  notificationPrefs: NotificationPrefs;
  dailyGoalProblems: number;
  dailyGoalMinutes: number;
  timezone?: string;
  hasPushSubscription: boolean;
};

export async function getUserProfile(): Promise<FullProfile | null> {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("userId", me.$id), Query.limit(1)]
    );
    if (res.total === 0) {
      return {
        userId: me.$id,
        email: me.email,
        name: me.name,
        profiles: {},
        notificationPrefs: { ...DEFAULT_NOTIFICATION_PREFS },
        dailyGoalProblems: 3,
        dailyGoalMinutes: 60,
        hasPushSubscription: false,
      };
    }
    const doc = res.documents[0] as unknown as {
      userId: string;
      profiles?: string;
      pushSubscription?: string | null;
      notificationPrefs?: string | null;
      dailyGoalProblems?: number;
      dailyGoalMinutes?: number;
      timezone?: string;
    };
    let profiles: Profiles = {};
    if (doc.profiles) {
      try {
        profiles = JSON.parse(doc.profiles) as Profiles;
      } catch {
        profiles = {};
      }
    }
    let prefs: Partial<NotificationPrefs> = {};
    if (doc.notificationPrefs) {
      try {
        prefs = JSON.parse(doc.notificationPrefs) as Partial<NotificationPrefs>;
      } catch {
        prefs = {};
      }
    }
    return {
      userId: doc.userId,
      email: me.email,
      name: me.name,
      profiles,
      notificationPrefs: mergePrefs(prefs),
      dailyGoalProblems: doc.dailyGoalProblems ?? 3,
      dailyGoalMinutes: doc.dailyGoalMinutes ?? 60,
      timezone: doc.timezone,
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

async function ensureUsersDoc(): Promise<
  { userDocId: string; userId: string; email: string; name: string } | null
> {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("userId", me.$id), Query.limit(1)]
    );
    if (existing.total > 0) {
      return {
        userDocId: existing.documents[0].$id,
        userId: me.$id,
        email: me.email,
        name: me.name ?? "",
      };
    }
    const created = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ID.unique(),
      {
        userId: me.$id,
        name: me.name ?? "",
        joinedAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
        Permission.delete(Role.user(me.$id)),
      ]
    );
    return {
      userDocId: created.$id,
      userId: me.$id,
      email: me.email,
      name: me.name ?? "",
    };
  } catch {
    return null;
  }
}

const goalsSchema = z.object({
  dailyGoalProblems: z.coerce.number().int().min(0).max(100),
  dailyGoalMinutes: z.coerce.number().int().min(0).max(1440),
  timezone: z.string().trim().max(64).optional(),
});

export type GoalsInput = z.infer<typeof goalsSchema>;

export async function updateGoalsAction(
  input: GoalsInput
): Promise<ActionResult> {
  const parsed = goalsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid goals" };
  }
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };
  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId,
      {
        dailyGoalProblems: parsed.data.dailyGoalProblems,
        dailyGoalMinutes: parsed.data.dailyGoalMinutes,
        timezone: parsed.data.timezone || null,
      }
    );
    revalidatePath("/app/settings");
    revalidatePath("/app");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save goals";
    return { ok: false, error: message };
  }
}

const prefsSchema = z.object(
  Object.fromEntries(NOTIFICATION_KEYS.map((k) => [k, z.boolean()])) as Record<
    (typeof NOTIFICATION_KEYS)[number],
    z.ZodBoolean
  >
);

export async function updateNotificationPrefsAction(
  input: NotificationPrefs
): Promise<ActionResult> {
  const parsed = prefsSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid preferences" };
  }
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };
  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId,
      { notificationPrefs: JSON.stringify(parsed.data) }
    );
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save prefs";
    return { ok: false, error: message };
  }
}

async function purgeCollectionByUserId(
  databases: Awaited<ReturnType<typeof createSessionClient>>["databases"],
  collectionId: string,
  userId: string
) {
  for (let guard = 0; guard < 20; guard++) {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      collectionId,
      [Query.equal("userId", userId), Query.limit(100)]
    );
    if (res.documents.length === 0) return;
    await Promise.all(
      res.documents.map((d) =>
        databases.deleteDocument(APPWRITE_DATABASE_ID, collectionId, d.$id)
      )
    );
    if (res.documents.length < 100) return;
  }
}

export async function deleteAccountAction(): Promise<never> {
  const ref = await ensureUsersDoc();
  if (!ref) redirect("/login");

  const { databases } = await createSessionClient();

  try {
    await Promise.all([
      purgeCollectionByUserId(databases, COLLECTIONS.problems, ref.userId),
      purgeCollectionByUserId(databases, COLLECTIONS.sessions, ref.userId),
      purgeCollectionByUserId(databases, COLLECTIONS.tasks, ref.userId),
      purgeCollectionByUserId(databases, COLLECTIONS.projects, ref.userId),
    ]);
    await databases.deleteDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId
    );
  } catch {
    // best-effort: continue to account delete regardless
  }

  try {
    const admin = createAdminClient();
    await admin.users.delete(ref.userId);
  } catch {
    // ignore — cookie clear below will still log them out
  }

  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

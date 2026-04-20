"use server";

import { revalidatePath } from "next/cache";
import { ID, Permission, Query, Role } from "node-appwrite";
import webpush, { type PushSubscription as WebPushSubscription } from "web-push";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";

const VAPID_PUBLIC = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
const VAPID_PRIVATE = process.env.VAPID_PRIVATE_KEY;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT ?? "mailto:you@example.com";

function configureWebPush(): boolean {
  if (!VAPID_PUBLIC || !VAPID_PRIVATE) return false;
  webpush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC, VAPID_PRIVATE);
  return true;
}

const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  expirationTime: z.number().nullable().optional(),
});

type ActionResult = { ok: true } | { ok: false; error: string };

async function ensureUsersDoc(): Promise<{ userDocId: string; userId: string } | null> {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      [Query.equal("userId", me.$id), Query.limit(1)]
    );
    if (existing.total > 0) {
      return { userDocId: existing.documents[0].$id, userId: me.$id };
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
    return { userDocId: created.$id, userId: me.$id };
  } catch {
    return null;
  }
}

export async function savePushSubscriptionAction(
  subscription: unknown
): Promise<ActionResult> {
  const parsed = subscriptionSchema.safeParse(subscription);
  if (!parsed.success) {
    return { ok: false, error: "Invalid subscription payload" };
  }
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };

  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId,
      { pushSubscription: JSON.stringify(parsed.data) }
    );
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not save subscription";
    return { ok: false, error: message };
  }
}

export async function clearPushSubscriptionAction(): Promise<ActionResult> {
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };
  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId,
      { pushSubscription: null }
    );
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not clear subscription";
    return { ok: false, error: message };
  }
}

export async function sendTestPushAction(): Promise<ActionResult> {
  if (!configureWebPush()) {
    return {
      ok: false,
      error: "VAPID keys not configured on the server. Set VAPID_* env vars.",
    };
  }
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };

  try {
    const { databases } = await createSessionClient();
    const doc = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId
    );
    const sub = (doc as unknown as { pushSubscription?: string | null })
      .pushSubscription;
    if (!sub) {
      return { ok: false, error: "No push subscription saved for this user yet." };
    }
    const parsed = subscriptionSchema.safeParse(JSON.parse(sub));
    if (!parsed.success) {
      return { ok: false, error: "Stored subscription is invalid." };
    }
    await webpush.sendNotification(
      parsed.data as unknown as WebPushSubscription,
      JSON.stringify({
        title: "GrindKit",
        body: "Push is wired up — you'll hear from us when your streak's on the line.",
        url: "/app",
      })
    );
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not send push";
    return { ok: false, error: message };
  }
}

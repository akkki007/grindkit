"use server";

import { revalidatePath } from "next/cache";
import { Query } from "node-appwrite";
import nodemailer from "nodemailer";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { cacheTags } from "@/lib/appwrite/cache-tags";
import { updateTag } from "next/cache";

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
    return null;
  } catch {
    return null;
  }
}

export async function setEmailNotificationsAction(
  enabled: boolean
): Promise<ActionResult> {
  const ref = await ensureUsersDoc();
  if (!ref) return { ok: false, error: "Could not load user" };
  try {
    const { databases } = await createSessionClient();
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.users,
      ref.userDocId,
      { emailNotifications: enabled }
    );
    updateTag(cacheTags.user(ref.userId));
    revalidatePath("/app/settings");
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed" };
  }
}

export async function sendTestEmailAction(): Promise<ActionResult> {
  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;
  const appUrl = process.env.APP_URL ?? "";

  if (!gmailUser || !gmailPass) {
    return { ok: false, error: "GMAIL_USER or GMAIL_APP_PASSWORD not configured on the server." };
  }

  try {
    const { account } = await createSessionClient();
    const me = await account.get();
    if (!me.email) return { ok: false, error: "No email on your account." };

    const transport = nodemailer.createTransport({
      service: "gmail",
      auth: { user: gmailUser, pass: gmailPass },
    });

    await transport.sendMail({
      from: `GrindKit <${gmailUser}>`,
      to: me.email,
      subject: "GrindKit — email notifications are working",
      text: `Email delivery is set up. You'll get streak reminders, revision nudges, and weekly recaps at this address.\n\nManage preferences: ${appUrl}/app/settings`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:520px;background:#111;border:1px solid #222;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:monospace">GrindKit</p>
          <h1 style="margin:0 0 16px;font-size:22px;font-weight:700;color:#f5f5f5;letter-spacing:-0.5px">Email is working</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#aaa">You'll receive streak reminders, revision nudges, and weekly recaps at this address.</p>
          <a href="${appUrl}/app/settings" style="display:inline-block;background:#f5f5f5;color:#0a0a0a;text-decoration:none;padding:10px 20px;border-radius:8px;font-size:13px;font-weight:600;font-family:monospace">Manage preferences</a>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });

    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Send failed" };
  }
}

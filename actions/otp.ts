"use server";

import { createHash, randomInt } from "crypto";
import { cookies } from "next/headers";
import { ID, Query } from "node-appwrite";
import nodemailer from "nodemailer";
import { z } from "zod";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS, SESSION_COOKIE } from "@/lib/appwrite/config";

const OTP_COLLECTION = "otp_verifications";
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

type ActionResult = { ok: true } | { ok: false; error: string };

function hashOtp(otp: string): string {
  return createHash("sha256").update(otp).digest("hex");
}

function getTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;
  return nodemailer.createTransport({ service: "gmail", auth: { user, pass } });
}

const sendSchema = z.object({
  name: z.string().min(1).max(64),
  email: z.string().email(),
});

export async function sendOtpAction(
  input: z.infer<typeof sendSchema>
): Promise<ActionResult> {
  const parsed = sendSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email } = parsed.data;

  const transport = getTransport();
  if (!transport) {
    return { ok: false, error: "Email not configured on server (GMAIL_USER / GMAIL_APP_PASSWORD missing)." };
  }

  const { users: adminUsers } = createAdminClient();

  // Block if email is already registered
  try {
    const list = await adminUsers.list([Query.equal("email", email)]);
    if (list.total > 0) {
      return { ok: false, error: "An account with this email already exists." };
    }
  } catch {
    // non-fatal — proceed
  }

  const otp = randomInt(100_000, 999_999).toString();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { databases } = createAdminClient();

  // Upsert: delete any existing OTP for this email before creating a fresh one
  try {
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      OTP_COLLECTION,
      [Query.equal("email", email), Query.limit(5)]
    );
    await Promise.all(
      existing.documents.map((d) =>
        databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, d.$id)
      )
    );
  } catch {
    // ignore if collection doesn't exist yet or empty
  }

  try {
    await databases.createDocument(
      APPWRITE_DATABASE_ID,
      OTP_COLLECTION,
      ID.unique(),
      { email, otpHash, expiresAt }
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not store OTP." };
  }

  const appUrl = process.env.APP_URL ?? "";
  try {
    await transport.sendMail({
      from: `GrindKit <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `GrindKit — your verification code is ${otp}`,
      text: `Hi ${name},\n\nYour GrindKit verification code is:\n\n${otp}\n\nIt expires in 10 minutes. If you didn't request this, ignore this email.\n\n${appUrl}`,
      html: `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111;border:1px solid #222;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:monospace">GrindKit</p>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f5f5f5;letter-spacing:-0.5px">Verify your email</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#888">Hi ${name}, enter this code to finish creating your account.</p>
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
            <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#f5f5f5">${otp}</span>
          </div>
          <p style="margin:0;font-size:12px;color:#555;font-family:monospace">Expires in 10 minutes. If you didn't request this, ignore this email.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }

  return { ok: true };
}

const verifySchema = z.object({
  name: z.string().min(1).max(64),
  email: z.string().email(),
  password: z.string().min(8).max(256),
  otp: z.string().length(6).regex(/^\d{6}$/, "OTP must be 6 digits"),
});

export async function verifyOtpAndSignupAction(
  input: z.infer<typeof verifySchema>
): Promise<ActionResult> {
  const parsed = verifySchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password, otp } = parsed.data;

  const { databases } = createAdminClient();

  // Find OTP record
  let record: { $id: string; otpHash: string; expiresAt: string } | null = null;
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      OTP_COLLECTION,
      [Query.equal("email", email), Query.limit(1)]
    );
    if (res.total === 0) {
      return { ok: false, error: "No verification code found. Please request a new one." };
    }
    record = res.documents[0] as unknown as { $id: string; otpHash: string; expiresAt: string };
  } catch {
    return { ok: false, error: "Could not verify code. Please try again." };
  }

  // Check expiry
  if (new Date(record.expiresAt) < new Date()) {
    await databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, record.$id).catch(() => {});
    return { ok: false, error: "Verification code expired. Please request a new one." };
  }

  // Check hash
  if (hashOtp(otp) !== record.otpHash) {
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  // OTP valid — create account
  const { account: adminAccount, users: adminUsers2 } = createAdminClient();
  let newUserId: string;
  try {
    const created = await adminUsers2.create(ID.unique(), email, password, name);
    newUserId = created.$id;
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not create account." };
  }

  // Mark email as verified since the user just proved ownership via OTP
  adminUsers2.updateEmailVerification(newUserId, true).catch(() => {});

  // Create session
  try {
    const session = await adminAccount.createEmailPasswordSession(email, password);
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE, session.secret, {
      httpOnly: true,
      sameSite: "strict",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_MAX_AGE_SECONDS,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Account created but login failed — try logging in." };
  }

  // Clean up OTP record
  databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, record.$id).catch(() => {});

  return { ok: true };
}

// ─── Verify email for existing (already logged-in) users ─────────────────────

const sendVerifSchema = z.object({ email: z.string().email(), name: z.string() });

export async function sendVerificationOtpAction(
  input: z.infer<typeof sendVerifSchema>
): Promise<ActionResult> {
  const parsed = sendVerifSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: "Invalid input" };
  const { email, name } = parsed.data;

  const transport = getTransport();
  if (!transport) return { ok: false, error: "Email not configured on server." };

  const otp = randomInt(100_000, 999_999).toString();
  const otpHash = hashOtp(otp);
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  const { databases } = createAdminClient();

  // Delete any existing OTP for this email
  try {
    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID, OTP_COLLECTION,
      [Query.equal("email", email), Query.limit(5)]
    );
    await Promise.all(
      existing.documents.map((d) =>
        databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, d.$id)
      )
    );
  } catch { /* ignore */ }

  try {
    await databases.createDocument(
      APPWRITE_DATABASE_ID, OTP_COLLECTION, ID.unique(),
      { email, otpHash, expiresAt }
    );
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not store OTP." };
  }

  const appUrl = process.env.APP_URL ?? "";
  try {
    await transport.sendMail({
      from: `GrindKit <${process.env.GMAIL_USER}>`,
      to: email,
      subject: `GrindKit — your verification code is ${otp}`,
      text: `Hi ${name},\n\nYour GrindKit email verification code is:\n\n${otp}\n\nIt expires in 10 minutes.\n\n${appUrl}`,
      html: `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Helvetica Neue',Arial,sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px">
    <tr><td align="center">
      <table width="100%" style="max-width:480px;background:#111;border:1px solid #222;border-radius:12px;padding:32px">
        <tr><td>
          <p style="margin:0 0 4px;font-size:10px;letter-spacing:2px;text-transform:uppercase;color:#555;font-family:monospace">GrindKit</p>
          <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#f5f5f5;letter-spacing:-0.5px">Verify your email</h1>
          <p style="margin:0 0 24px;font-size:14px;line-height:1.6;color:#888">Hi ${name}, enter this code in GrindKit to verify your email address.</p>
          <div style="background:#1a1a1a;border:1px solid #333;border-radius:8px;padding:20px;text-align:center;margin-bottom:24px">
            <span style="font-family:monospace;font-size:36px;font-weight:700;letter-spacing:10px;color:#f5f5f5">${otp}</span>
          </div>
          <p style="margin:0;font-size:12px;color:#555;font-family:monospace">Expires in 10 minutes.</p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`,
    });
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Failed to send email." };
  }

  return { ok: true };
}

export async function verifyEmailOtpAction(otp: string): Promise<ActionResult> {
  const parsed = z.string().length(6).regex(/^\d{6}$/).safeParse(otp);
  if (!parsed.success) return { ok: false, error: "OTP must be 6 digits." };

  // Identify the logged-in user
  let userId: string;
  let email: string;
  try {
    const { account } = await createSessionClient();
    const me = await account.get();
    userId = me.$id;
    email = me.email;
  } catch {
    return { ok: false, error: "Not logged in." };
  }

  const { databases, users: adminUsers } = createAdminClient();

  // Find OTP record for this email
  let record: { $id: string; otpHash: string; expiresAt: string } | null = null;
  try {
    const res = await databases.listDocuments(
      APPWRITE_DATABASE_ID, OTP_COLLECTION,
      [Query.equal("email", email), Query.limit(1)]
    );
    if (res.total === 0) return { ok: false, error: "No verification code found. Request a new one." };
    record = res.documents[0] as unknown as { $id: string; otpHash: string; expiresAt: string };
  } catch {
    return { ok: false, error: "Could not verify code. Please try again." };
  }

  if (new Date(record.expiresAt) < new Date()) {
    databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, record.$id).catch(() => {});
    return { ok: false, error: "Code expired. Request a new one." };
  }

  if (hashOtp(otp) !== record.otpHash) {
    return { ok: false, error: "Incorrect code. Please try again." };
  }

  // Mark verified in Appwrite
  try {
    await adminUsers.updateEmailVerification(userId, true);
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : "Could not mark email as verified." };
  }

  databases.deleteDocument(APPWRITE_DATABASE_ID, OTP_COLLECTION, record.$id).catch(() => {});
  return { ok: true };
}

"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ID } from "node-appwrite";
import { createAdminClient, createSessionClient } from "@/lib/appwrite/server";
import { SESSION_COOKIE } from "@/lib/appwrite/config";
import {
  loginSchema,
  signupSchema,
  type LoginInput,
  type SignupInput,
} from "@/lib/appwrite/schemas";

type ActionResult = { ok: true } | { ok: false; error: string };

const SESSION_MAX_AGE_SECONDS = 60 * 60 * 24 * 30;

async function persistSession(secret: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, secret, {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: SESSION_MAX_AGE_SECONDS,
  });
}

export async function signupAction(input: SignupInput): Promise<ActionResult> {
  const parsed = signupSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { name, email, password } = parsed.data;

  try {
    const { account } = createAdminClient();
    await account.create(ID.unique(), email, password, name);
    const session = await account.createEmailPasswordSession(email, password);
    await persistSession(session.secret);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not sign up";
    return { ok: false, error: message };
  }
}

export async function loginAction(input: LoginInput): Promise<ActionResult> {
  const parsed = loginSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const { email, password } = parsed.data;

  try {
    const { account } = createAdminClient();
    const session = await account.createEmailPasswordSession(email, password);
    await persistSession(session.secret);
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not log in";
    return { ok: false, error: message };
  }
}

export async function logoutAction() {
  try {
    const { account } = await createSessionClient();
    await account.deleteSession("current");
  } catch {
    // ignore
  }
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  redirect("/login");
}

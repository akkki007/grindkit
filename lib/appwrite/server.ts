import "server-only";

import { cookies } from "next/headers";
import { Client, Account, Databases, Users } from "node-appwrite";
import {
  APPWRITE_ENDPOINT,
  APPWRITE_PROJECT_ID,
  SESSION_COOKIE,
} from "./config";

export async function createSessionClient() {
  const cookieStore = await cookies();
  const session = cookieStore.get(SESSION_COOKIE);

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID);

  if (session?.value) {
    client.setSession(session.value);
  }

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
  };
}

export function createAdminClient() {
  const apiKey = process.env.APPWRITE_API_KEY;
  if (!apiKey) {
    throw new Error("APPWRITE_API_KEY is not set");
  }

  const client = new Client()
    .setEndpoint(APPWRITE_ENDPOINT)
    .setProject(APPWRITE_PROJECT_ID)
    .setKey(apiKey);

  return {
    client,
    account: new Account(client),
    databases: new Databases(client),
    users: new Users(client),
  };
}

export async function getCurrentUser() {
  try {
    const { account } = await createSessionClient();
    return await account.get();
  } catch {
    return null;
  }
}

#!/usr/bin/env tsx
/**
 * Additive schema migration. The seed script only creates a collection when
 * it's missing, so collections provisioned by an older seed can be missing
 * attributes added later (e.g. `timezone`, daily goals). This script ensures
 * every expected attribute exists, skipping any that already do (409).
 *
 * Safe to re-run. Non-destructive: only adds attributes, never drops them.
 *
 *   pnpm migrate
 */

import "dotenv/config";
import { Client, Databases } from "node-appwrite";

const endpoint =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "grindkit";
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY in .env.local"
  );
  process.exit(1);
}

const USERS_COLLECTION = "users";

const db = new Databases(
  new Client().setEndpoint(endpoint).setProject(projectId).setKey(apiKey)
);

function isAlreadyExists(err: unknown): boolean {
  const e = err as { code?: number; type?: string; message?: string };
  return (
    e?.code === 409 ||
    e?.type === "attribute_already_exists" ||
    /already exists/i.test(e?.message ?? "")
  );
}

async function ensure(label: string, run: () => Promise<unknown>) {
  try {
    await run();
    console.log(`+ added ${label}`);
  } catch (err) {
    if (isAlreadyExists(err)) {
      console.log(`= ${label} already present`);
      return;
    }
    throw err;
  }
}

async function main() {
  console.log(`Migrating "${USERS_COLLECTION}" attributes in db "${databaseId}"…`);

  await ensure("users.profiles", () =>
    db.createStringAttribute(databaseId, USERS_COLLECTION, "profiles", 4000, false)
  );
  await ensure("users.pushSubscription", () =>
    db.createStringAttribute(databaseId, USERS_COLLECTION, "pushSubscription", 2000, false)
  );
  await ensure("users.notificationPrefs", () =>
    db.createStringAttribute(databaseId, USERS_COLLECTION, "notificationPrefs", 1000, false)
  );
  await ensure("users.timezone", () =>
    db.createStringAttribute(databaseId, USERS_COLLECTION, "timezone", 64, false)
  );
  await ensure("users.currentStreak", () =>
    db.createIntegerAttribute(databaseId, USERS_COLLECTION, "currentStreak", false, 0, 100000)
  );
  await ensure("users.longestStreak", () =>
    db.createIntegerAttribute(databaseId, USERS_COLLECTION, "longestStreak", false, 0, 100000)
  );
  await ensure("users.dailyGoalProblems", () =>
    db.createIntegerAttribute(databaseId, USERS_COLLECTION, "dailyGoalProblems", false, 0, 1000)
  );
  await ensure("users.dailyGoalMinutes", () =>
    db.createIntegerAttribute(databaseId, USERS_COLLECTION, "dailyGoalMinutes", false, 0, 10000)
  );
  await ensure("users.emailNotifications", () =>
    db.createBooleanAttribute(databaseId, USERS_COLLECTION, "emailNotifications", false)
  );

  console.log("Done.");
}

main().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});

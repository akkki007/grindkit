#!/usr/bin/env tsx
/**
 * Seed script: creates the `patterns` and `problem_library` collections
 * if missing, then idempotently imports their rows.
 *
 * Usage:
 *   1. Fill .env.local with NEXT_PUBLIC_APPWRITE_* + APPWRITE_API_KEY.
 *   2. pnpm seed
 *
 * Safe to re-run. Existing rows (matched by slug) are updated, not duplicated.
 */

import "dotenv/config";
import { Client, DatabasesIndexType, Databases, ID, Permission, Query, Role } from "node-appwrite";
import { PATTERNS } from "../lib/data/patterns";
import { LIBRARY } from "../lib/data/library";

const endpoint = process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
const projectId = process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID;
const databaseId = process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "grindkit";
const apiKey = process.env.APPWRITE_API_KEY;

if (!projectId || !apiKey) {
  console.error(
    "Missing env. Set NEXT_PUBLIC_APPWRITE_PROJECT_ID and APPWRITE_API_KEY in .env.local"
  );
  process.exit(1);
}

const PATTERNS_COLLECTION = "patterns";
const LIBRARY_COLLECTION = "problem_library";
const PROBLEMS_COLLECTION = "problems";
const SESSIONS_COLLECTION = "sessions";
const PROJECTS_COLLECTION = "projects";
const TASKS_COLLECTION = "tasks";
const USERS_COLLECTION = "users";

const client = new Client()
  .setEndpoint(endpoint)
  .setProject(projectId)
  .setKey(apiKey);
const db = new Databases(client);

async function ensureDatabase() {
  try {
    await db.get(databaseId);
    log(`db "${databaseId}" exists`);
  } catch {
    await db.create(databaseId, "GrindKit");
    log(`db "${databaseId}" created`);
  }
}

async function ensurePatternsCollection() {
  try {
    await db.getCollection(databaseId, PATTERNS_COLLECTION);
    log(`collection "${PATTERNS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    PATTERNS_COLLECTION,
    "Patterns",
    [Permission.read(Role.users())],
    false
  );
  await db.createStringAttribute(databaseId, PATTERNS_COLLECTION, "slug", 64, true);
  await db.createStringAttribute(databaseId, PATTERNS_COLLECTION, "name", 128, true);
  await db.createIntegerAttribute(databaseId, PATTERNS_COLLECTION, "order", true, 0, 1000);
  await db.createIntegerAttribute(databaseId, PATTERNS_COLLECTION, "totalProblems", true, 0, 1000);
  await db.createStringAttribute(databaseId, PATTERNS_COLLECTION, "phase", 32, true);
  await waitForAttributes(PATTERNS_COLLECTION, ["slug", "name", "order", "totalProblems", "phase"]);
  await db.createIndex(databaseId, PATTERNS_COLLECTION, "slug_idx", DatabasesIndexType.Unique, ["slug"]);
  log(`collection "${PATTERNS_COLLECTION}" created`);
}

async function ensureLibraryCollection() {
  try {
    await db.getCollection(databaseId, LIBRARY_COLLECTION);
    log(`collection "${LIBRARY_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    LIBRARY_COLLECTION,
    "Problem Library",
    [Permission.read(Role.users())],
    false
  );
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "slug", 128, true);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "title", 256, true);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "url", 512, false);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "platform", 32, true);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "difficulty", 16, true);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "patternSlug", 64, true);
  await db.createStringAttribute(databaseId, LIBRARY_COLLECTION, "sourceLists", 32, false, undefined, true);
  await waitForAttributes(LIBRARY_COLLECTION, [
    "slug",
    "title",
    "url",
    "platform",
    "difficulty",
    "patternSlug",
    "sourceLists",
  ]);
  await db.createIndex(databaseId, LIBRARY_COLLECTION, "slug_idx", DatabasesIndexType.Unique, ["slug"]);
  await db.createIndex(databaseId, LIBRARY_COLLECTION, "pattern_idx", DatabasesIndexType.Key, ["patternSlug"]);
  await db.createIndex(databaseId, LIBRARY_COLLECTION, "difficulty_idx", DatabasesIndexType.Key, ["difficulty"]);
  log(`collection "${LIBRARY_COLLECTION}" created`);
}

async function ensureProblemsCollection() {
  try {
    await db.getCollection(databaseId, PROBLEMS_COLLECTION);
    log(`collection "${PROBLEMS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    PROBLEMS_COLLECTION,
    "Problems",
    [Permission.create(Role.users())],
    true
  );
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "userId", 64, true);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "libraryId", 128, false);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "title", 256, true);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "url", 512, false);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "platform", 32, true);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "difficulty", 16, true);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "patternId", 64, true);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "status", 16, true);
  await db.createIntegerAttribute(databaseId, PROBLEMS_COLLECTION, "confidence", false, 1, 5);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "code", 20000, false);
  await db.createStringAttribute(databaseId, PROBLEMS_COLLECTION, "notes", 20000, false);
  await db.createIntegerAttribute(databaseId, PROBLEMS_COLLECTION, "timeTakenMin", false, 0, 100000);
  await db.createDatetimeAttribute(databaseId, PROBLEMS_COLLECTION, "solvedAt", true);
  await db.createDatetimeAttribute(databaseId, PROBLEMS_COLLECTION, "nextReviewAt", false);
  await db.createIntegerAttribute(databaseId, PROBLEMS_COLLECTION, "reviewCount", false, 0, 10000);
  await db.createFloatAttribute(databaseId, PROBLEMS_COLLECTION, "easinessFactor", false, 1, 5);
  await db.createIntegerAttribute(databaseId, PROBLEMS_COLLECTION, "interval", false, 0, 10000);
  await waitForAttributes(PROBLEMS_COLLECTION, [
    "userId",
    "title",
    "platform",
    "difficulty",
    "patternId",
    "status",
    "solvedAt",
  ]);
  await db.createIndex(databaseId, PROBLEMS_COLLECTION, "user_pattern_idx", DatabasesIndexType.Key, ["userId", "patternId"]);
  await db.createIndex(databaseId, PROBLEMS_COLLECTION, "user_solved_idx", DatabasesIndexType.Key, ["userId", "solvedAt"]);
  await db.createIndex(databaseId, PROBLEMS_COLLECTION, "user_review_idx", DatabasesIndexType.Key, ["userId", "nextReviewAt"]);
  log(`collection "${PROBLEMS_COLLECTION}" created`);
}

async function ensureSessionsCollection() {
  try {
    await db.getCollection(databaseId, SESSIONS_COLLECTION);
    log(`collection "${SESSIONS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    SESSIONS_COLLECTION,
    "Sessions",
    [Permission.create(Role.users())],
    true
  );
  await db.createStringAttribute(databaseId, SESSIONS_COLLECTION, "userId", 64, true);
  await db.createStringAttribute(databaseId, SESSIONS_COLLECTION, "type", 16, true);
  await db.createIntegerAttribute(databaseId, SESSIONS_COLLECTION, "durationMin", true, 0, 1440);
  await db.createDatetimeAttribute(databaseId, SESSIONS_COLLECTION, "startedAt", true);
  await db.createDatetimeAttribute(databaseId, SESSIONS_COLLECTION, "endedAt", true);
  await db.createStringAttribute(databaseId, SESSIONS_COLLECTION, "problemId", 64, false);
  await db.createStringAttribute(databaseId, SESSIONS_COLLECTION, "projectId", 64, false);
  await db.createStringAttribute(databaseId, SESSIONS_COLLECTION, "taskId", 64, false);
  await waitForAttributes(SESSIONS_COLLECTION, [
    "userId",
    "type",
    "durationMin",
    "startedAt",
    "endedAt",
  ]);
  await db.createIndex(databaseId, SESSIONS_COLLECTION, "user_started_idx", DatabasesIndexType.Key, ["userId", "startedAt"]);
  await db.createIndex(databaseId, SESSIONS_COLLECTION, "user_type_idx", DatabasesIndexType.Key, ["userId", "type"]);
  log(`collection "${SESSIONS_COLLECTION}" created`);
}

async function ensureProjectsCollection() {
  try {
    await db.getCollection(databaseId, PROJECTS_COLLECTION);
    log(`collection "${PROJECTS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    PROJECTS_COLLECTION,
    "Projects",
    [Permission.create(Role.users())],
    true
  );
  await db.createStringAttribute(databaseId, PROJECTS_COLLECTION, "userId", 64, true);
  await db.createStringAttribute(databaseId, PROJECTS_COLLECTION, "name", 128, true);
  await db.createStringAttribute(databaseId, PROJECTS_COLLECTION, "description", 1000, false);
  await db.createStringAttribute(databaseId, PROJECTS_COLLECTION, "status", 16, true);
  await db.createStringAttribute(databaseId, PROJECTS_COLLECTION, "color", 16, false);
  await db.createDatetimeAttribute(databaseId, PROJECTS_COLLECTION, "createdAt", true);
  await waitForAttributes(PROJECTS_COLLECTION, ["userId", "name", "status", "createdAt"]);
  await db.createIndex(databaseId, PROJECTS_COLLECTION, "user_created_idx", DatabasesIndexType.Key, ["userId", "createdAt"]);
  await db.createIndex(databaseId, PROJECTS_COLLECTION, "user_status_idx", DatabasesIndexType.Key, ["userId", "status"]);
  log(`collection "${PROJECTS_COLLECTION}" created`);
}

async function ensureTasksCollection() {
  try {
    await db.getCollection(databaseId, TASKS_COLLECTION);
    log(`collection "${TASKS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    TASKS_COLLECTION,
    "Tasks",
    [Permission.create(Role.users())],
    true
  );
  await db.createStringAttribute(databaseId, TASKS_COLLECTION, "userId", 64, true);
  await db.createStringAttribute(databaseId, TASKS_COLLECTION, "projectId", 64, true);
  await db.createStringAttribute(databaseId, TASKS_COLLECTION, "title", 200, true);
  await db.createStringAttribute(databaseId, TASKS_COLLECTION, "status", 16, true);
  await db.createFloatAttribute(databaseId, TASKS_COLLECTION, "estimatedHours", false, 0, 1000);
  await db.createFloatAttribute(databaseId, TASKS_COLLECTION, "actualHours", false, 0, 1000);
  await db.createIntegerAttribute(databaseId, TASKS_COLLECTION, "order", true, 0, 1000000);
  await db.createDatetimeAttribute(databaseId, TASKS_COLLECTION, "createdAt", true);
  await db.createDatetimeAttribute(databaseId, TASKS_COLLECTION, "completedAt", false);
  await waitForAttributes(TASKS_COLLECTION, [
    "userId",
    "projectId",
    "title",
    "status",
    "order",
    "createdAt",
  ]);
  await db.createIndex(databaseId, TASKS_COLLECTION, "project_order_idx", DatabasesIndexType.Key, ["projectId", "status", "order"]);
  await db.createIndex(databaseId, TASKS_COLLECTION, "user_tasks_idx", DatabasesIndexType.Key, ["userId", "projectId"]);
  log(`collection "${TASKS_COLLECTION}" created`);
}

async function ensureUsersCollection() {
  try {
    await db.getCollection(databaseId, USERS_COLLECTION);
    log(`collection "${USERS_COLLECTION}" exists`);
    return;
  } catch {
    // create below
  }

  await db.createCollection(
    databaseId,
    USERS_COLLECTION,
    "Users",
    [Permission.create(Role.users())],
    true
  );
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "userId", 64, true);
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "name", 128, false);
  // profiles: JSON blob storing { leetcode, codeforces, codechef, neetcode, gfg, github, hashnode, linkedin }
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "profiles", 4000, false);
  // pushSubscription: JSON blob of the browser's PushSubscription
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "pushSubscription", 2000, false);
  // notificationPrefs: JSON blob of per-type booleans
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "notificationPrefs", 1000, false);
  // timezone IANA string for scheduled notifications
  await db.createStringAttribute(databaseId, USERS_COLLECTION, "timezone", 64, false);
  await db.createIntegerAttribute(databaseId, USERS_COLLECTION, "currentStreak", false, 0, 100000);
  await db.createIntegerAttribute(databaseId, USERS_COLLECTION, "longestStreak", false, 0, 100000);
  await db.createIntegerAttribute(databaseId, USERS_COLLECTION, "dailyGoalProblems", false, 0, 1000);
  await db.createIntegerAttribute(databaseId, USERS_COLLECTION, "dailyGoalMinutes", false, 0, 10000);
  await db.createDatetimeAttribute(databaseId, USERS_COLLECTION, "joinedAt", true);
  await waitForAttributes(USERS_COLLECTION, ["userId", "joinedAt"]);
  await db.createIndex(databaseId, USERS_COLLECTION, "userId_idx", DatabasesIndexType.Unique, ["userId"]);
  log(`collection "${USERS_COLLECTION}" created`);
}

async function waitForAttributes(collectionId: string, keys: string[]) {
  for (let attempt = 0; attempt < 30; attempt++) {
    const res = await db.listAttributes(databaseId, collectionId);
    const available = new Set(
      res.attributes
        .filter((a) => "status" in a && a.status === "available")
        .map((a) => ("key" in a ? (a.key as string) : ""))
    );
    if (keys.every((k) => available.has(k))) return;
    await sleep(1000);
  }
  throw new Error(`Attributes not ready on ${collectionId}`);
}

async function seedPatterns() {
  let created = 0;
  let updated = 0;
  for (const p of PATTERNS) {
    const existing = await db.listDocuments(databaseId, PATTERNS_COLLECTION, [
      Query.equal("slug", p.slug),
      Query.limit(1),
    ]);
    if (existing.total === 0) {
      await db.createDocument(databaseId, PATTERNS_COLLECTION, ID.unique(), {
        slug: p.slug,
        name: p.name,
        order: p.order,
        totalProblems: p.totalProblems,
        phase: p.phase,
      });
      created++;
    } else {
      await db.updateDocument(
        databaseId,
        PATTERNS_COLLECTION,
        existing.documents[0].$id,
        {
          name: p.name,
          order: p.order,
          totalProblems: p.totalProblems,
          phase: p.phase,
        }
      );
      updated++;
    }
  }
  log(`patterns: ${created} created, ${updated} updated`);
}

async function seedLibrary() {
  let created = 0;
  let updated = 0;
  for (const p of LIBRARY) {
    const existing = await db.listDocuments(databaseId, LIBRARY_COLLECTION, [
      Query.equal("slug", p.slug),
      Query.limit(1),
    ]);
    const payload = {
      slug: p.slug,
      title: p.title,
      url: p.url,
      platform: p.platform,
      difficulty: p.difficulty,
      patternSlug: p.patternSlug,
      sourceLists: [...p.sourceLists],
    };
    if (existing.total === 0) {
      await db.createDocument(
        databaseId,
        LIBRARY_COLLECTION,
        ID.unique(),
        payload
      );
      created++;
    } else {
      await db.updateDocument(
        databaseId,
        LIBRARY_COLLECTION,
        existing.documents[0].$id,
        payload
      );
      updated++;
    }
  }
  log(`library: ${created} created, ${updated} updated`);
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function log(msg: string) {
  console.log(`[seed] ${msg}`);
}

(async () => {
  try {
    await ensureDatabase();
    await ensurePatternsCollection();
    await ensureLibraryCollection();
    await ensureProblemsCollection();
    await ensureSessionsCollection();
    await ensureProjectsCollection();
    await ensureTasksCollection();
    await ensureUsersCollection();
    await seedPatterns();
    await seedLibrary();
    log("done.");
  } catch (err) {
    console.error("[seed] failed:", err);
    process.exit(1);
  }
})();

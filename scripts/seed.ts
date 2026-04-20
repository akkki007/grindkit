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
    await seedPatterns();
    await seedLibrary();
    log("done.");
  } catch (err) {
    console.error("[seed] failed:", err);
    process.exit(1);
  }
})();

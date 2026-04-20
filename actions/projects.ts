"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { ID, Permission, Query, Role } from "node-appwrite";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { projectStatusEnum } from "@/lib/appwrite/schemas";

const projectInputSchema = z.object({
  name: z.string().min(1).max(128),
  description: z.string().max(1000).optional().default(""),
  color: z.string().max(16).optional().default(""),
  status: projectStatusEnum.default("active"),
});

export type ProjectInput = z.infer<typeof projectInputSchema>;

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createProjectAction(
  input: ProjectInput
): Promise<ActionResult> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      ID.unique(),
      {
        userId: me.$id,
        name: data.name,
        description: data.description,
        color: data.color,
        status: data.status,
        createdAt: new Date().toISOString(),
      },
      [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
        Permission.delete(Role.user(me.$id)),
      ]
    );

    revalidatePath("/app/projects");
    return { ok: true, id: doc.$id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create project";
    return { ok: false, error: message };
  }
}

export async function updateProjectAction(
  id: string,
  input: ProjectInput
): Promise<ActionResult> {
  const parsed = projectInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      id
    );
    if ((existing as unknown as { userId: string }).userId !== me.$id) {
      return { ok: false, error: "Not found" };
    }
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      id,
      {
        name: data.name,
        description: data.description,
        color: data.color,
        status: data.status,
      }
    );
    revalidatePath("/app/projects");
    revalidatePath(`/app/projects/${id}`);
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update project";
    return { ok: false, error: message };
  }
}

export async function deleteProjectAction(id: string) {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.projects,
      id
    );
    if ((existing as unknown as { userId: string }).userId !== me.$id) {
      redirect("/app/projects");
    }
    // Scope task cleanup to this user + project
    try {
      const tasks = await databases.listDocuments(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.tasks,
        [
          Query.equal("userId", me.$id),
          Query.equal("projectId", id),
          Query.limit(1000),
        ]
      );
      await Promise.all(
        tasks.documents.map((t) =>
          databases.deleteDocument(
            APPWRITE_DATABASE_ID,
            COLLECTIONS.tasks,
            t.$id
          )
        )
      );
    } catch {
      // ignore
    }
    await databases.deleteDocument(APPWRITE_DATABASE_ID, COLLECTIONS.projects, id);
  } catch {
    // ignore
  }
  revalidatePath("/app/projects");
  redirect("/app/projects");
}

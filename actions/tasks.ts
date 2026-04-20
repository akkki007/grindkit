"use server";

import { revalidatePath } from "next/cache";
import { ID, Permission, Query, Role } from "node-appwrite";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { taskStatusEnum } from "@/lib/appwrite/schemas";

const taskInputSchema = z.object({
  projectId: z.string().min(1),
  title: z.string().min(1).max(200),
  status: taskStatusEnum.default("backlog"),
  estimatedHours: z.coerce.number().min(0).max(1000).optional(),
});

export type TaskInput = z.infer<typeof taskInputSchema>;

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function createTaskAction(
  input: TaskInput
): Promise<ActionResult> {
  const parsed = taskInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();

    const existing = await databases.listDocuments(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      [
        Query.equal("projectId", data.projectId),
        Query.equal("status", data.status),
        Query.orderDesc("order"),
        Query.limit(1),
      ]
    );
    const nextOrder =
      existing.total > 0
        ? ((existing.documents[0] as { order?: number }).order ?? 0) + 1
        : 0;

    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      ID.unique(),
      {
        userId: me.$id,
        projectId: data.projectId,
        title: data.title,
        status: data.status,
        estimatedHours: data.estimatedHours ?? null,
        actualHours: 0,
        order: nextOrder,
        createdAt: new Date().toISOString(),
        completedAt: data.status === "done" ? new Date().toISOString() : null,
      },
      [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
        Permission.delete(Role.user(me.$id)),
      ]
    );

    revalidatePath(`/app/projects/${data.projectId}`);
    revalidatePath("/app/projects");
    return { ok: true, id: doc.$id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not create task";
    return { ok: false, error: message };
  }
}

const moveSchema = z.object({
  taskId: z.string().min(1),
  toStatus: taskStatusEnum,
  toOrder: z.coerce.number().int().min(0),
  projectId: z.string().min(1),
});

export async function moveTaskAction(
  input: z.infer<typeof moveSchema>
): Promise<ActionResult> {
  const parsed = moveSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "Invalid move" };
  }
  const { taskId, toStatus, toOrder, projectId } = parsed.data;

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      taskId
    );
    if ((existing as unknown as { userId: string }).userId !== me.$id) {
      return { ok: false, error: "Not found" };
    }
    const payload: Record<string, unknown> = {
      status: toStatus,
      order: toOrder,
    };
    if (toStatus === "done") payload.completedAt = new Date().toISOString();
    else payload.completedAt = null;

    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      taskId,
      payload
    );

    revalidatePath(`/app/projects/${projectId}`);
    return { ok: true, id: taskId };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not move task";
    return { ok: false, error: message };
  }
}

export async function updateTaskAction(
  id: string,
  projectId: string,
  updates: Partial<{ title: string; estimatedHours: number | null }>
): Promise<ActionResult> {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      id
    );
    if ((existing as unknown as { userId: string }).userId !== me.$id) {
      return { ok: false, error: "Not found" };
    }
    const payload: Record<string, unknown> = {};
    if (typeof updates.title === "string") payload.title = updates.title;
    if (updates.estimatedHours !== undefined)
      payload.estimatedHours = updates.estimatedHours;
    await databases.updateDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      id,
      payload
    );
    revalidatePath(`/app/projects/${projectId}`);
    return { ok: true, id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not update task";
    return { ok: false, error: message };
  }
}

export async function deleteTaskAction(id: string, projectId: string) {
  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();
    const existing = await databases.getDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.tasks,
      id
    );
    if ((existing as unknown as { userId: string }).userId === me.$id) {
      await databases.deleteDocument(
        APPWRITE_DATABASE_ID,
        COLLECTIONS.tasks,
        id
      );
    }
  } catch {
    // ignore
  }
  revalidatePath(`/app/projects/${projectId}`);
}

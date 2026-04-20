"use server";

import { revalidatePath } from "next/cache";
import { ID, Permission, Role } from "node-appwrite";
import { z } from "zod";
import { createSessionClient } from "@/lib/appwrite/server";
import { APPWRITE_DATABASE_ID, COLLECTIONS } from "@/lib/appwrite/config";
import { sessionTypeEnum } from "@/lib/appwrite/schemas";

const sessionInputSchema = z.object({
  type: sessionTypeEnum,
  durationMin: z.coerce.number().int().min(0).max(24 * 60),
  startedAt: z.string().min(10),
  endedAt: z.string().min(10),
  problemId: z.string().optional().nullable(),
  projectId: z.string().optional().nullable(),
  taskId: z.string().optional().nullable(),
});

export type SessionInput = z.infer<typeof sessionInputSchema>;

type ActionResult = { ok: true; id: string } | { ok: false; error: string };

export async function logSessionAction(
  input: SessionInput
): Promise<ActionResult> {
  const parsed = sessionInputSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;

  if (data.durationMin <= 0) {
    return { ok: false, error: "Nothing to log — zero duration." };
  }

  try {
    const { account, databases } = await createSessionClient();
    const me = await account.get();

    const doc = await databases.createDocument(
      APPWRITE_DATABASE_ID,
      COLLECTIONS.sessions,
      ID.unique(),
      {
        userId: me.$id,
        type: data.type,
        durationMin: data.durationMin,
        startedAt: data.startedAt,
        endedAt: data.endedAt,
        problemId: data.problemId ?? null,
        projectId: data.projectId ?? null,
        taskId: data.taskId ?? null,
      },
      [
        Permission.read(Role.user(me.$id)),
        Permission.update(Role.user(me.$id)),
        Permission.delete(Role.user(me.$id)),
      ]
    );

    if (data.problemId) {
      try {
        const problem = await databases.getDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.problems,
          data.problemId
        );
        const prev = (problem as unknown as { timeTakenMin?: number }).timeTakenMin ?? 0;
        await databases.updateDocument(
          APPWRITE_DATABASE_ID,
          COLLECTIONS.problems,
          data.problemId,
          { timeTakenMin: prev + data.durationMin }
        );
      } catch {
        // ignore — best-effort
      }
    }

    revalidatePath("/app");
    revalidatePath("/app/analytics");
    return { ok: true, id: doc.$id };
  } catch (err) {
    const message = err instanceof Error ? err.message : "Could not log session";
    return { ok: false, error: message };
  }
}

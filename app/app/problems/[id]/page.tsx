import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ProblemForm } from "@/components/problems/problem-form";
import { LinkTimerButton } from "@/components/timer/link-timer-button";
import { getCurrentUser } from "@/lib/appwrite/server";
import { getUserProblem } from "@/lib/appwrite/queries";
import type { ProblemInput } from "@/actions/problems";
import type { Difficulty, Platform } from "@/lib/data/library";

export default async function EditProblemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();
  const doc = await getUserProblem(user.$id, id);
  if (!doc) notFound();

  const initial: ProblemInput = {
    libraryId: doc.libraryId ?? null,
    title: doc.title,
    url: doc.url ?? "",
    platform: (doc.platform as Platform) ?? "leetcode",
    difficulty: (doc.difficulty as Difficulty) ?? "medium",
    patternId: doc.patternId,
    status: (doc.status as "solved" | "attempted" | "revisiting") ?? "solved",
    confidence: doc.confidence ?? 3,
    code: doc.code ?? "",
    notes: doc.notes ?? "",
    timeTakenMin: doc.timeTakenMin ?? 0,
  };

  return (
    <section className="px-6 py-4 space-y-6">
      <div>
        <Link
          href={`/app/patterns/${doc.patternId}`}
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Back
        </Link>
      </div>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Edit problem
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{doc.title}</h1>
        </div>
        <LinkTimerButton problemId={id} />
      </div>

      <ProblemForm mode="edit" problemId={id} initial={initial} />
    </section>
  );
}

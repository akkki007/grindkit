import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { ProblemForm } from "@/components/problems/problem-form";
import { libraryBySlug } from "@/lib/data/library";
import { patternBySlug } from "@/lib/data/patterns";
import type { ProblemInput } from "@/actions/problems";

export default async function NewProblemPage({
  searchParams,
}: {
  searchParams: Promise<{ library?: string; pattern?: string }>;
}) {
  const { library, pattern } = await searchParams;
  const lib = library ? libraryBySlug(library) : undefined;
  const patternFromQuery = pattern ? patternBySlug(pattern) : undefined;

  const initial: ProblemInput = {
    libraryId: lib?.slug ?? null,
    title: lib?.title ?? "",
    url: lib?.url ?? "",
    platform: lib?.platform ?? "leetcode",
    difficulty: lib?.difficulty ?? "medium",
    patternId: lib?.patternSlug ?? patternFromQuery?.slug ?? "arrays-hashing",
    status: "solved",
    confidence: 4,
    code: "",
    notes: "",
    timeTakenMin: 0,
  };

  return (
    <section className="px-6 py-4 space-y-6">
      <div>
        <Link
          href="/app/patterns"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Patterns
        </Link>
      </div>

      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {lib ? "Logging from library" : "Custom problem"}
        </p>
        <h1 className="text-2xl font-bold tracking-tight">
          {lib ? lib.title : "Log a problem"}
        </h1>
      </div>

      <ProblemForm
        mode="create"
        initial={initial}
        locked={
          lib
            ? { title: true, url: true, platform: true, difficulty: true, patternId: true }
            : undefined
        }
      />
    </section>
  );
}

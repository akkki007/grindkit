import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ExternalLink, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  libraryByPattern,
  DIFFICULTY_META,
  PLATFORM_META,
  SOURCE_LIST_META,
} from "@/lib/data/library";
import { patternBySlug, PHASE_META } from "@/lib/data/patterns";
import { listUserProblemsByPattern } from "@/lib/appwrite/queries";
import { getCurrentUser } from "@/lib/appwrite/server";

export default async function PatternDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const pattern = patternBySlug(slug);
  if (!pattern) notFound();

  const user = await getCurrentUser();
  const libraryProblems = libraryByPattern(slug);
  const userProblems = user ? await listUserProblemsByPattern(user.$id, slug) : [];
  const solvedSlugs = new Set(
    userProblems
      .filter((p) => p.status === "solved")
      .map((p) => (p.libraryId ? libraryProblems.find((lib) => lib.slug === p.libraryId)?.slug : null))
      .filter(Boolean) as string[]
  );

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

      <div className="flex items-start justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {PHASE_META[pattern.phase].label} · Pattern{" "}
            {pattern.order.toString().padStart(2, "0")}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{pattern.name}</h1>
          <p className="font-mono text-xs text-muted-foreground tabular-nums">
            {userProblems.filter((p) => p.status === "solved").length}/
            {pattern.totalProblems} solved
          </p>
        </div>
        <Button asChild size="sm">
          <Link href={`/app/problems/new?pattern=${pattern.slug}`}>
            <Plus className="size-4" />
            Log problem
          </Link>
        </Button>
      </div>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
            Library ({libraryProblems.length})
          </h2>
        </div>
        <ul className="divide-y divide-border/50 rounded-lg border border-border/50 bg-card/30">
          {libraryProblems.map((problem) => {
            const isSolved = solvedSlugs.has(problem.slug);
            return (
              <li
                key={problem.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center gap-2">
                    {isSolved ? (
                      <span
                        className="inline-block size-1.5 shrink-0 rounded-full bg-foreground"
                        aria-label="solved"
                      />
                    ) : (
                      <span className="inline-block size-1.5 shrink-0 rounded-full border border-border" />
                    )}
                    <h3 className="truncate font-display text-[15px] font-semibold tracking-tight">
                      {problem.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="difficulty">
                      {DIFFICULTY_META[problem.difficulty].label}
                    </Badge>
                    <Badge variant="outline">
                      {PLATFORM_META[problem.platform].label}
                    </Badge>
                    {problem.sourceLists.map((src) => (
                      <Badge key={src} variant="secondary">
                        {SOURCE_LIST_META[src].short}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={problem.url}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-md border border-input bg-background/50 px-2 py-1 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
                  >
                    Open
                    <ExternalLink className="size-3" />
                  </a>
                  <Button asChild size="sm" variant="outline">
                    <Link
                      href={`/app/problems/new?library=${problem.slug}`}
                    >
                      Log
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

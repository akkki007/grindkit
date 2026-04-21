import Link from "next/link";
import { PATTERNS, PHASE_META, type Phase } from "@/lib/data/patterns";
import { countSolvedPerPattern } from "@/lib/appwrite/queries";
import { getCurrentUser } from "@/lib/appwrite/server";
import { cn } from "@/lib/utils";

export default async function PatternsPage() {
  const user = await getCurrentUser();
  const solvedCounts = user ? await countSolvedPerPattern(user.$id) : {};

  const phases: Phase[] = ["foundation", "core", "advanced"];

  const totalSolved = Object.values(solvedCounts).reduce((a, b) => a + b, 0);

  return (
    <section className="px-6 py-4 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            NeetCode 150 · 18 patterns
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Patterns</h1>
        </div>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {totalSolved}/150 solved
        </p>
      </div>

      <div className="space-y-10">
        {phases.map((phase) => {
          const patterns = PATTERNS.filter((p) => p.phase === phase);
          const meta = PHASE_META[phase];
          const phaseSolved = patterns.reduce(
            (acc, p) => acc + (solvedCounts[p.slug] ?? 0),
            0
          );
          return (
            <div key={phase} className="space-y-4">
              <div className="flex items-center justify-between border-b border-border/20 pb-2">
                <div className="flex items-baseline gap-3">
                  <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    Phase {meta.order.toString().padStart(2, "0")}
                  </span>
                  <h2 className="text-lg font-semibold tracking-tight">
                    {meta.label}
                  </h2>
                </div>
                <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                  {phaseSolved}/{meta.total}
                </span>
              </div>

              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {patterns.map((pattern) => {
                  const solved = solvedCounts[pattern.slug] ?? 0;
                  const pct =
                    pattern.totalProblems > 0
                      ? Math.min(100, Math.round((solved / pattern.totalProblems) * 100))
                      : 0;
                  return (
                    <li key={pattern.slug}>
                      <Link
                        href={`/app/patterns/${pattern.slug}`}
                        className={cn(
                          "group flex h-full flex-col justify-between overflow-hidden rounded-lg border border-border/50 bg-card/50 p-4 text-card-foreground shadow-sm",
                          "transition-all duration-300 hover:shadow-md hover:border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                            {pattern.order.toString().padStart(2, "0")}
                          </span>
                          <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
                            {solved}/{pattern.totalProblems}
                          </span>
                        </div>
                        <h3 className="mt-2 font-display text-base font-semibold tracking-tight">
                          {pattern.name}
                        </h3>
                        <div className="mt-4 h-1 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-foreground transition-all"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}

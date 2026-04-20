import { getCurrentUser } from "@/lib/appwrite/server";
import { listDueReviews } from "@/lib/appwrite/queries";
import { ReviseQueue, type ReviseCard } from "@/components/revise/revise-queue";

export default async function RevisePage() {
  const user = await getCurrentUser();
  const dueDocs = user ? await listDueReviews(user.$id, 30) : [];

  const cards: ReviseCard[] = dueDocs.map((d) => ({
    id: d.$id,
    title: d.title,
    url: d.url ?? null,
    platform: d.platform,
    difficulty: d.difficulty,
    patternId: d.patternId,
    notes: d.notes ?? null,
    nextReviewAt: d.nextReviewAt ?? null,
    reviewCount: d.reviewCount ?? 0,
    interval: d.interval ?? null,
  }));

  return (
    <section className="px-6 py-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Spaced repetition · SM-2
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Revise</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Grade how well you recall each problem. Confidence drives the next interval.
          </p>
        </div>
        <span className="font-mono text-xs text-muted-foreground tabular-nums">
          {cards.length} due
        </span>
      </div>

      <ReviseQueue cards={cards} />
    </section>
  );
}

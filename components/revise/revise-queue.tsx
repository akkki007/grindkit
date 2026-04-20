"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ExternalLink, ArrowRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { reviewProblemAction } from "@/actions/problems";
import { patternBySlug } from "@/lib/data/patterns";
import { cn } from "@/lib/utils";

export type ReviseCard = {
  id: string;
  title: string;
  url?: string | null;
  platform: string;
  difficulty: string;
  patternId: string;
  notes?: string | null;
  nextReviewAt?: string | null;
  reviewCount?: number | null;
  interval?: number | null;
};

export function ReviseQueue({ cards }: { cards: ReviseCard[] }) {
  const [index, setIndex] = useState(0);
  const [feedback, setFeedback] = useState<null | { text: string; tone: "good" | "bad" | "mid" }>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  if (cards.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-card/30 p-8 text-center space-y-3">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Nothing due today
        </h2>
        <p className="font-mono text-sm text-muted-foreground">
          Log more problems and they&apos;ll surface here as they age.
        </p>
        <Link
          href="/app/library"
          className="inline-flex h-9 items-center rounded-md bg-foreground px-3 font-mono text-xs text-background transition-opacity hover:opacity-90"
        >
          Browse library
        </Link>
      </div>
    );
  }

  const card = cards[index];
  const total = cards.length;

  function submit(confidence: 1 | 2 | 3 | 4 | 5) {
    if (!card) return;
    setError(null);
    const tone: "good" | "bad" | "mid" =
      confidence >= 4 ? "good" : confidence === 3 ? "mid" : "bad";
    startTransition(async () => {
      const res = await reviewProblemAction(card.id, confidence);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      const nextDate = new Date(res.nextReviewAt);
      const days = res.interval;
      setFeedback({
        tone,
        text: `Next in ${days}d · ${nextDate.toLocaleDateString(undefined, { month: "short", day: "numeric" })}`,
      });
      setTimeout(() => {
        setFeedback(null);
        if (index + 1 >= cards.length) {
          router.refresh();
        } else {
          setIndex((i) => i + 1);
        }
      }, 900);
    });
  }

  if (!card) {
    return (
      <div className="rounded-lg border border-dashed border-border/50 bg-card/30 p-8 text-center">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          Queue cleared
        </h2>
        <p className="mt-2 font-mono text-sm text-muted-foreground">
          Nicely done. Refresh to pull any new additions.
        </p>
      </div>
    );
  }

  const pattern = patternBySlug(card.patternId);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        <span>
          Card {index + 1} / {total}
        </span>
        <span>Confidence grades the SM-2 schedule</span>
      </div>

      <article
        className={cn(
          "relative overflow-hidden rounded-lg border border-border/50 bg-card p-6 shadow-sm transition-all",
          feedback?.tone === "good" && "ring-1 ring-foreground",
          feedback?.tone === "bad" && "ring-1 ring-destructive"
        )}
      >
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-1.5">
            <Badge variant="difficulty">{card.difficulty}</Badge>
            {pattern ? <Badge variant="outline">{pattern.name}</Badge> : null}
            {typeof card.reviewCount === "number" ? (
              <Badge variant="secondary">
                review #{card.reviewCount + 1}
              </Badge>
            ) : null}
          </div>
          <h2 className="font-display text-2xl font-semibold tracking-tight">
            {card.title}
          </h2>
          {card.url ? (
            <a
              href={card.url}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground transition-colors hover:text-foreground"
            >
              Open problem
              <ExternalLink className="size-3" />
            </a>
          ) : null}
          {card.notes ? (
            <details className="rounded-md border border-border/30 bg-muted/30 p-3 font-mono text-xs leading-relaxed">
              <summary className="cursor-pointer text-muted-foreground">
                Your notes
              </summary>
              <pre className="mt-2 whitespace-pre-wrap text-foreground">
                {card.notes}
              </pre>
            </details>
          ) : null}
        </div>

        {feedback ? (
          <p className="mt-5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            {feedback.text}
            <ArrowRight className="size-3" />
          </p>
        ) : null}
      </article>

      <div className="grid grid-cols-3 gap-2">
        <GradeButton
          label="Forgot"
          hint="reset to 1d"
          onClick={() => submit(1)}
          disabled={isPending}
          variant="bad"
        />
        <GradeButton
          label="Hard"
          hint="×1.2"
          onClick={() => submit(3)}
          disabled={isPending}
          variant="mid"
        />
        <GradeButton
          label="Good"
          hint="×EF"
          onClick={() => submit(4)}
          disabled={isPending}
          variant="good"
        />
      </div>

      <div className="flex justify-between">
        <Link
          href={`/app/problems/${card.id}`}
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
        >
          Edit problem
        </Link>
        <button
          type="button"
          onClick={() => {
            setFeedback(null);
            if (index + 1 < cards.length) setIndex((i) => i + 1);
          }}
          disabled={isPending || index + 1 >= cards.length}
          className="font-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground disabled:opacity-40"
        >
          Skip →
        </button>
      </div>

      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

function GradeButton({
  label,
  hint,
  onClick,
  disabled,
  variant,
}: {
  label: string;
  hint: string;
  onClick: () => void;
  disabled?: boolean;
  variant: "good" | "mid" | "bad";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "flex flex-col items-center gap-0.5 rounded-md border px-3 py-3 font-mono text-xs transition-colors disabled:opacity-50",
        variant === "good"
          ? "border-foreground bg-foreground text-background hover:opacity-90"
          : variant === "mid"
            ? "border-border/60 bg-muted/50 text-foreground hover:bg-muted"
            : "border-destructive/40 bg-destructive/10 text-foreground hover:bg-destructive/20"
      )}
    >
      <span className="font-semibold">{label}</span>
      <span className="text-[10px] opacity-70">{hint}</span>
    </button>
  );
}

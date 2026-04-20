import Link from "next/link";
import { ArrowRight, Flame, Timer as TimerIcon, BookOpen, Sparkles } from "lucide-react";
import { getCurrentUser } from "@/lib/appwrite/server";
import {
  buildDailyActivity,
  countSolvedPerPattern,
  listDueReviews,
} from "@/lib/appwrite/queries";
import {
  computeStreak,
  toDayKey,
  emptyDay,
} from "@/lib/streak/calculator";
import { PATTERNS, PHASE_META } from "@/lib/data/patterns";
import { formatMinutes } from "@/lib/time/format";

export default async function DashboardPage() {
  const user = await getCurrentUser();
  const firstName = user?.name?.split(" ")[0] ?? "friend";

  const now = new Date();
  const [days, solvedPerPattern, due] = user
    ? await Promise.all([
        buildDailyActivity(user.$id, 90, now),
        countSolvedPerPattern(user.$id),
        listDueReviews(user.$id, 20, now),
      ])
    : [new Map(), {} as Record<string, number>, []];

  const streak = computeStreak(days, now);
  const todayKey = toDayKey(now);
  const today = days.get(todayKey) ?? emptyDay(todayKey);
  const totalSolved = Object.values(solvedPerPattern).reduce((a, b) => a + b, 0);

  const nextPattern = PATTERNS.find((p) => {
    const solved = solvedPerPattern[p.slug] ?? 0;
    return solved < p.totalProblems;
  }) ?? PATTERNS[0];
  const nextSolved = solvedPerPattern[nextPattern.slug] ?? 0;

  return (
    <section className="px-6 py-4 space-y-8">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Today · {now.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" })}
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hey {firstName} — {streak.activeToday ? "streak's alive." : "your move."}
        </h1>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Streak"
          value={streak.current.toString()}
          hint={streak.current === 1 ? "day" : "days"}
          icon={<Flame className="size-3.5" />}
          accent={streak.current > 0}
        />
        <StatCard
          label="Longest"
          value={streak.longest.toString()}
          hint="days"
        />
        <StatCard
          label="DSA today"
          value={today.dsaMinutes.toString()}
          hint="min"
          icon={<TimerIcon className="size-3.5" />}
        />
        <StatCard
          label="Solved"
          value={`${totalSolved}`}
          hint="/150"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <TodayCard today={today} />
        <DueCard count={due.length} />
      </div>

      <NextPatternCard
        nextPattern={{
          slug: nextPattern.slug,
          name: nextPattern.name,
          phaseLabel: PHASE_META[nextPattern.phase].label,
          totalProblems: nextPattern.totalProblems,
          solved: nextSolved,
        }}
      />

      {!streak.activeToday ? (
        <div className="plus-grid p-5">
          <div className="plus-grid-inner" aria-hidden />
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="font-display text-lg font-semibold tracking-tight">
                Keep it alive today
              </h2>
              <p className="font-mono text-xs text-muted-foreground">
                Log a problem or put in 25+ DSA minutes to bank today.
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                href="/app/library"
                className="inline-flex h-9 items-center rounded-md border border-input bg-background px-3 font-mono text-xs transition-colors hover:bg-accent hover:text-accent-foreground"
              >
                Log problem
              </Link>
              <Link
                href="/app/timer"
                className="inline-flex h-9 items-center rounded-md bg-foreground px-3 font-mono text-xs text-background transition-opacity hover:opacity-90"
              >
                Start timer
              </Link>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
  icon,
  accent,
}: {
  label: string;
  value: string;
  hint: string;
  icon?: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm">
      <div className="flex items-center justify-between">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          {label}
        </p>
        {icon ? <span className="text-muted-foreground">{icon}</span> : null}
      </div>
      <p
        className={
          accent
            ? "mt-2 font-display text-3xl font-bold tracking-tight tabular-nums"
            : "mt-2 font-display text-3xl font-bold tracking-tight tabular-nums text-foreground"
        }
      >
        {value}
      </p>
      <p className="font-mono text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

function TodayCard({
  today,
}: {
  today: { dsaMinutes: number; devMinutes: number; learningMinutes: number; problemsSolved: number };
}) {
  const total = today.dsaMinutes + today.devMinutes + today.learningMinutes;
  const bar = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold tracking-tight">
          Today&apos;s split
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {formatMinutes(total)} · {today.problemsSolved} solved
        </span>
      </div>

      {total === 0 ? (
        <p className="font-mono text-xs text-muted-foreground">
          No activity logged yet today.
        </p>
      ) : (
        <div className="flex h-2 overflow-hidden rounded-full bg-muted">
          <div className="h-full bg-foreground" style={{ width: `${bar(today.dsaMinutes)}%` }} />
          <div className="h-full bg-foreground/50" style={{ width: `${bar(today.devMinutes)}%` }} />
          <div className="h-full bg-foreground/25" style={{ width: `${bar(today.learningMinutes)}%` }} />
        </div>
      )}

      <ul className="grid grid-cols-3 gap-2 font-mono text-[11px]">
        <Legend label="DSA" minutes={today.dsaMinutes} swatch="bg-foreground" />
        <Legend label="Dev" minutes={today.devMinutes} swatch="bg-foreground/50" />
        <Legend label="Learn" minutes={today.learningMinutes} swatch="bg-foreground/25" />
      </ul>
    </div>
  );
}

function Legend({
  label,
  minutes,
  swatch,
}: {
  label: string;
  minutes: number;
  swatch: string;
}) {
  return (
    <li className="flex items-center gap-1.5">
      <span className={`inline-block size-2 rounded-sm ${swatch}`} />
      <span className="text-muted-foreground">{label}</span>
      <span className="tabular-nums">{minutes}m</span>
    </li>
  );
}

function DueCard({ count }: { count: number }) {
  return (
    <Link
      href="/app/revise"
      className="group flex flex-col justify-between rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-display text-base font-semibold tracking-tight">
          Due for review
        </h3>
        <BookOpen className="size-4 text-muted-foreground" />
      </div>
      <div className="mt-4 flex items-baseline gap-2">
        <span className="font-display text-4xl font-bold tracking-tight tabular-nums">
          {count}
        </span>
        <span className="font-mono text-xs text-muted-foreground">
          {count === 1 ? "problem" : "problems"}
        </span>
      </div>
      <p className="mt-3 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors group-hover:text-foreground">
        Open revise queue
        <ArrowRight className="size-3 transition-transform group-hover:translate-x-0.5" />
      </p>
    </Link>
  );
}

function NextPatternCard({
  nextPattern,
}: {
  nextPattern: {
    slug: string;
    name: string;
    phaseLabel: string;
    totalProblems: number;
    solved: number;
  };
}) {
  const pct = nextPattern.totalProblems
    ? Math.round((nextPattern.solved / nextPattern.totalProblems) * 100)
    : 0;
  return (
    <Link
      href={`/app/patterns/${nextPattern.slug}`}
      className="group flex items-center justify-between rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border"
    >
      <div className="space-y-1">
        <p className="flex items-center gap-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          <Sparkles className="size-3" />
          Next up · {nextPattern.phaseLabel}
        </p>
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {nextPattern.name}
        </h3>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {nextPattern.solved}/{nextPattern.totalProblems} · {pct}%
        </p>
      </div>
      <ArrowRight className="size-5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
    </Link>
  );
}

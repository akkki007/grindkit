import Link from "next/link";
import { AlertTriangle } from "lucide-react";
import { ActivityHeatmap, type HeatmapDay } from "@/components/analytics/activity-heatmap";
import { WeeklyHoursChart, type WeeklyRow } from "@/components/analytics/weekly-hours-chart";
import {
  PatternDistributionChart,
  type PatternRow,
} from "@/components/analytics/pattern-distribution-chart";
import { getCurrentUser } from "@/lib/appwrite/server";
import {
  buildDailyActivity,
  countSolvedPerPattern,
  analyzeWeakPatterns,
} from "@/lib/appwrite/queries";
import { toDayKey } from "@/lib/streak/calculator";
import { PATTERNS, patternBySlug } from "@/lib/data/patterns";
import { formatMinutes } from "@/lib/time/format";

const HEATMAP_DAYS = 84; // 12 weeks
const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export default async function AnalyticsPage() {
  const user = await getCurrentUser();
  const now = new Date();

  const [days, solvedPerPattern, weak] = user
    ? await Promise.all([
        buildDailyActivity(user.$id, HEATMAP_DAYS, now),
        countSolvedPerPattern(user.$id),
        analyzeWeakPatterns(user.$id, 10),
      ])
    : [
        new Map(),
        {} as Record<string, number>,
        [] as Array<{ patternId: string; avgConfidence: number; n: number }>,
      ];

  const heatmap = buildHeatmap(days, HEATMAP_DAYS, now);
  const weekly = buildWeekly(days, now);
  const distribution: PatternRow[] = PATTERNS.map((p) => ({
    pattern: p.name,
    solved: solvedPerPattern[p.slug] ?? 0,
    total: p.totalProblems,
  }));

  const weekTotalMin = weekly.reduce(
    (a, b) => a + b.dsa + b.dev + b.learning,
    0
  );
  const monthTotalMin = heatmap.reduce((a, b) => a + b.count, 0);

  return (
    <section className="px-6 py-4 space-y-10">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          12-week view
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Analytics</h1>
        <p className="font-mono text-sm text-muted-foreground">
          Activity, pattern coverage, weekly split. No vanity numbers.
        </p>
      </div>

      <Block
        title="Activity"
        hint={`${formatMinutes(monthTotalMin)} in ${HEATMAP_DAYS} days`}
      >
        <ActivityHeatmap days={heatmap} />
      </Block>

      <Block
        title="This week"
        hint={`${formatMinutes(weekTotalMin)} total`}
      >
        <WeeklyHoursChart data={weekly} />
      </Block>

      <Block title="Pattern coverage" hint={`${sumSolved(solvedPerPattern)}/150 solved`}>
        <PatternDistributionChart rows={distribution} />
      </Block>

      {weak.length > 0 ? (
        <Block
          title="Weak topics"
          hint={`${weak.length} pattern${weak.length === 1 ? "" : "s"}`}
        >
          <ul className="space-y-2">
            {weak.map((w) => {
              const meta = patternBySlug(w.patternId);
              const name = meta?.name ?? w.patternId;
              return (
                <li
                  key={w.patternId}
                  className="flex items-center justify-between rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2"
                >
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="size-3.5 text-destructive" />
                    <Link
                      href={`/app/patterns/${w.patternId}`}
                      className="font-display text-sm font-semibold tracking-tight transition-colors hover:text-foreground"
                    >
                      {name}
                    </Link>
                  </div>
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    avg {w.avgConfidence.toFixed(1)} · n={w.n}
                  </span>
                </li>
              );
            })}
          </ul>
        </Block>
      ) : null}
    </section>
  );

  function buildHeatmap(
    map: Map<string, { dsaMinutes: number; devMinutes: number; learningMinutes: number; problemsSolved: number }>,
    windowDays: number,
    ref: Date
  ): HeatmapDay[] {
    const out: HeatmapDay[] = [];
    const start = new Date(ref);
    start.setDate(start.getDate() - (windowDays - 1));
    for (let i = 0; i < windowDays; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const key = toDayKey(d);
      const day = map.get(key);
      const minutes = day
        ? day.dsaMinutes + day.devMinutes + day.learningMinutes
        : 0;
      out.push({ date: key, count: minutes, level: bucket(minutes) });
    }
    return out;
  }

  function buildWeekly(
    map: Map<string, { dsaMinutes: number; devMinutes: number; learningMinutes: number; problemsSolved: number }>,
    ref: Date
  ): WeeklyRow[] {
    const out: WeeklyRow[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(ref);
      d.setDate(ref.getDate() - i);
      const key = toDayKey(d);
      const day = map.get(key);
      out.push({
        day: WEEK_DAYS[d.getDay()],
        dsa: day?.dsaMinutes ?? 0,
        dev: day?.devMinutes ?? 0,
        learning: day?.learningMinutes ?? 0,
      });
    }
    return out;
  }
}

function bucket(minutes: number): 0 | 1 | 2 | 3 | 4 {
  if (minutes === 0) return 0;
  if (minutes < 20) return 1;
  if (minutes < 60) return 2;
  if (minutes < 120) return 3;
  return 4;
}

function sumSolved(map: Record<string, number>): number {
  return Object.values(map).reduce((a, b) => a + b, 0);
}

function Block({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-baseline justify-between border-b border-border/20 pb-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {hint ? (
          <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {hint}
          </span>
        ) : null}
      </div>
      {children}
    </section>
  );
}

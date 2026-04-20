"use client";

import dynamic from "next/dynamic";
import { useHydrated } from "@/lib/hooks/use-hydrated";

const ActivityCalendar = dynamic(
  () => import("react-activity-calendar").then((m) => m.ActivityCalendar),
  {
    ssr: false,
    loading: () => (
      <div className="h-[120px] animate-pulse rounded-md bg-muted/30" />
    ),
  }
);

export type HeatmapDay = {
  date: string; // YYYY-MM-DD
  count: number;
  level: 0 | 1 | 2 | 3 | 4;
};

// Design system §2: blue-400 is the sanctioned accent for contribution
// graphs. Opacity levels match the /25, /50, /75, /100 pattern.
// Level 0 (no activity) maps to --muted in each scheme via hex.
const THEME = {
  // --muted light = oklch(0.97 0 0) → #F7F7F7
  light: ["#F7F7F7", "#60A5FA40", "#60A5FA80", "#60A5FABF", "#60A5FA"],
  // --muted dark ≈ oklch(0.269 0 0) → #2B2B2B
  dark: ["#2B2B2B", "#60A5FA40", "#60A5FA80", "#60A5FABF", "#60A5FA"],
};

export function ActivityHeatmap({ days }: { days: HeatmapDay[] }) {
  const hydrated = useHydrated();

  if (!hydrated) {
    return <div className="h-[120px] animate-pulse rounded-md bg-muted/30" />;
  }

  if (days.length === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        No activity yet. Start a timer or log a problem.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-hidden text-muted-foreground">
      <ActivityCalendar
        data={days}
        blockSize={12}
        blockRadius={2}
        blockMargin={3}
        fontSize={10}
        showTotalCount={false}
        labels={{
          legend: { less: "Less", more: "More" },
        }}
        theme={THEME}
      />
    </div>
  );
}

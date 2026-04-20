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
    <div className="overflow-x-auto overflow-y-hidden">
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
        theme={{
          light: ["oklch(0.97 0 0)", "#93c5fd", "#60a5fa", "#3b82f6", "#1d4ed8"],
          dark: ["oklch(0.269 0 0)", "#93c5fd40", "#60a5fa80", "#3b82f6c0", "#60a5fa"],
        }}
      />
    </div>
  );
}

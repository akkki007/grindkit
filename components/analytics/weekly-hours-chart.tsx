"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

export type WeeklyRow = {
  day: string;
  dsa: number;
  dev: number;
  learning: number;
};

export function WeeklyHoursChart({ data }: { data: WeeklyRow[] }) {
  const total = data.reduce(
    (acc, d) => acc + d.dsa + d.dev + d.learning,
    0
  );

  if (total === 0) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        No sessions logged this week. Start a Pomodoro to fill this in.
      </p>
    );
  }

  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          margin={{ top: 6, right: 6, left: -20, bottom: 0 }}
        >
          <CartesianGrid
            stroke="oklch(var(--border))"
            strokeOpacity={0.3}
            vertical={false}
          />
          <XAxis
            dataKey="day"
            stroke="oklch(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
          />
          <YAxis
            stroke="oklch(var(--muted-foreground))"
            fontSize={10}
            tickLine={false}
            axisLine={false}
            fontFamily="var(--font-mono)"
            tickFormatter={(v: number) => `${v}m`}
          />
          <Tooltip
            cursor={{ fill: "oklch(var(--muted))", fillOpacity: 0.4 }}
            contentStyle={{
              background: "oklch(var(--popover))",
              border: "1px solid oklch(var(--border))",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            formatter={(value, name) => [
              `${Number(value ?? 0)}m`,
              String(name ?? "").toUpperCase(),
            ]}
          />
          <Legend
            wrapperStyle={{
              fontSize: 10,
              fontFamily: "var(--font-mono)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
            }}
            iconType="square"
            iconSize={8}
          />
          <Bar dataKey="dsa" stackId="a" fill="oklch(var(--foreground))" radius={[0, 0, 0, 0]} />
          <Bar dataKey="dev" stackId="a" fill="oklch(var(--foreground) / 0.5)" />
          <Bar
            dataKey="learning"
            stackId="a"
            fill="oklch(var(--foreground) / 0.25)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Cell,
} from "recharts";

export type PatternRow = {
  pattern: string;
  solved: number;
  total: number;
};

export function PatternDistributionChart({ rows }: { rows: PatternRow[] }) {
  if (rows.every((r) => r.solved === 0)) {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        Log a problem and the distribution across patterns lands here.
      </p>
    );
  }

  const data = rows.map((r) => ({
    ...r,
    pct: r.total > 0 ? (r.solved / r.total) * 100 : 0,
  }));

  return (
    <div className="h-[520px] w-full">
      <ResponsiveContainer>
        <BarChart
          data={data}
          layout="vertical"
          margin={{ top: 4, right: 30, left: 8, bottom: 0 }}
        >
          <CartesianGrid
            stroke="var(--border)"
            strokeOpacity={0.5}
            horizontal={false}
          />
          <XAxis
            type="number"
            domain={[0, "dataMax"]}
            stroke="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            type="category"
            dataKey="pattern"
            stroke="var(--muted-foreground)"
            fontSize={10}
            fontFamily="var(--font-mono)"
            tickLine={false}
            axisLine={false}
            width={120}
          />
          <Tooltip
            cursor={{ fill: "var(--muted)", fillOpacity: 0.5 }}
            contentStyle={{
              background: "var(--popover)",
              color: "var(--popover-foreground)",
              border: "1px solid var(--border)",
              borderRadius: 8,
              fontSize: 12,
              fontFamily: "var(--font-mono)",
            }}
            labelStyle={{ color: "var(--foreground)" }}
            itemStyle={{ color: "var(--foreground)" }}
            formatter={(_value, _name, item) => {
              const row = (item as { payload?: PatternRow & { pct: number } })
                ?.payload;
              if (!row) return ["", "Solved"];
              return [
                `${row.solved}/${row.total} · ${Math.round(row.pct)}%`,
                "Solved",
              ];
            }}
          />
          <Bar dataKey="solved" radius={[0, 3, 3, 0]} fill="var(--foreground)">
            {data.map((row) => (
              <Cell
                key={row.pattern}
                fill="var(--foreground)"
                fillOpacity={row.pct >= 80 ? 1 : row.pct >= 40 ? 0.6 : 0.3}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

import { getCurrentUser } from "@/lib/appwrite/server";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  return (
    <section className="px-6 py-4 space-y-8">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Today
        </p>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hey {user?.name?.split(" ")[0] ?? "friend"} — ready to grind?
        </h1>
        <p className="font-mono text-sm text-muted-foreground text-pretty">
          Dashboard widgets (streak, hours, due reviews) ship in Phase 4.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Current streak" value="—" hint="days" />
        <StatCard label="DSA today" value="—" hint="minutes" />
        <StatCard label="Due reviews" value="—" hint="problems" />
      </div>
    </section>
  );
}

function StatCard({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint: string;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm">
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <p className="mt-2 font-display text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </p>
      <p className="font-mono text-[10px] text-muted-foreground">{hint}</p>
    </div>
  );
}

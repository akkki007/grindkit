import { Skeleton } from "@/components/ui/skeleton";

export default function ProjectBoardLoading() {
  return (
    <section className="px-6 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-56 max-w-full" />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }).map((_, col) => (
          <div
            key={col}
            className="space-y-2 rounded-lg border border-border/50 bg-card/30 p-3"
          >
            <Skeleton className="h-5 w-24" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 rounded-md" />
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}

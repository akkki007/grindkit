import { Skeleton } from "@/components/ui/skeleton";

export default function AnalyticsLoading() {
  return (
    <section className="px-6 py-4 space-y-10">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-44" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      {[36, 56, 44].map((h, i) => (
        <div key={i} className="space-y-3">
          <div className="flex items-baseline justify-between border-b border-border/20 pb-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="rounded-lg" style={{ height: h * 4 }} />
        </div>
      ))}
    </section>
  );
}

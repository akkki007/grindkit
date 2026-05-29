import { Skeleton } from "@/components/ui/skeleton";

export default function ReviseLoading() {
  return (
    <section className="px-6 py-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-3 w-40" />
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-80 max-w-full" />
        </div>
        <Skeleton className="h-4 w-14" />
      </div>

      <Skeleton className="h-56 rounded-lg" />
      <div className="grid grid-cols-3 gap-2">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-16 rounded-md" />
        ))}
      </div>
    </section>
  );
}

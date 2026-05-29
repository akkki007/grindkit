import { Skeleton } from "@/components/ui/skeleton";

export default function PatternsLoading() {
  return (
    <section className="px-6 py-4 space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-44" />
          <Skeleton className="h-8 w-40" />
        </div>
        <Skeleton className="h-4 w-24" />
      </div>

      {Array.from({ length: 2 }).map((_, phase) => (
        <div key={phase} className="space-y-4">
          <Skeleton className="h-6 w-48" />
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <li key={i}>
                <Skeleton className="h-28 rounded-lg" />
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

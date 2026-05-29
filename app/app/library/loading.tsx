import { Skeleton } from "@/components/ui/skeleton";

export default function LibraryLoading() {
  return (
    <section className="px-6 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-40" />
      </div>

      <div className="flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-28 rounded-md" />
        ))}
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 10 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-14 rounded-lg" />
          </li>
        ))}
      </ul>
    </section>
  );
}

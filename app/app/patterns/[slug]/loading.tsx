import { Skeleton } from "@/components/ui/skeleton";

export default function PatternDetailLoading() {
  return (
    <section className="px-6 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-64 max-w-full" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>

      <ul className="space-y-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <li key={i}>
            <Skeleton className="h-16 rounded-lg" />
          </li>
        ))}
      </ul>
    </section>
  );
}

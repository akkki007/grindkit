import { Skeleton } from "@/components/ui/skeleton";

export default function ProblemDetailLoading() {
  return (
    <section className="px-6 py-4 space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-72 max-w-full" />
      </div>
      <Skeleton className="h-10 w-full rounded-md" />
      <Skeleton className="h-64 rounded-lg" />
      <Skeleton className="h-40 rounded-lg" />
    </section>
  );
}

import { cn } from "@/lib/utils";

/**
 * Shimmer placeholder block. Used inside `loading.tsx` files so route
 * navigation paints instantly while the server component streams in.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      aria-hidden
      className={cn("animate-pulse rounded-md bg-muted", className)}
      {...props}
    />
  );
}

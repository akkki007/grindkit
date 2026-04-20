import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "border-border/50 bg-muted text-foreground",
        secondary:
          "border-secondary-foreground/10 bg-secondary/50 text-secondary-foreground",
        outline: "border-border text-muted-foreground",
        difficulty: "border-border/50 bg-muted text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

function Badge({
  className,
  variant,
  ...props
}: React.HTMLAttributes<HTMLSpanElement> &
  VariantProps<typeof badgeVariants>) {
  return (
    <span className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };

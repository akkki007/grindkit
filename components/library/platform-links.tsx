import { ExternalLink } from "lucide-react";
import { PLATFORM_META, type Platform } from "@/lib/data/library";

export function PlatformLinks({
  platforms,
  size = "sm",
}: {
  platforms: Partial<Record<Platform, string>>;
  size?: "sm" | "xs";
}) {
  const entries = (Object.entries(platforms) as [Platform, string][]).filter(
    ([, url]) => !!url
  );
  if (entries.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      {entries.map(([key, url]) => (
        <a
          key={key}
          href={url}
          target="_blank"
          rel="noreferrer"
          className={
            size === "xs"
              ? "inline-flex items-center gap-1 rounded-md border border-input bg-background/50 px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
              : "inline-flex items-center gap-1 rounded-md border border-input bg-background/50 px-2 py-1 font-mono text-[11px] text-muted-foreground transition-colors hover:bg-background/80 hover:text-foreground"
          }
        >
          {PLATFORM_META[key].short}
          <ExternalLink className="size-3" />
        </a>
      ))}
    </div>
  );
}

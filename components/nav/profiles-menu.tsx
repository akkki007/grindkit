"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { UserCircle2, ExternalLink, Settings } from "lucide-react";
import { PROFILE_KEYS, PROFILE_META, type Profiles } from "@/lib/data/profiles";
import { cn } from "@/lib/utils";

export function ProfilesMenu({ profiles }: { profiles: Profiles }) {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const entries = PROFILE_KEYS.filter((k) => profiles[k]);
  const has = entries.length > 0;

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  return (
    <div ref={wrapRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-label="Your profiles"
        className={cn(
          "inline-flex size-9 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          open && "bg-accent text-foreground"
        )}
      >
        <UserCircle2 className="size-4" />
      </button>

      {open ? (
        <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-lg border border-border/50 bg-background shadow-sm">
          <div className="border-b border-border/20 px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Profiles
          </div>
          {has ? (
            <ul className="py-1">
              {entries.map((key) => {
                const url = profiles[key]!;
                const meta = PROFILE_META[key];
                return (
                  <li key={key}>
                    <a
                      href={url}
                      target="_blank"
                      rel="noreferrer"
                      onClick={() => setOpen(false)}
                      className="group flex items-center justify-between gap-2 px-3 py-1.5 font-mono text-xs transition-colors hover:bg-accent"
                    >
                      <span className="flex items-center gap-2">
                        <span className="inline-flex size-5 items-center justify-center rounded-sm border border-border/50 font-mono text-[9px] text-muted-foreground group-hover:text-foreground">
                          {meta.short}
                        </span>
                        {meta.label}
                      </span>
                      <ExternalLink className="size-3 text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100" />
                    </a>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="px-3 py-3 font-mono text-[11px] text-muted-foreground">
              No profiles yet — add them in Settings.
            </p>
          )}
          <div className="border-t border-border/20">
            <Link
              href="/app/settings"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-3 py-2 font-mono text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Settings className="size-3" />
              Manage profiles
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}

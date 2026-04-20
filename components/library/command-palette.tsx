"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Command } from "cmdk";
import { ArrowRight, Search } from "lucide-react";
import {
  LIBRARY,
  DIFFICULTY_META,
  PLATFORM_META,
  SOURCE_LIST_META,
  type Difficulty,
  type Platform,
  type SourceList,
} from "@/lib/data/library";
import { PATTERNS } from "@/lib/data/patterns";
import { cn } from "@/lib/utils";

type Filter = "all" | Difficulty | Platform | SourceList | string;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<Filter>("all");
  const [query, setQuery] = useState("");
  const router = useRouter();

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, [open]);

  const filtered = useMemo(() => {
    let list = LIBRARY as typeof LIBRARY;
    if (filter !== "all") {
      list = list.filter((p) => {
        if (p.difficulty === filter) return true;
        if (p.platform === filter) return true;
        if (p.sourceLists.includes(filter as SourceList)) return true;
        if (p.patternSlug === filter) return true;
        return false;
      });
    }
    return list.slice(0, 50);
  }, [filter]);

  const selectProblem = useCallback(
    (slug: string) => {
      setOpen(false);
      router.push(`/app/problems/new?library=${slug}`);
    },
    [router]
  );

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-6 z-40 hidden items-center gap-2 rounded-md border border-border/50 bg-background/80 px-3 py-1.5 font-mono text-[11px] text-muted-foreground shadow-sm backdrop-blur-xs transition-colors hover:text-foreground sm:inline-flex"
        aria-label="Open command palette"
      >
        <Search className="size-3" />
        <span>Search library</span>
        <kbd className="ml-2 rounded border border-border/50 bg-muted px-1 font-mono text-[10px]">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center bg-background/60 px-4 pt-[10vh] backdrop-blur-xs"
      role="dialog"
      aria-modal="true"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="w-full max-w-xl overflow-hidden rounded-lg border border-border bg-card shadow-sm">
        <Command
          label="Problem library"
          shouldFilter
          className="flex h-[60vh] flex-col"
        >
          <div className="flex items-center gap-2 border-b border-border/50 px-4 py-3">
            <Search className="size-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Search NeetCode 150…"
              className="flex-1 bg-transparent font-mono text-sm outline-none placeholder:text-muted-foreground"
            />
            <kbd className="rounded border border-border/50 bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
              ESC
            </kbd>
          </div>

          <FilterRow filter={filter} setFilter={setFilter} />

          <Command.List className="flex-1 overflow-y-auto px-2 py-2">
            <Command.Empty className="px-3 py-6 text-center font-mono text-xs text-muted-foreground">
              No problems found.
            </Command.Empty>
            <Command.Group>
              {filtered.map((problem) => (
                <Command.Item
                  key={problem.slug}
                  value={`${problem.title} ${problem.patternSlug} ${problem.sourceLists.join(" ")}`}
                  onSelect={() => selectProblem(problem.slug)}
                  className="group flex cursor-pointer items-center gap-2 rounded-md px-3 py-2 aria-selected:bg-muted"
                >
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <p className="truncate font-mono text-sm">
                      {problem.title}
                    </p>
                    <div className="flex flex-wrap gap-1.5">
                      <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                        {DIFFICULTY_META[problem.difficulty].label}
                      </span>
                      <span className="font-mono text-[10px] text-muted-foreground">
                        · {PATTERNS.find((x) => x.slug === problem.patternSlug)?.name}
                      </span>
                    </div>
                  </div>
                  <ArrowRight className="size-3 text-muted-foreground opacity-0 transition-opacity group-aria-selected:opacity-100" />
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>

          <div className="flex items-center justify-between border-t border-border/50 px-3 py-2 font-mono text-[10px] text-muted-foreground">
            <span>{filtered.length} results</span>
            <span>Enter to log · ⌘K to toggle</span>
          </div>
        </Command>
      </div>
    </div>
  );
}

function FilterRow({
  filter,
  setFilter,
}: {
  filter: Filter;
  setFilter: (f: Filter) => void;
}) {
  const chips: { value: Filter; label: string }[] = [
    { value: "all", label: "All" },
    { value: "easy", label: "Easy" },
    { value: "medium", label: "Medium" },
    { value: "hard", label: "Hard" },
    { value: "blind-75", label: SOURCE_LIST_META["blind-75"].short },
    { value: "leetcode", label: PLATFORM_META.leetcode.label },
  ];
  return (
    <div className="flex flex-wrap items-center gap-1.5 border-b border-border/50 px-3 py-2">
      {chips.map((chip) => (
        <button
          key={chip.value}
          type="button"
          onClick={() => setFilter(chip.value)}
          className={cn(
            "rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors",
            filter === chip.value
              ? "border-foreground bg-foreground text-background"
              : "border-border/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {chip.label}
        </button>
      ))}
    </div>
  );
}

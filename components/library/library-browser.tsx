"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlatformLinks } from "@/components/library/platform-links";
import {
  LIBRARY,
  DIFFICULTY_META,
  SOURCE_LIST_META,
  type Difficulty,
  type SourceList,
} from "@/lib/data/library";
import { PATTERNS, patternBySlug } from "@/lib/data/patterns";
import { cn } from "@/lib/utils";

type DifficultyFilter = Difficulty | "all";
type SourceFilter = SourceList | "all";

export function LibraryBrowser() {
  const [query, setQuery] = useState("");
  const [difficulty, setDifficulty] = useState<DifficultyFilter>("all");
  const [pattern, setPattern] = useState<string>("all");
  const [source, setSource] = useState<SourceFilter>("all");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return LIBRARY.filter((p) => {
      if (difficulty !== "all" && p.difficulty !== difficulty) return false;
      if (pattern !== "all" && p.patternSlug !== pattern) return false;
      if (source !== "all" && !p.sourceLists.includes(source)) return false;
      if (q && !p.title.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [query, difficulty, pattern, source]);

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[200px_1fr]">
      <aside className="space-y-5">
        <div>
          <Label>Search</Label>
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Problem title…"
            className="mt-1"
          />
        </div>

        <FilterGroup label="Difficulty">
          <ChipButton
            active={difficulty === "all"}
            onClick={() => setDifficulty("all")}
          >
            All
          </ChipButton>
          {(["easy", "medium", "hard"] as const).map((d) => (
            <ChipButton
              key={d}
              active={difficulty === d}
              onClick={() => setDifficulty(d)}
            >
              {DIFFICULTY_META[d].label}
            </ChipButton>
          ))}
        </FilterGroup>

        <FilterGroup label="Source">
          <ChipButton
            active={source === "all"}
            onClick={() => setSource("all")}
          >
            All
          </ChipButton>
          {(["neetcode-150", "blind-75"] as const).map((s) => (
            <ChipButton
              key={s}
              active={source === s}
              onClick={() => setSource(s)}
            >
              {SOURCE_LIST_META[s].short}
            </ChipButton>
          ))}
        </FilterGroup>

        <FilterGroup label="Pattern">
          <select
            value={pattern}
            onChange={(e) => setPattern(e.target.value)}
            className="mt-1 h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-xs"
          >
            <option value="all">All</option>
            {PATTERNS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </FilterGroup>
      </aside>

      <div>
        <div className="mb-3 flex items-center justify-between">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {filtered.length} / {LIBRARY.length} problems
          </p>
        </div>
        <ul className="divide-y divide-border/50 rounded-lg border border-border/50 bg-card/30">
          {filtered.map((problem) => {
            const patternMeta = patternBySlug(problem.patternSlug);
            return (
              <li
                key={problem.slug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-muted/30"
              >
                <div className="min-w-0 flex-1 space-y-1">
                  <h3 className="truncate font-display text-[15px] font-semibold tracking-tight">
                    {problem.title}
                  </h3>
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="difficulty">
                      {DIFFICULTY_META[problem.difficulty].label}
                    </Badge>
                    {patternMeta ? (
                      <Badge variant="outline">{patternMeta.name}</Badge>
                    ) : null}
                    {problem.sourceLists.map((src) => (
                      <Badge key={src} variant="secondary">
                        {SOURCE_LIST_META[src].short}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div className="flex shrink-0 flex-wrap items-center justify-end gap-2">
                  <PlatformLinks platforms={problem.platforms} size="xs" />
                  <Button asChild size="sm" variant="outline">
                    <Link href={`/app/problems/new?library=${problem.slug}`}>
                      Log
                    </Link>
                  </Button>
                </div>
              </li>
            );
          })}
          {filtered.length === 0 ? (
            <li className="px-4 py-8 text-center font-mono text-xs text-muted-foreground">
              No problems match these filters.
            </li>
          ) : null}
        </ul>
      </div>
    </div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      {children}
    </p>
  );
}

function FilterGroup({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function ChipButton({
  children,
  active,
  onClick,
}: {
  children: React.ReactNode;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "rounded-md border px-2 py-0.5 font-mono text-[10px] transition-colors",
        active
          ? "border-foreground bg-foreground text-background"
          : "border-border/50 text-muted-foreground hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

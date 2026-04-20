"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeEditor } from "@/components/problems/code-editor";
import {
  createProblemAction,
  updateProblemAction,
  type ProblemInput,
} from "@/actions/problems";
import { PATTERNS } from "@/lib/data/patterns";
import { cn } from "@/lib/utils";

const DIFFICULTIES = ["easy", "medium", "hard"] as const;
const PLATFORMS = ["leetcode", "neetcode", "hackerrank", "gfg", "codeforces", "codechef", "custom"] as const;
const STATUSES = ["solved", "attempted", "revisiting"] as const;

type Mode = "create" | "edit";

export function ProblemForm({
  mode,
  problemId,
  initial,
  locked,
}: {
  mode: Mode;
  problemId?: string;
  initial: ProblemInput;
  locked?: { title?: boolean; url?: boolean; platform?: boolean; patternId?: boolean; difficulty?: boolean };
}) {
  const [form, setForm] = useState<ProblemInput>(initial);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function update<K extends keyof ProblemInput>(key: K, value: ProblemInput[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res =
        mode === "create"
          ? await createProblemAction(form)
          : await updateProblemAction(problemId!, form);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      router.replace(`/app/patterns/${form.patternId}`);
      router.refresh();
    });
  }

  return (
    <form onSubmit={onSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            required
            value={form.title}
            onChange={(e) => update("title", e.target.value)}
            disabled={isPending || locked?.title}
          />
        </div>

        <div className="sm:col-span-2 space-y-2">
          <Label htmlFor="url">URL</Label>
          <Input
            id="url"
            type="url"
            value={form.url ?? ""}
            onChange={(e) => update("url", e.target.value)}
            disabled={isPending || locked?.url}
            placeholder="https://leetcode.com/problems/…"
          />
        </div>

        <div className="space-y-2">
          <Label>Platform</Label>
          <ChipGroup
            value={form.platform}
            options={PLATFORMS}
            onChange={(v) => update("platform", v)}
            disabled={isPending || locked?.platform}
          />
        </div>

        <div className="space-y-2">
          <Label>Difficulty</Label>
          <ChipGroup
            value={form.difficulty}
            options={DIFFICULTIES}
            onChange={(v) => update("difficulty", v)}
            disabled={isPending || locked?.difficulty}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="pattern">Pattern</Label>
          <select
            id="pattern"
            value={form.patternId}
            onChange={(e) => update("patternId", e.target.value)}
            disabled={isPending || locked?.patternId}
            className="h-9 w-full rounded-md border border-input bg-background px-2 font-mono text-sm"
          >
            {PATTERNS.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <Label>Status</Label>
          <ChipGroup
            value={form.status}
            options={STATUSES}
            onChange={(v) => update("status", v)}
            disabled={isPending}
          />
        </div>

        <div className="space-y-2">
          <Label>Confidence (1–5)</Label>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                disabled={isPending}
                onClick={() => update("confidence", n)}
                className={cn(
                  "h-9 flex-1 rounded-md border font-mono text-xs transition-colors",
                  form.confidence === n
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="time">Time taken (min)</Label>
          <Input
            id="time"
            type="number"
            min={0}
            max={1000}
            value={form.timeTakenMin ?? 0}
            onChange={(e) => update("timeTakenMin", Number(e.target.value))}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label>Code (C++)</Label>
        <CodeEditor
          value={form.code ?? ""}
          onChange={(v) => update("code", v)}
          language="cpp"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes (markdown)</Label>
        <textarea
          id="notes"
          rows={6}
          value={form.notes ?? ""}
          onChange={(e) => update("notes", e.target.value)}
          disabled={isPending}
          placeholder="Approach, tricky cases, TC/SC…"
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
        />
      </div>

      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : mode === "create" ? "Log problem" : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function ChipGroup<T extends string>({
  value,
  options,
  onChange,
  disabled,
}: {
  value: T;
  options: readonly T[];
  onChange: (v: T) => void;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-wrap gap-1.5">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          disabled={disabled}
          onClick={() => onChange(opt)}
          className={cn(
            "rounded-md border px-2.5 py-1 font-mono text-[11px] capitalize transition-colors",
            value === opt
              ? "border-foreground bg-foreground text-background"
              : "border-border/50 text-muted-foreground hover:text-foreground"
          )}
        >
          {opt.replace(/_/g, " ")}
        </button>
      ))}
    </div>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { Pause, Play, RotateCcw, Square } from "lucide-react";
import {
  TIMER_DURATIONS,
  useRemainingSeconds,
  useTimerStore,
  type SessionType,
  type TimerMode,
} from "@/store/timer";
import { logSessionAction } from "@/actions/sessions";
import { formatClock } from "@/lib/time/format";
import { useHydrated } from "@/lib/hooks/use-hydrated";
import { cn } from "@/lib/utils";

const SESSION_TYPES: { value: SessionType; label: string }[] = [
  { value: "dsa", label: "DSA" },
  { value: "dev", label: "Dev" },
  { value: "learning", label: "Learning" },
];

const MODES: { value: TimerMode; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "break", label: "Break" },
];

export function TimerScreen() {
  const hydrated = useHydrated();
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef<number | null>(null);

  const type = useTimerStore((s) => s.type);
  const mode = useTimerStore((s) => s.mode);
  const running = useTimerStore((s) => s.running);
  const pausedRemaining = useTimerStore((s) => s.pausedRemainingSec);
  const setType = useTimerStore((s) => s.setType);
  const setMode = useTimerStore((s) => s.setMode);
  const start = useTimerStore((s) => s.start);
  const pause = useTimerStore((s) => s.pause);
  const resume = useTimerStore((s) => s.resume);
  const reset = useTimerStore((s) => s.reset);
  const stopAndDrain = useTimerStore((s) => s.stopAndDrain);
  const remaining = useRemainingSeconds();

  useEffect(() => {
    if (running) sessionStartRef.current = Date.now();
  }, [running]);

  if (!hydrated) {
    return <div className="min-h-[60vh]" aria-hidden />;
  }

  const total = TIMER_DURATIONS[mode];
  const progress = Math.min(100, Math.max(0, ((total - remaining) / total) * 100));
  const hasActivity = running || (pausedRemaining !== null && pausedRemaining !== total);

  async function handleStop() {
    const drained = stopAndDrain();
    if (drained.elapsedSec <= 0) return;
    setError(null);
    setSaving(true);
    const durationMin = Math.max(1, Math.round(drained.elapsedSec / 60));
    const startedAt = sessionStartRef.current
      ? new Date(sessionStartRef.current).toISOString()
      : new Date(Date.now() - drained.elapsedSec * 1000).toISOString();
    sessionStartRef.current = null;
    const res = await logSessionAction({
      type: drained.type,
      durationMin,
      startedAt,
      endedAt: new Date().toISOString(),
      problemId: drained.linkedProblemId ?? null,
      taskId: drained.linkedTaskId ?? null,
      projectId: drained.linkedProjectId ?? null,
    });
    setSaving(false);
    if (!res.ok) setError(res.error);
  }

  return (
    <div className="space-y-8 py-8">
      <div className="flex flex-col items-center gap-6 text-center">
        <div className="flex flex-wrap justify-center gap-2">
          {SESSION_TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={cn(
                "rounded-md border px-3 py-1 font-mono text-xs transition-colors",
                type === t.value
                  ? "border-foreground bg-foreground text-background"
                  : "border-border/50 text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
            </button>
          ))}
        </div>

        <div className="flex gap-1 rounded-md border border-border/50 p-1">
          {MODES.map((m) => (
            <button
              key={m.value}
              type="button"
              disabled={running}
              onClick={() => setMode(m.value)}
              className={cn(
                "rounded-sm px-3 py-1 font-mono text-xs transition-colors",
                mode === m.value
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground",
                running && "opacity-50"
              )}
            >
              {m.label}
            </button>
          ))}
        </div>

        <div className="space-y-3">
          <p className="font-display text-7xl font-bold tracking-tight tabular-nums sm:text-9xl">
            {formatClock(remaining)}
          </p>
          <div className="mx-auto h-1 max-w-xs overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
            {mode === "focus" ? "Focus · 25 min" : "Break · 5 min"} ·{" "}
            {SESSION_TYPES.find((s) => s.value === type)?.label}
          </p>
        </div>

        <div className="flex items-center justify-center gap-2">
          {running ? (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause"
              className="inline-flex size-11 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pause className="size-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (pausedRemaining !== null ? resume() : start())}
              aria-label={pausedRemaining !== null ? "Resume" : "Start"}
              className="inline-flex size-11 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90"
            >
              <Play className="size-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!hasActivity || saving}
            aria-label="Stop and log"
            className="inline-flex size-11 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Square className="size-4" />
          </button>

          <button
            type="button"
            onClick={reset}
            aria-label="Reset"
            className="inline-flex size-11 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-4" />
          </button>
        </div>

        {error ? (
          <p className="font-mono text-xs text-destructive">{error}</p>
        ) : null}
        {saving ? (
          <p className="font-mono text-xs text-muted-foreground">Saving session…</p>
        ) : null}
      </div>
    </div>
  );
}

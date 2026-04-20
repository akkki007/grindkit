"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Pause, Play, RotateCcw, Square, X, Minimize2, Maximize2 } from "lucide-react";
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
  { value: "learning", label: "Learn" },
];

const MODES: { value: TimerMode; label: string }[] = [
  { value: "focus", label: "Focus" },
  { value: "break", label: "Break" },
];

export function TimerWidget() {
  const hydrated = useHydrated();
  const [open, setOpen] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const sessionStartRef = useRef<number | null>(null);
  const notifiedRef = useRef(false);

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

  useEffect(() => {
    if (running && remaining > 0) {
      notifiedRef.current = false;
      return;
    }
    if (!running && !notifiedRef.current && pausedRemaining === 0) {
      notifiedRef.current = true;
      notifyEnd(mode);
    }
  }, [running, remaining, pausedRemaining, mode]);

  if (!hydrated) return null;

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

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-label="Show timer"
        className={cn(
          "fixed bottom-6 right-6 z-40 inline-flex h-10 items-center gap-2 rounded-full border border-border/50 bg-background/90 px-3 font-mono text-xs shadow-sm backdrop-blur-xs transition-colors hover:bg-background",
          running && "ring-1 ring-foreground"
        )}
      >
        <Maximize2 className="size-3" />
        <span className="tabular-nums">{formatClock(remaining)}</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-40 w-64 overflow-hidden rounded-lg border border-border/50 bg-background/90 shadow-sm backdrop-blur-xs">
      <div className="flex items-center justify-between border-b border-border/20 px-3 py-1.5">
        <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Pomodoro
        </span>
        <div className="flex items-center gap-0.5">
          <Link
            href="/app/timer"
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            aria-label="Open full timer"
          >
            <Minimize2 className="size-3 rotate-180" />
          </Link>
          <button
            type="button"
            onClick={() => setOpen(false)}
            aria-label="Hide timer"
            className="inline-flex size-6 items-center justify-center rounded text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <X className="size-3" />
          </button>
        </div>
      </div>

      <div className="space-y-3 px-4 py-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex gap-0.5 rounded-md border border-border/50 p-0.5">
            {MODES.map((m) => (
              <button
                key={m.value}
                type="button"
                disabled={running}
                onClick={() => setMode(m.value)}
                className={cn(
                  "rounded-sm px-2 py-0.5 font-mono text-[10px] transition-colors",
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

          <div className="flex gap-0.5">
            {SESSION_TYPES.map((t) => (
              <button
                key={t.value}
                type="button"
                onClick={() => setType(t.value)}
                className={cn(
                  "rounded-md border px-1.5 py-0.5 font-mono text-[10px] transition-colors",
                  type === t.value
                    ? "border-foreground bg-foreground text-background"
                    : "border-border/50 text-muted-foreground hover:text-foreground"
                )}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        <div className="text-center">
          <p className="font-display text-4xl font-bold tracking-tight tabular-nums">
            {formatClock(remaining)}
          </p>
          <div className="mt-2 h-0.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full bg-foreground transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-center gap-1.5">
          {running ? (
            <button
              type="button"
              onClick={pause}
              aria-label="Pause"
              className="inline-flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            >
              <Pause className="size-3.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => (pausedRemaining !== null ? resume() : start())}
              aria-label={pausedRemaining !== null ? "Resume" : "Start"}
              className="inline-flex size-8 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90"
            >
              <Play className="size-3.5" />
            </button>
          )}

          <button
            type="button"
            onClick={handleStop}
            disabled={!hasActivity || saving}
            aria-label="Stop and log"
            className="inline-flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:opacity-40"
          >
            <Square className="size-3.5" />
          </button>

          <button
            type="button"
            onClick={reset}
            aria-label="Reset"
            className="inline-flex size-8 items-center justify-center rounded-md border border-border/50 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <RotateCcw className="size-3.5" />
          </button>
        </div>

        {error ? (
          <p className="font-mono text-[10px] text-destructive">{error}</p>
        ) : null}
      </div>
    </div>
  );
}

function notifyEnd(mode: TimerMode) {
  const title = mode === "focus" ? "Focus block ended" : "Break over";
  const body =
    mode === "focus"
      ? "Nice — take a short break."
      : "Break's up. Back to the grind.";
  try {
    if (typeof Notification === "undefined") return;
    if (Notification.permission === "granted") {
      new Notification(title, { body, silent: false });
      return;
    }
    if (Notification.permission !== "denied") {
      Notification.requestPermission().then((perm) => {
        if (perm === "granted") new Notification(title, { body, silent: false });
      });
    }
  } catch {
    // ignore
  }
}

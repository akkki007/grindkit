"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SessionType = "dsa" | "dev" | "learning";
export type TimerMode = "focus" | "break";

const FOCUS_SECONDS = 25 * 60;
const BREAK_SECONDS = 5 * 60;

export const TIMER_DURATIONS: Record<TimerMode, number> = {
  focus: FOCUS_SECONDS,
  break: BREAK_SECONDS,
};

type TimerState = {
  type: SessionType;
  mode: TimerMode;
  running: boolean;
  startedAt: number | null;
  endsAt: number | null;
  pausedRemainingSec: number | null;
  linkedProblemId: string | null;
  linkedTaskId: string | null;
  linkedProjectId: string | null;
  setType: (t: SessionType) => void;
  setMode: (m: TimerMode) => void;
  start: (opts?: {
    problemId?: string | null;
    taskId?: string | null;
    projectId?: string | null;
  }) => void;
  pause: () => void;
  resume: () => void;
  reset: () => void;
  /** Returns the elapsed focus seconds when stopped, and clears linked ids. */
  stopAndDrain: () => {
    type: SessionType;
    mode: TimerMode;
    elapsedSec: number;
    linkedProblemId: string | null;
    linkedTaskId: string | null;
    linkedProjectId: string | null;
  };
  tick: () => void;
};

export const useTimerStore = create<TimerState>()(
  persist(
    (set, get) => ({
      type: "dsa",
      mode: "focus",
      running: false,
      startedAt: null,
      endsAt: null,
      pausedRemainingSec: null,
      linkedProblemId: null,
      linkedTaskId: null,
      linkedProjectId: null,

      setType: (type) => set({ type }),
      setMode: (mode) => {
        const { running } = get();
        if (running) return;
        set({
          mode,
          pausedRemainingSec: null,
          startedAt: null,
          endsAt: null,
        });
      },

      start: (opts) => {
        const { mode, pausedRemainingSec } = get();
        const now = Date.now();
        const remainingSec = pausedRemainingSec ?? TIMER_DURATIONS[mode];
        set({
          running: true,
          startedAt: now,
          endsAt: now + remainingSec * 1000,
          pausedRemainingSec: null,
          linkedProblemId: opts?.problemId ?? get().linkedProblemId ?? null,
          linkedTaskId: opts?.taskId ?? get().linkedTaskId ?? null,
          linkedProjectId: opts?.projectId ?? get().linkedProjectId ?? null,
        });
      },

      pause: () => {
        const { endsAt, running } = get();
        if (!running || !endsAt) return;
        const remainingMs = endsAt - Date.now();
        set({
          running: false,
          pausedRemainingSec: Math.max(0, Math.round(remainingMs / 1000)),
          endsAt: null,
          startedAt: null,
        });
      },

      resume: () => {
        const { pausedRemainingSec, mode } = get();
        const now = Date.now();
        const remainingSec = pausedRemainingSec ?? TIMER_DURATIONS[mode];
        set({
          running: true,
          startedAt: now,
          endsAt: now + remainingSec * 1000,
          pausedRemainingSec: null,
        });
      },

      reset: () => {
        set({
          running: false,
          startedAt: null,
          endsAt: null,
          pausedRemainingSec: null,
          linkedProblemId: null,
          linkedTaskId: null,
          linkedProjectId: null,
        });
      },

      stopAndDrain: () => {
        const {
          type,
          mode,
          running,
          startedAt,
          endsAt,
          pausedRemainingSec,
          linkedProblemId,
          linkedTaskId,
          linkedProjectId,
        } = get();
        const total = TIMER_DURATIONS[mode];
        let elapsedSec = 0;
        if (running && startedAt && endsAt) {
          const remaining = Math.max(0, Math.round((endsAt - Date.now()) / 1000));
          elapsedSec = Math.max(0, total - remaining);
        } else if (pausedRemainingSec !== null) {
          elapsedSec = Math.max(0, total - pausedRemainingSec);
        }
        set({
          running: false,
          startedAt: null,
          endsAt: null,
          pausedRemainingSec: null,
          linkedProblemId: null,
          linkedTaskId: null,
          linkedProjectId: null,
        });
        return {
          type,
          mode,
          elapsedSec,
          linkedProblemId,
          linkedTaskId,
          linkedProjectId,
        };
      },

      tick: () => {
        const { running, endsAt } = get();
        if (!running || !endsAt) return;
        if (Date.now() >= endsAt) {
          set({
            running: false,
            endsAt: null,
            startedAt: null,
            pausedRemainingSec: 0,
          });
        }
      },
    }),
    {
      name: "grindkit-timer",
      partialize: (state) => ({
        type: state.type,
        mode: state.mode,
        running: state.running,
        startedAt: state.startedAt,
        endsAt: state.endsAt,
        pausedRemainingSec: state.pausedRemainingSec,
        linkedProblemId: state.linkedProblemId,
        linkedTaskId: state.linkedTaskId,
        linkedProjectId: state.linkedProjectId,
      }),
    }
  )
);

export function useRemainingSeconds(): number {
  return useTimerStore((s) => {
    if (s.running && s.endsAt) {
      return Math.max(0, Math.round((s.endsAt - Date.now()) / 1000));
    }
    return s.pausedRemainingSec ?? TIMER_DURATIONS[s.mode];
  });
}

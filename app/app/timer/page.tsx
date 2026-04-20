import { TimerScreen } from "@/components/timer/timer-screen";

export default function TimerPage() {
  return (
    <section className="px-6 py-4 space-y-4">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Pomodoro
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Focus timer</h1>
        <p className="font-mono text-sm text-muted-foreground">
          25 / 5 cadence. Pick a type, start, stop logs to sessions.
        </p>
      </div>
      <TimerScreen />
    </section>
  );
}

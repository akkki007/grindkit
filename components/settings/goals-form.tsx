"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateGoalsAction } from "@/actions/profile";

export function GoalsForm({
  initial,
}: {
  initial: { dailyGoalProblems: number; dailyGoalMinutes: number; timezone?: string };
}) {
  const [problems, setProblems] = useState(initial.dailyGoalProblems);
  const [minutes, setMinutes] = useState(initial.dailyGoalMinutes);
  const [timezone, setTimezone] = useState(initial.timezone ?? "");
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateGoalsAction({
        dailyGoalProblems: problems,
        dailyGoalMinutes: minutes,
        timezone: timezone.trim() || undefined,
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  function detectTimezone() {
    try {
      const tz = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (tz) {
        setTimezone(tz);
        setSaved(false);
      }
    } catch {
      // ignore
    }
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="goal-problems">Problems / day</Label>
          <Input
            id="goal-problems"
            type="number"
            min={0}
            max={100}
            value={problems}
            onChange={(e) => {
              setProblems(Number(e.target.value));
              setSaved(false);
            }}
            disabled={isPending}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="goal-minutes">DSA minutes / day</Label>
          <Input
            id="goal-minutes"
            type="number"
            min={0}
            max={1440}
            step={5}
            value={minutes}
            onChange={(e) => {
              setMinutes(Number(e.target.value));
              setSaved(false);
            }}
            disabled={isPending}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <Label htmlFor="goal-tz">Timezone (IANA)</Label>
          <button
            type="button"
            onClick={detectTimezone}
            className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
          >
            Detect
          </button>
        </div>
        <Input
          id="goal-tz"
          value={timezone}
          onChange={(e) => {
            setTimezone(e.target.value);
            setSaved(false);
          }}
          placeholder="e.g. Asia/Kolkata"
          disabled={isPending}
        />
        <p className="font-mono text-[10px] text-muted-foreground">
          Used to send reminders at the right local time.
        </p>
      </div>

      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}

      <div className="flex items-center justify-end gap-3">
        {saved ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground">
            <Check className="size-3" /> Saved
          </span>
        ) : null}
        <Button type="submit" disabled={isPending}>
          {isPending ? "Saving…" : "Save goals"}
        </Button>
      </div>
    </form>
  );
}

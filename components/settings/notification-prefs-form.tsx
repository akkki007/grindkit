"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { updateNotificationPrefsAction } from "@/actions/profile";
import {
  NOTIFICATION_KEYS,
  NOTIFICATION_META,
  type NotificationPrefs,
} from "@/lib/data/notifications";

export function NotificationPrefsForm({
  initial,
}: {
  initial: NotificationPrefs;
}) {
  const [prefs, setPrefs] = useState<NotificationPrefs>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function toggle(key: keyof NotificationPrefs) {
    setPrefs((prev) => ({ ...prev, [key]: !prev[key] }));
    setSaved(false);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await updateNotificationPrefsAction(prefs);
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setSaved(true);
      router.refresh();
    });
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <ul className="divide-y divide-border/50 rounded-lg border border-border/50 bg-card/30">
        {NOTIFICATION_KEYS.map((key) => {
          const meta = NOTIFICATION_META[key];
          const on = prefs[key];
          return (
            <li
              key={key}
              className="flex items-start justify-between gap-4 px-4 py-3"
            >
              <div className="min-w-0 flex-1">
                <p className="font-display text-sm font-semibold tracking-tight">
                  {meta.label}
                </p>
                <p className="mt-0.5 font-mono text-[11px] leading-relaxed text-muted-foreground">
                  {meta.hint}
                  {meta.defaultTime ? ` · default ${meta.defaultTime}` : ""}
                </p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={on}
                aria-label={meta.label}
                onClick={() => toggle(key)}
                disabled={isPending}
                className={cn(
                  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full border border-border/50 transition-colors",
                  on ? "bg-foreground" : "bg-muted"
                )}
              >
                <span
                  className={cn(
                    "inline-block size-3.5 rounded-full bg-background transition-transform",
                    on ? "translate-x-[18px]" : "translate-x-0.5"
                  )}
                />
              </button>
            </li>
          );
        })}
      </ul>

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
          {isPending ? "Saving…" : "Save preferences"}
        </Button>
      </div>
    </form>
  );
}

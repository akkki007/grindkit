"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PROFILE_KEYS, PROFILE_META, type Profiles } from "@/lib/data/profiles";
import { updateProfilesAction } from "@/actions/profile";

export function ProfilesForm({ initial }: { initial: Profiles }) {
  const [form, setForm] = useState<Profiles>(initial);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function setKey<K extends keyof Profiles>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  }

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const payload = PROFILE_KEYS.reduce<Record<string, string>>((acc, key) => {
        acc[key] = form[key] ?? "";
        return acc;
      }, {});
      const res = await updateProfilesAction(payload);
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
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {PROFILE_KEYS.map((key) => {
          const meta = PROFILE_META[key];
          return (
            <div key={key} className="space-y-1.5">
              <Label htmlFor={`profile-${key}`}>{meta.label}</Label>
              <Input
                id={`profile-${key}`}
                type="url"
                placeholder={meta.placeholder}
                value={form[key] ?? ""}
                onChange={(e) => setKey(key, e.target.value)}
                disabled={isPending}
              />
            </div>
          );
        })}
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
          {isPending ? "Saving…" : "Save profiles"}
        </Button>
      </div>
    </form>
  );
}

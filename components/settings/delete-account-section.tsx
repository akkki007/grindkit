"use client";

import { useState, useTransition } from "react";
import { AlertTriangle, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { deleteAccountAction } from "@/actions/profile";

export function DeleteAccountSection({ email }: { email: string }) {
  const [open, setOpen] = useState(false);
  const [confirm, setConfirm] = useState("");
  const [isPending, startTransition] = useTransition();

  if (!open) {
    return (
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="size-3.5" />
        Delete account
      </Button>
    );
  }

  const canSubmit = confirm === email && !isPending;

  function onDelete() {
    if (!canSubmit) return;
    startTransition(async () => {
      await deleteAccountAction();
    });
  }

  return (
    <div className="space-y-4 rounded-lg border border-destructive/40 bg-destructive/5 p-4">
      <div className="flex items-start gap-2">
        <AlertTriangle className="mt-0.5 size-4 shrink-0 text-destructive" />
        <div className="space-y-1">
          <p className="font-display text-sm font-semibold tracking-tight text-foreground">
            This can&apos;t be undone
          </p>
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Your problems, sessions, projects, tasks, profile, and Appwrite
            account will all be removed. Type{" "}
            <span className="font-semibold text-foreground">{email}</span> to
            confirm.
          </p>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="confirm-email" className="sr-only">
          Confirm email
        </Label>
        <Input
          id="confirm-email"
          autoComplete="off"
          value={confirm}
          onChange={(e) => setConfirm(e.target.value)}
          placeholder={email}
          disabled={isPending}
        />
      </div>

      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => {
            setOpen(false);
            setConfirm("");
          }}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button
          type="button"
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={!canSubmit}
        >
          {isPending ? "Deleting…" : "Permanently delete"}
        </Button>
      </div>
    </div>
  );
}

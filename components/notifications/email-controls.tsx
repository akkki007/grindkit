"use client";

import { useState, useTransition } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { setEmailNotificationsAction, sendTestEmailAction } from "@/actions/email";

export function EmailControls({
  email,
  enabled: initialEnabled,
}: {
  email: string;
  enabled: boolean;
}) {
  const [enabled, setEnabled] = useState(initialEnabled);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function toggle() {
    setMessage(null);
    const next = !enabled;
    startTransition(async () => {
      const res = await setEmailNotificationsAction(next);
      if (!res.ok) { setMessage(res.error); return; }
      setEnabled(next);
      setMessage(next ? "Email notifications enabled." : "Email notifications disabled.");
    });
  }

  function sendTest() {
    setMessage(null);
    startTransition(async () => {
      const res = await sendTestEmailAction();
      setMessage(res.ok ? `Test email sent to ${email}.` : res.error);
    });
  }

  return (
    <div className="space-y-3">
      <p className="font-mono text-xs text-muted-foreground">
        Notifications will be sent to <span className="text-foreground">{email}</span>
      </p>

      <div className="flex flex-wrap items-center gap-2">
        {enabled ? (
          <>
            <Button onClick={sendTest} size="sm" variant="outline" disabled={isPending}>
              <Send className="size-3.5" />
              Send test email
            </Button>
            <Button onClick={toggle} size="sm" variant="ghost" disabled={isPending}>
              <BellOff className="size-3.5" />
              Disable
            </Button>
          </>
        ) : (
          <Button onClick={toggle} size="sm" disabled={isPending}>
            <Bell className="size-3.5" />
            Enable email notifications
          </Button>
        )}
      </div>

      {message ? (
        <p className="font-mono text-xs text-foreground">{message}</p>
      ) : null}
    </div>
  );
}

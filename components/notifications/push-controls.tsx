"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { Bell, BellOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  isPushSupported,
  subscribeToPush,
  unsubscribeFromPush,
} from "@/lib/push/browser";
import {
  savePushSubscriptionAction,
  clearPushSubscriptionAction,
  sendTestPushAction,
} from "@/actions/push";

type Status = "idle" | "granted" | "denied" | "unsupported";

const noopSubscribe = () => () => {};
const getServerStatus = (): Status => "idle";

function getClientStatus(): Status {
  if (!isPushSupported()) return "unsupported";
  const p = Notification.permission;
  return p === "granted" ? "granted" : p === "denied" ? "denied" : "idle";
}

export function PushControls({
  hasSavedSubscription,
  vapidPublicKey,
}: {
  hasSavedSubscription: boolean;
  vapidPublicKey: string | null;
}) {
  const browserStatus = useSyncExternalStore(
    noopSubscribe,
    getClientStatus,
    getServerStatus
  );
  const [overrideStatus, setOverrideStatus] = useState<Status | null>(null);
  const status: Status = overrideStatus ?? browserStatus;
  const [enabled, setEnabled] = useState(hasSavedSubscription);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  async function enable() {
    setMessage(null);
    if (!vapidPublicKey) {
      setMessage("VAPID public key missing. Set NEXT_PUBLIC_VAPID_PUBLIC_KEY.");
      return;
    }
    const perm = await Notification.requestPermission();
    setOverrideStatus(
      perm === "granted" ? "granted" : perm === "denied" ? "denied" : "idle"
    );
    if (perm !== "granted") return;
    try {
      const sub = await subscribeToPush(vapidPublicKey);
      if (!sub) {
        setMessage("Could not subscribe — browser refused.");
        return;
      }
      startTransition(async () => {
        const res = await savePushSubscriptionAction(sub.toJSON());
        if (!res.ok) {
          setMessage(res.error);
          return;
        }
        setEnabled(true);
        setMessage("Subscribed. Send yourself a test below.");
      });
    } catch (err) {
      setMessage(err instanceof Error ? err.message : "Subscribe failed");
    }
  }

  async function disable() {
    setMessage(null);
    await unsubscribeFromPush();
    startTransition(async () => {
      const res = await clearPushSubscriptionAction();
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setEnabled(false);
      setMessage("Unsubscribed.");
    });
  }

  async function test() {
    setMessage(null);
    startTransition(async () => {
      const res = await sendTestPushAction();
      if (!res.ok) {
        setMessage(res.error);
        return;
      }
      setMessage("Push sent. Check your device.");
    });
  }

  if (status === "unsupported") {
    return (
      <p className="font-mono text-xs text-muted-foreground">
        Your browser doesn&apos;t support Web Push.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        {enabled && status === "granted" ? (
          <>
            <Button onClick={test} size="sm" variant="outline" disabled={isPending}>
              <Send className="size-3.5" />
              Send test push
            </Button>
            <Button onClick={disable} size="sm" variant="ghost" disabled={isPending}>
              <BellOff className="size-3.5" />
              Disable
            </Button>
          </>
        ) : (
          <Button onClick={enable} size="sm" disabled={isPending || status === "denied"}>
            <Bell className="size-3.5" />
            {status === "denied" ? "Permission denied" : "Enable notifications"}
          </Button>
        )}
      </div>

      <p className="font-mono text-[11px] text-muted-foreground">
        {status === "denied"
          ? "Reset notification permission for this site in your browser, then try again."
          : enabled
            ? "You'll get streak reminders, revision nudges, and session-end pings."
            : "Grant permission to receive streak nudges and revision reminders."}
      </p>

      {message ? (
        <p className="font-mono text-xs text-foreground">{message}</p>
      ) : null}
    </div>
  );
}

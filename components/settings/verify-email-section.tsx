"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MailCheck, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { sendVerificationOtpAction, verifyEmailOtpAction } from "@/actions/otp";

type Step = "idle" | "sent" | "verified";

export function VerifyEmailSection({
  email,
  name,
  verified,
}: {
  email: string;
  name: string;
  verified: boolean;
}) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(verified ? "verified" : "idle");
  const [otp, setOtp] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const otpRef = useRef<HTMLInputElement>(null);

  if (step === "verified") {
    return (
      <div className="flex items-center gap-2 font-mono text-sm text-muted-foreground">
        <BadgeCheck className="size-4 shrink-0 text-foreground" />
        <span>
          <span className="text-foreground">{email}</span> is verified.
        </span>
      </div>
    );
  }

  function sendCode() {
    setMessage(null);
    startTransition(async () => {
      const res = await sendVerificationOtpAction({ email, name });
      if (!res.ok) { setMessage(res.error); return; }
      setStep("sent");
      setTimeout(() => otpRef.current?.focus(), 50);
    });
  }

  function submitOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMessage(null);
    startTransition(async () => {
      const res = await verifyEmailOtpAction(otp);
      if (!res.ok) { setMessage(res.error); return; }
      setStep("verified");
      router.refresh();
    });
  }

  if (step === "sent") {
    return (
      <div className="space-y-3">
        <div className="flex items-start gap-2 rounded-lg border border-border/50 bg-card/30 px-4 py-3">
          <MailCheck className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
          <p className="font-mono text-xs leading-relaxed text-muted-foreground">
            Code sent to <span className="text-foreground">{email}</span>. Check your inbox.
          </p>
        </div>

        <form onSubmit={submitOtp} className="flex items-center gap-2">
          <Input
            ref={otpRef}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            required
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setMessage(null); }}
            disabled={isPending}
            className="w-36 font-mono tracking-[0.3em] text-center"
          />
          <Button type="submit" size="sm" disabled={isPending || otp.length < 6}>
            {isPending ? "Verifying…" : "Confirm"}
          </Button>
          <button
            type="button"
            onClick={sendCode}
            disabled={isPending}
            className="font-mono text-xs text-muted-foreground transition-colors hover:text-foreground disabled:opacity-50"
          >
            Resend
          </button>
        </form>

        {message ? (
          <p className="font-mono text-xs text-destructive">{message}</p>
        ) : null}
      </div>
    );
  }

  // idle — unverified banner
  return (
    <div className="space-y-3">
      <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3">
        <ShieldAlert className="mt-0.5 size-4 shrink-0 text-amber-500" />
        <p className="font-mono text-xs leading-relaxed text-muted-foreground">
          <span className="text-foreground">{email}</span> is not verified. Verify to enable
          email notifications and secure your account.
        </p>
      </div>

      <Button size="sm" onClick={sendCode} disabled={isPending}>
        {isPending ? "Sending…" : "Send verification code"}
      </Button>

      {message ? (
        <p className="font-mono text-xs text-destructive">{message}</p>
      ) : null}
    </div>
  );
}

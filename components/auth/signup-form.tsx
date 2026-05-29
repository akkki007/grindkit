"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { sendOtpAction, verifyOtpAndSignupAction } from "@/actions/otp";

type Step = "details" | "verify";

export function SignupForm() {
  const [step, setStep] = useState<Step>("details");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const otpRef = useRef<HTMLInputElement>(null);

  function submitDetails(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await sendOtpAction({ name, email });
      if (!res.ok) { setError(res.error); return; }
      setStep("verify");
      setTimeout(() => otpRef.current?.focus(), 50);
    });
  }

  function submitOtp(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await verifyOtpAndSignupAction({ name, email, password, otp });
      if (!res.ok) { setError(res.error); return; }
      router.replace("/app");
      router.refresh();
    });
  }

  function resend() {
    setOtp("");
    setError(null);
    startTransition(async () => {
      const res = await sendOtpAction({ name, email });
      if (!res.ok) { setError(res.error); return; }
    });
  }

  if (step === "verify") {
    return (
      <form onSubmit={submitOtp} className="space-y-4">
        <div className="rounded-lg border border-border/50 bg-card/30 px-4 py-3 space-y-0.5">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Code sent to
          </p>
          <p className="font-mono text-sm text-foreground">{email}</p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="otp">Verification code</Label>
          <Input
            id="otp"
            ref={otpRef}
            inputMode="numeric"
            pattern="\d{6}"
            maxLength={6}
            autoComplete="one-time-code"
            placeholder="000000"
            required
            value={otp}
            onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setError(null); }}
            disabled={isPending}
            className="font-mono tracking-[0.3em] text-center text-lg"
          />
          <p className="font-mono text-[10px] text-muted-foreground">
            Check your inbox — the 6-digit code expires in 10 minutes.
          </p>
        </div>

        {error ? (
          <p className="font-mono text-xs text-destructive">{error}</p>
        ) : null}

        <Button type="submit" className="w-full" disabled={isPending || otp.length < 6}>
          {isPending ? "Verifying…" : "Verify and create account"}
        </Button>

        <div className="flex items-center justify-between font-mono text-xs text-muted-foreground">
          <button
            type="button"
            onClick={() => { setStep("details"); setOtp(""); setError(null); }}
            disabled={isPending}
            className="transition-colors hover:text-foreground disabled:opacity-50"
          >
            ← Change email
          </button>
          <button
            type="button"
            onClick={resend}
            disabled={isPending}
            className="transition-colors hover:text-foreground disabled:opacity-50"
          >
            Resend code
          </button>
        </div>
      </form>
    );
  }

  return (
    <form onSubmit={submitDetails} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Name</Label>
        <Input
          id="name"
          autoComplete="name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isPending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isPending}
        />
        <p className="font-mono text-[10px] text-muted-foreground">
          Minimum 8 characters.
        </p>
      </div>

      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending code…" : "Continue"}
      </Button>
    </form>
  );
}

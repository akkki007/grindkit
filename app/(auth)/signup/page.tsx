import Link from "next/link";
import { redirect } from "next/navigation";
import { SignupForm } from "@/components/auth/signup-form";
import { getCurrentUser } from "@/lib/appwrite/server";

export default async function SignupPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12 dotted-frame">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Get started
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Create account</h1>
          <p className="font-mono text-sm text-muted-foreground">
            One source of truth for your DSA + dev grind.
          </p>
        </div>

        <SignupForm />

        <p className="font-mono text-xs text-muted-foreground">
          Have an account?{" "}
          <Link
            href="/login"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}

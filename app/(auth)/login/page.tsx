import Link from "next/link";
import { redirect } from "next/navigation";
import { LoginForm } from "@/components/auth/login-form";
import { getCurrentUser } from "@/lib/appwrite/server";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const user = await getCurrentUser();
  if (user) redirect("/app");
  const { next } = await searchParams;

  return (
    <div className="mx-auto flex min-h-screen max-w-4xl flex-col items-center justify-center px-6 py-12 dotted-frame">
      <div className="w-full max-w-sm space-y-6">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Welcome back
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Log in</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Pick up the grind where you left off.
          </p>
        </div>

        <LoginForm next={next} />

        <p className="font-mono text-xs text-muted-foreground">
          No account?{" "}
          <Link
            href="/signup"
            className="font-medium text-foreground underline-offset-4 hover:underline"
          >
            Create one
          </Link>
        </p>
      </div>
    </div>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { getCurrentUser } from "@/lib/appwrite/server";

export default async function LandingPage() {
  const user = await getCurrentUser();
  if (user) redirect("/app");

  return (
    <div className="relative min-h-screen">
      <div className="mx-auto max-w-4xl dotted-frame">
        <header className="flex items-center justify-between border-b border-border/20 px-6 py-4">
          <span className="font-display text-lg font-bold tracking-tight">
            GrindKit
          </span>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild size="sm" variant="ghost">
              <Link href="/login">Log in</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Sign up</Link>
            </Button>
          </div>
        </header>

        <main className="relative px-6 py-16">
          <span className="kanji-bg left-6 top-4" aria-hidden>
            鍛錬
          </span>

          <div className="relative space-y-6 max-w-2xl">
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              DSA + Dev Companion · v1.0
            </p>
            <h1 className="text-3xl font-bold tracking-tight sm:text-5xl">
              Track the daily grind.
              <br />
              <span className="text-muted-foreground">One source of truth.</span>
            </h1>
            <p className="font-mono text-sm leading-relaxed text-muted-foreground text-pretty">
              A minimalist command center for your NeetCode 150 journey and dev
              projects. Pattern-based learning, spaced repetition, streaks,
              time tracking, and a kanban for shipping work — in one place.
            </p>
            <div className="flex flex-wrap gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="/signup">Start grinding</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/login">I already have an account</Link>
              </Button>
            </div>
          </div>
        </main>

        <div className="slant-divider" aria-hidden />

        <section className="px-6 py-12 grid grid-cols-1 sm:grid-cols-3 gap-6">
          <Feature label="01" title="Pattern-first">
            All 150 problems organised under 18 NeetCode patterns. Foundation →
            Core → Advanced.
          </Feature>
          <Feature label="02" title="Spaced repetition">
            SM-2 scheduling on every solved problem. Stop forgetting patterns
            you already cracked.
          </Feature>
          <Feature label="03" title="Time, by type">
            Pomodoro sessions tagged DSA / Dev / Learning. See the split before
            your week gets lopsided.
          </Feature>
        </section>

        <footer className="border-t border-border/20 px-6 py-6 font-mono text-xs text-muted-foreground">
          <span className="tabular-nums">© 2026 GrindKit</span>
        </footer>
      </div>
    </div>
  );
}

function Feature({
  label,
  title,
  children,
}: {
  label: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </p>
      <h3 className="mt-1 font-display text-lg font-semibold tracking-tight">
        {title}
      </h3>
      <p className="mt-2 font-mono text-sm leading-relaxed text-muted-foreground text-pretty">
        {children}
      </p>
    </div>
  );
}

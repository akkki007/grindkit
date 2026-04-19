"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { logoutAction } from "@/actions/auth";

const NAV_LINKS = [
  { href: "/app", label: "Home" },
  { href: "/app/patterns", label: "Patterns" },
  { href: "/app/revise", label: "Revise" },
  { href: "/app/projects", label: "Projects" },
  { href: "/app/analytics", label: "Analytics" },
];

export function Navbar({ userName }: { userName?: string }) {
  const pathname = usePathname();

  return (
    <nav className="sticky top-0 z-50 mb-8 flex items-center justify-between border-b border-border/20 bg-background/75 px-6 py-2 backdrop-blur-xs">
      <div className="flex items-center gap-6">
        <Link
          href="/app"
          className="font-display text-base font-bold tracking-tight"
        >
          GrindKit
        </Link>
        <ul className="hidden items-center gap-4 sm:flex">
          {NAV_LINKS.map((link) => {
            const isActive =
              pathname === link.href ||
              (link.href !== "/app" && pathname.startsWith(link.href));
            return (
              <li key={link.href} className="relative">
                <Link
                  href={link.href}
                  className={cn(
                    "text-sm font-medium transition-colors",
                    isActive
                      ? "text-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {link.label}
                </Link>
                {isActive ? (
                  <span className="absolute -bottom-1 left-0 right-0 h-0.5 rounded-full bg-foreground" />
                ) : null}
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex items-center gap-2">
        {userName ? (
          <span
            className="hidden font-mono text-xs text-muted-foreground sm:inline"
            title={userName}
          >
            {userName}
          </span>
        ) : null}
        <ThemeToggle />
        <form action={logoutAction}>
          <button
            type="submit"
            aria-label="Log out"
            className="inline-flex size-9 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          >
            <LogOut className="size-4" />
            <span className="sr-only">Log out</span>
          </button>
        </form>
      </div>
    </nav>
  );
}

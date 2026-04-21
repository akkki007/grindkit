"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BarChart3,
  FolderKanban,
  Layers,
  LayoutDashboard,
  Library as LibraryIcon,
  LogOut,
  Menu,
  Repeat2,
  Search,
  Settings,
  Timer as TimerIcon,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProfilesMenu } from "@/components/nav/profiles-menu";
import { logoutAction } from "@/actions/auth";
import type { Profiles } from "@/lib/data/profiles";

const PRIMARY_LINKS = [
  { href: "/app", label: "Home", icon: LayoutDashboard },
  { href: "/app/patterns", label: "Patterns", icon: Layers },
  { href: "/app/library", label: "Library", icon: LibraryIcon },
  { href: "/app/revise", label: "Revise", icon: Repeat2 },
  { href: "/app/projects", label: "Projects", icon: FolderKanban },
  { href: "/app/timer", label: "Timer", icon: TimerIcon },
  { href: "/app/analytics", label: "Analytics", icon: BarChart3 },
] as const;

export function AppShell({
  userName,
  profiles,
  children,
}: {
  userName?: string;
  profiles: Profiles;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  // React canonical "adjust state during render when a prop-ish value
  // changes." Replaces the useEffect(setState) pattern the
  // react-hooks/set-state-in-effect lint rule rejects.
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    if (open) setOpen(false);
  }

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  function openPalette() {
    window.dispatchEvent(new CustomEvent("grindkit:open-command-palette"));
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="sticky top-0 z-30 flex items-center justify-between border-b border-border/20 bg-background/75 px-4 py-2 backdrop-blur-xs md:hidden">
        <Link
          href="/app"
          className="font-display text-base font-bold tracking-tight"
        >
          GrindKit
        </Link>
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={openPalette}
            aria-label="Search library"
            className="inline-flex size-9 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Search className="size-4" />
          </button>
          <ThemeToggle />
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-label="Open menu"
            className="inline-flex size-9 items-center justify-center rounded-md p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <Menu className="size-4" />
          </button>
        </div>
      </header>

      {/* Mobile backdrop */}
      {open ? (
        <button
          type="button"
          aria-label="Close menu"
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-40 cursor-default bg-background/60 backdrop-blur-xs md:hidden"
        />
      ) : null}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 flex w-60 flex-col border-r border-border/30 bg-background transition-transform duration-200 ease-in-out md:translate-x-0",
          open ? "translate-x-0 shadow-sm" : "-translate-x-full"
        )}
      >
        <div className="flex items-center justify-between border-b border-border/20 px-4 py-3">
          <Link
            href="/app"
            className="font-display text-base font-bold tracking-tight"
          >
            GrindKit
          </Link>
          <div className="flex items-center gap-1">
            <ProfilesMenu profiles={profiles} />
            <button
              type="button"
              onClick={() => setOpen(false)}
              aria-label="Close menu"
              className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground md:hidden"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        <div className="px-2 pt-3">
          <button
            type="button"
            onClick={openPalette}
            className="group flex w-full items-center justify-between rounded-md border border-border/50 bg-card/50 px-2.5 py-1.5 font-mono text-[11px] text-muted-foreground transition-colors hover:border-border hover:text-foreground"
          >
            <span className="flex items-center gap-2">
              <Search className="size-3.5" />
              Search library
            </span>
            <kbd className="rounded border border-border/50 bg-muted px-1 font-mono text-[10px]">
              ⌘K
            </kbd>
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <ul className="space-y-0.5">
            {PRIMARY_LINKS.map((link) => {
              const isActive =
                pathname === link.href ||
                (link.href !== "/app" && pathname.startsWith(link.href));
              const Icon = link.icon;
              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className={cn(
                      "group relative flex items-center gap-2.5 rounded-md px-3 py-2 font-mono text-xs transition-colors",
                      isActive
                        ? "bg-muted text-foreground"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                    )}
                  >
                    {isActive ? (
                      <span
                        aria-hidden
                        className="absolute left-0 top-1.5 bottom-1.5 w-0.5 rounded-full bg-foreground"
                      />
                    ) : null}
                    <Icon className="size-4 shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="space-y-0.5 border-t border-border/20 p-2">
          <Link
            href="/app/settings"
            className={cn(
              "flex items-center gap-2.5 rounded-md px-3 py-2 font-mono text-xs transition-colors",
              pathname.startsWith("/app/settings")
                ? "bg-muted text-foreground"
                : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            )}
          >
            <Settings className="size-4 shrink-0" />
            Settings
          </Link>

          <div className="flex items-center justify-between gap-2 px-3 py-1.5">
            <span
              className="min-w-0 flex-1 truncate font-mono text-[10px] text-muted-foreground"
              title={userName}
            >
              {userName ?? ""}
            </span>
            <div className="flex shrink-0 items-center gap-0.5">
              <ThemeToggle className="size-7" />
              <form action={logoutAction}>
                <button
                  type="submit"
                  aria-label="Log out"
                  className="inline-flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
                >
                  <LogOut className="size-3.5" />
                </button>
              </form>
            </div>
          </div>
        </div>
      </aside>

      {/* Content column */}
      <div className="md:pl-60">
        <div className="mx-auto w-full max-w-4xl dotted-frame">
          <main className="pb-20 pt-4 md:pt-6">{children}</main>
        </div>
      </div>
    </>
  );
}

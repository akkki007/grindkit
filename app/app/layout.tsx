import { redirect } from "next/navigation";
import { AppShell } from "@/components/nav/app-shell";
import { CommandPalette } from "@/components/library/command-palette";
import { TimerWidget } from "@/components/timer/timer-widget";
import { RegisterServiceWorker } from "@/components/pwa/register-sw";
import { KeyboardShortcuts } from "@/components/nav/keyboard-shortcuts";
import { getCurrentUser } from "@/lib/appwrite/server";
import { getUserProfile } from "@/actions/profile";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  const profile = await getUserProfile();

  return (
    <div className="min-h-screen">
      <AppShell
        userName={user.name || user.email}
        profiles={profile?.profiles ?? {}}
      >
        {children}
      </AppShell>
      <CommandPalette />
      <TimerWidget />
      <RegisterServiceWorker />
      <KeyboardShortcuts />
    </div>
  );
}

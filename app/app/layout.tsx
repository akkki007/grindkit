import { redirect } from "next/navigation";
import { Navbar } from "@/components/nav/navbar";
import { CommandPalette } from "@/components/library/command-palette";
import { TimerWidget } from "@/components/timer/timer-widget";
import { getCurrentUser } from "@/lib/appwrite/server";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-4xl dotted-frame">
        <Navbar userName={user.name || user.email} />
        <main className="pb-16">{children}</main>
      </div>
      <CommandPalette />
      <TimerWidget />
    </div>
  );
}

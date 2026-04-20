import { ProfilesForm } from "@/components/settings/profiles-form";
import { getUserProfile } from "@/actions/profile";

export default async function SettingsPage() {
  const profile = await getUserProfile();

  return (
    <section className="px-6 py-4 space-y-10">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
      </div>

      <div className="space-y-4">
        <div>
          <h2 className="font-display text-lg font-semibold tracking-tight">
            Platform profiles
          </h2>
          <p className="font-mono text-sm text-muted-foreground">
            Drop your handles. They&apos;ll be one-click away from the navbar.
          </p>
        </div>
        <ProfilesForm initial={profile?.profiles ?? {}} />
      </div>
    </section>
  );
}

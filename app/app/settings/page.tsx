import { ProfilesForm } from "@/components/settings/profiles-form";
import { PushControls } from "@/components/notifications/push-controls";
import { GoalsForm } from "@/components/settings/goals-form";
import { NotificationPrefsForm } from "@/components/settings/notification-prefs-form";
import { DeleteAccountSection } from "@/components/settings/delete-account-section";
import { getUserProfile } from "@/actions/profile";

export default async function SettingsPage() {
  const profile = await getUserProfile();
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ?? null;

  return (
    <section className="px-6 py-4 space-y-10">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Account
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Settings</h1>
        {profile?.email ? (
          <p className="font-mono text-xs text-muted-foreground">
            Signed in as {profile.email}
          </p>
        ) : null}
      </div>

      <Section
        title="Daily goals"
        hint="Drives the dashboard progress and the goal-achieved ping."
      >
        <GoalsForm
          initial={{
            dailyGoalProblems: profile?.dailyGoalProblems ?? 3,
            dailyGoalMinutes: profile?.dailyGoalMinutes ?? 60,
            timezone: profile?.timezone,
          }}
        />
      </Section>

      <Section
        title="Platform profiles"
        hint="Drop your handles. They'll be one-click away from the navbar."
      >
        <ProfilesForm initial={profile?.profiles ?? {}} />
      </Section>

      <Section
        title="Push notifications"
        hint="Enable web push, then pick which types below."
      >
        <PushControls
          hasSavedSubscription={profile?.hasPushSubscription ?? false}
          vapidPublicKey={vapidPublicKey}
        />
      </Section>

      <Section
        title="Notification types"
        hint="Per-event toggles. Applies to both browser and push deliveries."
      >
        <NotificationPrefsForm
          initial={
            profile?.notificationPrefs ?? {
              streakReminder: true,
              streakAtRisk: true,
              dailyRevision: true,
              pomodoroEnd: true,
              weeklyRecap: true,
              goalAchieved: true,
              milestone: true,
            }
          }
        />
      </Section>

      <Section title="Danger zone" hint="Permanent actions.">
        <DeleteAccountSection email={profile?.email ?? ""} />
      </Section>
    </section>
  );
}

function Section({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div className="border-b border-border/20 pb-2">
        <h2 className="font-display text-lg font-semibold tracking-tight">
          {title}
        </h2>
        {hint ? (
          <p className="font-mono text-xs text-muted-foreground">{hint}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

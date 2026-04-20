export type NotificationKey =
  | "streakReminder"
  | "streakAtRisk"
  | "dailyRevision"
  | "pomodoroEnd"
  | "weeklyRecap"
  | "goalAchieved"
  | "milestone";

export type NotificationPrefs = Record<NotificationKey, boolean>;

export const NOTIFICATION_KEYS: readonly NotificationKey[] = [
  "streakReminder",
  "streakAtRisk",
  "dailyRevision",
  "pomodoroEnd",
  "weeklyRecap",
  "goalAchieved",
  "milestone",
] as const;

export const NOTIFICATION_META: Record<
  NotificationKey,
  { label: string; hint: string; defaultTime?: string }
> = {
  streakReminder: {
    label: "Daily streak reminder",
    hint: "Ping me if I haven't logged anything by evening",
    defaultTime: "20:00",
  },
  streakAtRisk: {
    label: "Streak about to break",
    hint: "One-hour-before-midnight nudge",
    defaultTime: "23:00",
  },
  dailyRevision: {
    label: "Daily revision reminder",
    hint: "When problems are due in the revise queue",
    defaultTime: "09:00",
  },
  pomodoroEnd: {
    label: "Pomodoro session / break end",
    hint: "Browser notification when a block finishes",
  },
  weeklyRecap: {
    label: "Weekly recap",
    hint: "Sunday evening summary",
    defaultTime: "Sun 19:00",
  },
  goalAchieved: {
    label: "Goal achieved",
    hint: "Ping when the daily goal hits",
  },
  milestone: {
    label: "Milestones",
    hint: "7/30/100-day streaks, 25/50/100 problems",
  },
};

export const DEFAULT_NOTIFICATION_PREFS: NotificationPrefs = {
  streakReminder: true,
  streakAtRisk: true,
  dailyRevision: true,
  pomodoroEnd: true,
  weeklyRecap: true,
  goalAchieved: true,
  milestone: true,
};

export function mergePrefs(
  stored?: Partial<NotificationPrefs> | null
): NotificationPrefs {
  return { ...DEFAULT_NOTIFICATION_PREFS, ...(stored ?? {}) };
}

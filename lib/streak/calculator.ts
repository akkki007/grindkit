export type DayKey = string; // YYYY-MM-DD (local time)

export type DayActivity = {
  date: DayKey;
  dsaMinutes: number;
  devMinutes: number;
  learningMinutes: number;
  problemsSolved: number;
};

export type StreakStats = {
  current: number;
  longest: number;
  activeToday: boolean;
  graceUsedThisWeek: number;
  daysUntilGraceReset: number;
};

const DSA_MINUTES_THRESHOLD = 25;
const GRACE_PER_WEEK = 1;

export function toDayKey(d: Date): DayKey {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, "0");
  const day = d.getDate().toString().padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function isActive(day: DayActivity): boolean {
  return day.problemsSolved > 0 || day.dsaMinutes >= DSA_MINUTES_THRESHOLD;
}

/**
 * Compute streak stats from a day-keyed activity map.
 * `days` must cover enough history to trace the streak (~90d is plenty).
 */
export function computeStreak(
  days: Map<DayKey, DayActivity>,
  now = new Date()
): StreakStats {
  const todayKey = toDayKey(now);
  const today = days.get(todayKey);
  const activeToday = today ? isActive(today) : false;

  let current = 0;
  const cursor = new Date(now);
  if (!activeToday) {
    // Allow yesterday to be the trailing day without breaking the streak
    cursor.setDate(cursor.getDate() - 1);
  }

  const weekGraceWindow: number[] = []; // timestamps (days ago) of grace uses

  while (true) {
    const key = toDayKey(cursor);
    const day = days.get(key);
    const active = day ? isActive(day) : false;

    if (active) {
      current++;
    } else {
      // Is a grace day available in the trailing 7-day window?
      const daysAgo = Math.floor(
        (now.getTime() - cursor.getTime()) / (1000 * 60 * 60 * 24)
      );
      const graceUsedInWindow = weekGraceWindow.filter(
        (g) => Math.abs(g - daysAgo) < 7
      ).length;
      if (graceUsedInWindow < GRACE_PER_WEEK) {
        weekGraceWindow.push(daysAgo);
        current++;
      } else {
        break;
      }
    }

    cursor.setDate(cursor.getDate() - 1);
    if (current > 10_000) break; // safety
  }

  const longest = computeLongest(days);
  const graceUsedThisWeek = weekGraceWindow.filter((g) => g < 7).length;
  const daysUntilGraceReset = graceUsedThisWeek > 0 ? 7 - weekGraceWindow[0] : 0;

  return {
    current,
    longest,
    activeToday,
    graceUsedThisWeek,
    daysUntilGraceReset,
  };
}

function computeLongest(days: Map<DayKey, DayActivity>): number {
  if (days.size === 0) return 0;
  const keys = Array.from(days.keys()).sort();
  let longest = 0;
  let run = 0;
  let prev: Date | null = null;
  for (const key of keys) {
    const day = days.get(key)!;
    if (!isActive(day)) {
      run = 0;
      prev = null;
      continue;
    }
    const d = new Date(`${key}T00:00:00`);
    if (prev) {
      const diff = Math.round(
        (d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24)
      );
      run = diff === 1 ? run + 1 : 1;
    } else {
      run = 1;
    }
    longest = Math.max(longest, run);
    prev = d;
  }
  return longest;
}

export function emptyDay(date: DayKey): DayActivity {
  return {
    date,
    dsaMinutes: 0,
    devMinutes: 0,
    learningMinutes: 0,
    problemsSolved: 0,
  };
}

export const APPWRITE_ENDPOINT =
  process.env.NEXT_PUBLIC_APPWRITE_ENDPOINT ?? "https://cloud.appwrite.io/v1";
export const APPWRITE_PROJECT_ID =
  process.env.NEXT_PUBLIC_APPWRITE_PROJECT_ID ?? "";
export const APPWRITE_DATABASE_ID =
  process.env.NEXT_PUBLIC_APPWRITE_DATABASE_ID ?? "grindkit";

export const SESSION_COOKIE = "grindkit_session";

export const COLLECTIONS = {
  users: "users",
  patterns: "patterns",
  problemLibrary: "problem_library",
  problems: "problems",
  sessions: "sessions",
  projects: "projects",
  tasks: "tasks",
  dailyLogs: "daily_logs",
  notificationsLog: "notifications_log",
} as const;

/**
 * Per-user cache tag helpers. Kept in their own module (no `server-only`,
 * no SDK imports) so Server Actions can reference them without dragging the
 * server-only data layer into the client module graph.
 */
export const cacheTags = {
  problems: (userId: string) => `problems:${userId}`,
  sessions: (userId: string) => `sessions:${userId}`,
  projects: (userId: string) => `projects:${userId}`,
  tasks: (userId: string) => `tasks:${userId}`,
  user: (userId: string) => `user:${userId}`,
};

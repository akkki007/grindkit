import { z } from "zod";

export const signupSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(64),
    email: z.string().email("Invalid email"),
    password: z.string().min(8, "Minimum 8 characters").max(256),
  });

export const loginSchema = z.object({
  email: z.string().email("Invalid email"),
  password: z.string().min(1, "Password required"),
});

export type SignupInput = z.infer<typeof signupSchema>;
export type LoginInput = z.infer<typeof loginSchema>;

export const difficultyEnum = z.enum(["easy", "medium", "hard"]);
export const platformEnum = z.enum(["leetcode", "neetcode", "hackerrank", "gfg", "codeforces", "custom"]);
export const phaseEnum = z.enum(["foundation", "core", "advanced"]);
export const problemStatusEnum = z.enum(["attempted", "solved", "revisiting"]);
export const sessionTypeEnum = z.enum(["dsa", "dev", "learning"]);
export const taskStatusEnum = z.enum(["backlog", "in_progress", "done"]);
export const projectStatusEnum = z.enum(["active", "paused", "done", "archived"]);

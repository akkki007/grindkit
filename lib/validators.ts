import { z } from "zod";

/**
 * A URL that must use http(s). Blocks `javascript:`, `data:`, `vbscript:`,
 * `file:` etc. which would otherwise pass z.string().url() and become
 * XSS-via-link when rendered as an <a href>.
 */
export const httpUrlSchema = z
  .string()
  .trim()
  .url()
  .refine(
    (u) => /^https?:\/\//i.test(u),
    "URL must start with http:// or https://"
  );

export const httpUrlOrEmpty = httpUrlSchema.or(z.literal("")).optional();

/**
 * Safe for direct use as an href value. If the URL isn't http(s), returns
 * undefined so we simply don't render the link instead of opening a bad one.
 */
export function safeHref(value: string | null | undefined): string | undefined {
  if (!value) return undefined;
  try {
    const url = new URL(value);
    if (url.protocol === "http:" || url.protocol === "https:") return value;
  } catch {
    // fallthrough
  }
  return undefined;
}

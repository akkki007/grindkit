export type ProfileKey =
  | "leetcode"
  | "neetcode"
  | "codeforces"
  | "codechef"
  | "hackerrank"
  | "gfg"
  | "github"
  | "hashnode"
  | "linkedin";

export type Profiles = Partial<Record<ProfileKey, string>>;

export const PROFILE_META: Record<
  ProfileKey,
  { label: string; placeholder: string; short: string }
> = {
  leetcode: {
    label: "LeetCode",
    short: "LC",
    placeholder: "https://leetcode.com/u/your-handle",
  },
  neetcode: {
    label: "NeetCode",
    short: "NC",
    placeholder: "https://neetcode.io/u/your-handle",
  },
  codeforces: {
    label: "Codeforces",
    short: "CF",
    placeholder: "https://codeforces.com/profile/your-handle",
  },
  codechef: {
    label: "CodeChef",
    short: "CC",
    placeholder: "https://www.codechef.com/users/your-handle",
  },
  hackerrank: {
    label: "HackerRank",
    short: "HR",
    placeholder: "https://www.hackerrank.com/profile/your-handle",
  },
  gfg: {
    label: "GeeksforGeeks",
    short: "GFG",
    placeholder: "https://www.geeksforgeeks.org/user/your-handle",
  },
  github: {
    label: "GitHub",
    short: "GH",
    placeholder: "https://github.com/your-handle",
  },
  hashnode: {
    label: "Hashnode",
    short: "HN",
    placeholder: "https://hashnode.com/@your-handle",
  },
  linkedin: {
    label: "LinkedIn",
    short: "IN",
    placeholder: "https://www.linkedin.com/in/your-handle",
  },
};

export const PROFILE_KEYS: readonly ProfileKey[] = [
  "leetcode",
  "neetcode",
  "codeforces",
  "codechef",
  "hackerrank",
  "gfg",
  "github",
  "hashnode",
  "linkedin",
] as const;

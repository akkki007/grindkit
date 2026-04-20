export type Phase = "foundation" | "core" | "advanced";

export type Pattern = {
  slug: string;
  name: string;
  order: number;
  totalProblems: number;
  phase: Phase;
};

export const PATTERNS: readonly Pattern[] = [
  { slug: "arrays-hashing", name: "Arrays & Hashing", order: 1, totalProblems: 9, phase: "foundation" },
  { slug: "two-pointers", name: "Two Pointers", order: 2, totalProblems: 5, phase: "foundation" },
  { slug: "sliding-window", name: "Sliding Window", order: 3, totalProblems: 6, phase: "foundation" },
  { slug: "stack", name: "Stack", order: 4, totalProblems: 7, phase: "foundation" },
  { slug: "binary-search", name: "Binary Search", order: 5, totalProblems: 7, phase: "core" },
  { slug: "linked-list", name: "Linked List", order: 6, totalProblems: 11, phase: "core" },
  { slug: "trees", name: "Trees", order: 7, totalProblems: 15, phase: "core" },
  { slug: "tries", name: "Tries", order: 8, totalProblems: 3, phase: "core" },
  { slug: "heap-priority-queue", name: "Heap / Priority Queue", order: 9, totalProblems: 7, phase: "core" },
  { slug: "backtracking", name: "Backtracking", order: 10, totalProblems: 9, phase: "core" },
  { slug: "graphs", name: "Graphs", order: 11, totalProblems: 13, phase: "advanced" },
  { slug: "advanced-graphs", name: "Advanced Graphs", order: 12, totalProblems: 6, phase: "advanced" },
  { slug: "dp-1d", name: "1-D Dynamic Programming", order: 13, totalProblems: 12, phase: "advanced" },
  { slug: "dp-2d", name: "2-D Dynamic Programming", order: 14, totalProblems: 11, phase: "advanced" },
  { slug: "greedy", name: "Greedy", order: 15, totalProblems: 8, phase: "advanced" },
  { slug: "intervals", name: "Intervals", order: 16, totalProblems: 6, phase: "advanced" },
  { slug: "math-geometry", name: "Math & Geometry", order: 17, totalProblems: 8, phase: "advanced" },
  { slug: "bit-manipulation", name: "Bit Manipulation", order: 18, totalProblems: 7, phase: "advanced" },
] as const;

export const PHASE_META: Record<Phase, { label: string; order: number; total: number }> = {
  foundation: { label: "Foundation", order: 1, total: 27 },
  core: { label: "Core", order: 2, total: 52 },
  advanced: { label: "Advanced", order: 3, total: 71 },
};

export function patternBySlug(slug: string): Pattern | undefined {
  return PATTERNS.find((p) => p.slug === slug);
}

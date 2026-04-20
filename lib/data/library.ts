export type Difficulty = "easy" | "medium" | "hard";
export type Platform = "leetcode" | "neetcode" | "hackerrank" | "gfg" | "codeforces";
export type SourceList = "neetcode-150" | "blind-75" | "lc-top-interview-150" | "hackerrank-kit" | "striver-sheet";

export type LibraryProblem = {
  slug: string;
  title: string;
  difficulty: Difficulty;
  patternSlug: string;
  platform: Platform;
  url: string;
  sourceLists: SourceList[];
};

const lc = (slug: string) => `https://leetcode.com/problems/${slug}/`;

type Row = [title: string, lcSlug: string, difficulty: Difficulty, patternSlug: string];

const ROWS: Row[] = [
  // Arrays & Hashing (9)
  ["Contains Duplicate", "contains-duplicate", "easy", "arrays-hashing"],
  ["Valid Anagram", "valid-anagram", "easy", "arrays-hashing"],
  ["Two Sum", "two-sum", "easy", "arrays-hashing"],
  ["Group Anagrams", "group-anagrams", "medium", "arrays-hashing"],
  ["Top K Frequent Elements", "top-k-frequent-elements", "medium", "arrays-hashing"],
  ["Encode and Decode Strings", "encode-and-decode-strings", "medium", "arrays-hashing"],
  ["Product of Array Except Self", "product-of-array-except-self", "medium", "arrays-hashing"],
  ["Valid Sudoku", "valid-sudoku", "medium", "arrays-hashing"],
  ["Longest Consecutive Sequence", "longest-consecutive-sequence", "medium", "arrays-hashing"],

  // Two Pointers (5)
  ["Valid Palindrome", "valid-palindrome", "easy", "two-pointers"],
  ["Two Sum II - Input Array Is Sorted", "two-sum-ii-input-array-is-sorted", "medium", "two-pointers"],
  ["3Sum", "3sum", "medium", "two-pointers"],
  ["Container With Most Water", "container-with-most-water", "medium", "two-pointers"],
  ["Trapping Rain Water", "trapping-rain-water", "hard", "two-pointers"],

  // Sliding Window (6)
  ["Best Time to Buy and Sell Stock", "best-time-to-buy-and-sell-stock", "easy", "sliding-window"],
  ["Longest Substring Without Repeating Characters", "longest-substring-without-repeating-characters", "medium", "sliding-window"],
  ["Longest Repeating Character Replacement", "longest-repeating-character-replacement", "medium", "sliding-window"],
  ["Permutation in String", "permutation-in-string", "medium", "sliding-window"],
  ["Minimum Window Substring", "minimum-window-substring", "hard", "sliding-window"],
  ["Sliding Window Maximum", "sliding-window-maximum", "hard", "sliding-window"],

  // Stack (7)
  ["Valid Parentheses", "valid-parentheses", "easy", "stack"],
  ["Min Stack", "min-stack", "medium", "stack"],
  ["Evaluate Reverse Polish Notation", "evaluate-reverse-polish-notation", "medium", "stack"],
  ["Generate Parentheses", "generate-parentheses", "medium", "stack"],
  ["Daily Temperatures", "daily-temperatures", "medium", "stack"],
  ["Car Fleet", "car-fleet", "medium", "stack"],
  ["Largest Rectangle in Histogram", "largest-rectangle-in-histogram", "hard", "stack"],

  // Binary Search (7)
  ["Binary Search", "binary-search", "easy", "binary-search"],
  ["Search a 2D Matrix", "search-a-2d-matrix", "medium", "binary-search"],
  ["Koko Eating Bananas", "koko-eating-bananas", "medium", "binary-search"],
  ["Find Minimum in Rotated Sorted Array", "find-minimum-in-rotated-sorted-array", "medium", "binary-search"],
  ["Search in Rotated Sorted Array", "search-in-rotated-sorted-array", "medium", "binary-search"],
  ["Time Based Key-Value Store", "time-based-key-value-store", "medium", "binary-search"],
  ["Median of Two Sorted Arrays", "median-of-two-sorted-arrays", "hard", "binary-search"],

  // Linked List (11)
  ["Reverse Linked List", "reverse-linked-list", "easy", "linked-list"],
  ["Merge Two Sorted Lists", "merge-two-sorted-lists", "easy", "linked-list"],
  ["Reorder List", "reorder-list", "medium", "linked-list"],
  ["Remove Nth Node From End of List", "remove-nth-node-from-end-of-list", "medium", "linked-list"],
  ["Copy List with Random Pointer", "copy-list-with-random-pointer", "medium", "linked-list"],
  ["Add Two Numbers", "add-two-numbers", "medium", "linked-list"],
  ["Linked List Cycle", "linked-list-cycle", "easy", "linked-list"],
  ["Find the Duplicate Number", "find-the-duplicate-number", "medium", "linked-list"],
  ["LRU Cache", "lru-cache", "medium", "linked-list"],
  ["Merge k Sorted Lists", "merge-k-sorted-lists", "hard", "linked-list"],
  ["Reverse Nodes in k-Group", "reverse-nodes-in-k-group", "hard", "linked-list"],

  // Trees (15)
  ["Invert Binary Tree", "invert-binary-tree", "easy", "trees"],
  ["Maximum Depth of Binary Tree", "maximum-depth-of-binary-tree", "easy", "trees"],
  ["Diameter of Binary Tree", "diameter-of-binary-tree", "easy", "trees"],
  ["Balanced Binary Tree", "balanced-binary-tree", "easy", "trees"],
  ["Same Tree", "same-tree", "easy", "trees"],
  ["Subtree of Another Tree", "subtree-of-another-tree", "easy", "trees"],
  ["Lowest Common Ancestor of a Binary Search Tree", "lowest-common-ancestor-of-a-binary-search-tree", "medium", "trees"],
  ["Binary Tree Level Order Traversal", "binary-tree-level-order-traversal", "medium", "trees"],
  ["Binary Tree Right Side View", "binary-tree-right-side-view", "medium", "trees"],
  ["Count Good Nodes in Binary Tree", "count-good-nodes-in-binary-tree", "medium", "trees"],
  ["Validate Binary Search Tree", "validate-binary-search-tree", "medium", "trees"],
  ["Kth Smallest Element in a BST", "kth-smallest-element-in-a-bst", "medium", "trees"],
  ["Construct Binary Tree from Preorder and Inorder Traversal", "construct-binary-tree-from-preorder-and-inorder-traversal", "medium", "trees"],
  ["Binary Tree Maximum Path Sum", "binary-tree-maximum-path-sum", "hard", "trees"],
  ["Serialize and Deserialize Binary Tree", "serialize-and-deserialize-binary-tree", "hard", "trees"],

  // Tries (3)
  ["Implement Trie (Prefix Tree)", "implement-trie-prefix-tree", "medium", "tries"],
  ["Design Add and Search Words Data Structure", "design-add-and-search-words-data-structure", "medium", "tries"],
  ["Word Search II", "word-search-ii", "hard", "tries"],

  // Heap / Priority Queue (7)
  ["Kth Largest Element in a Stream", "kth-largest-element-in-a-stream", "easy", "heap-priority-queue"],
  ["Last Stone Weight", "last-stone-weight", "easy", "heap-priority-queue"],
  ["K Closest Points to Origin", "k-closest-points-to-origin", "medium", "heap-priority-queue"],
  ["Kth Largest Element in an Array", "kth-largest-element-in-an-array", "medium", "heap-priority-queue"],
  ["Task Scheduler", "task-scheduler", "medium", "heap-priority-queue"],
  ["Design Twitter", "design-twitter", "medium", "heap-priority-queue"],
  ["Find Median from Data Stream", "find-median-from-data-stream", "hard", "heap-priority-queue"],

  // Backtracking (9)
  ["Subsets", "subsets", "medium", "backtracking"],
  ["Combination Sum", "combination-sum", "medium", "backtracking"],
  ["Permutations", "permutations", "medium", "backtracking"],
  ["Subsets II", "subsets-ii", "medium", "backtracking"],
  ["Combination Sum II", "combination-sum-ii", "medium", "backtracking"],
  ["Word Search", "word-search", "medium", "backtracking"],
  ["Palindrome Partitioning", "palindrome-partitioning", "medium", "backtracking"],
  ["Letter Combinations of a Phone Number", "letter-combinations-of-a-phone-number", "medium", "backtracking"],
  ["N-Queens", "n-queens", "hard", "backtracking"],

  // Graphs (13)
  ["Number of Islands", "number-of-islands", "medium", "graphs"],
  ["Max Area of Island", "max-area-of-island", "medium", "graphs"],
  ["Clone Graph", "clone-graph", "medium", "graphs"],
  ["Walls and Gates", "walls-and-gates", "medium", "graphs"],
  ["Rotting Oranges", "rotting-oranges", "medium", "graphs"],
  ["Pacific Atlantic Water Flow", "pacific-atlantic-water-flow", "medium", "graphs"],
  ["Surrounded Regions", "surrounded-regions", "medium", "graphs"],
  ["Course Schedule", "course-schedule", "medium", "graphs"],
  ["Course Schedule II", "course-schedule-ii", "medium", "graphs"],
  ["Graph Valid Tree", "graph-valid-tree", "medium", "graphs"],
  ["Number of Connected Components in an Undirected Graph", "number-of-connected-components-in-an-undirected-graph", "medium", "graphs"],
  ["Redundant Connection", "redundant-connection", "medium", "graphs"],
  ["Word Ladder", "word-ladder", "hard", "graphs"],

  // Advanced Graphs (6)
  ["Reconstruct Itinerary", "reconstruct-itinerary", "hard", "advanced-graphs"],
  ["Min Cost to Connect All Points", "min-cost-to-connect-all-points", "medium", "advanced-graphs"],
  ["Network Delay Time", "network-delay-time", "medium", "advanced-graphs"],
  ["Swim in Rising Water", "swim-in-rising-water", "hard", "advanced-graphs"],
  ["Alien Dictionary", "alien-dictionary", "hard", "advanced-graphs"],
  ["Cheapest Flights Within K Stops", "cheapest-flights-within-k-stops", "medium", "advanced-graphs"],

  // 1-D Dynamic Programming (12)
  ["Climbing Stairs", "climbing-stairs", "easy", "dp-1d"],
  ["Min Cost Climbing Stairs", "min-cost-climbing-stairs", "easy", "dp-1d"],
  ["House Robber", "house-robber", "medium", "dp-1d"],
  ["House Robber II", "house-robber-ii", "medium", "dp-1d"],
  ["Longest Palindromic Substring", "longest-palindromic-substring", "medium", "dp-1d"],
  ["Palindromic Substrings", "palindromic-substrings", "medium", "dp-1d"],
  ["Decode Ways", "decode-ways", "medium", "dp-1d"],
  ["Coin Change", "coin-change", "medium", "dp-1d"],
  ["Maximum Product Subarray", "maximum-product-subarray", "medium", "dp-1d"],
  ["Word Break", "word-break", "medium", "dp-1d"],
  ["Longest Increasing Subsequence", "longest-increasing-subsequence", "medium", "dp-1d"],
  ["Partition Equal Subset Sum", "partition-equal-subset-sum", "medium", "dp-1d"],

  // 2-D Dynamic Programming (11)
  ["Unique Paths", "unique-paths", "medium", "dp-2d"],
  ["Longest Common Subsequence", "longest-common-subsequence", "medium", "dp-2d"],
  ["Best Time to Buy and Sell Stock with Cooldown", "best-time-to-buy-and-sell-stock-with-cooldown", "medium", "dp-2d"],
  ["Coin Change II", "coin-change-ii", "medium", "dp-2d"],
  ["Target Sum", "target-sum", "medium", "dp-2d"],
  ["Interleaving String", "interleaving-string", "medium", "dp-2d"],
  ["Longest Increasing Path in a Matrix", "longest-increasing-path-in-a-matrix", "hard", "dp-2d"],
  ["Distinct Subsequences", "distinct-subsequences", "hard", "dp-2d"],
  ["Edit Distance", "edit-distance", "medium", "dp-2d"],
  ["Burst Balloons", "burst-balloons", "hard", "dp-2d"],
  ["Regular Expression Matching", "regular-expression-matching", "hard", "dp-2d"],

  // Greedy (8)
  ["Maximum Subarray", "maximum-subarray", "medium", "greedy"],
  ["Jump Game", "jump-game", "medium", "greedy"],
  ["Jump Game II", "jump-game-ii", "medium", "greedy"],
  ["Gas Station", "gas-station", "medium", "greedy"],
  ["Hand of Straights", "hand-of-straights", "medium", "greedy"],
  ["Merge Triplets to Form Target Triplet", "merge-triplets-to-form-target-triplet", "medium", "greedy"],
  ["Partition Labels", "partition-labels", "medium", "greedy"],
  ["Valid Parenthesis String", "valid-parenthesis-string", "medium", "greedy"],

  // Intervals (6)
  ["Insert Interval", "insert-interval", "medium", "intervals"],
  ["Merge Intervals", "merge-intervals", "medium", "intervals"],
  ["Non-overlapping Intervals", "non-overlapping-intervals", "medium", "intervals"],
  ["Meeting Rooms", "meeting-rooms", "easy", "intervals"],
  ["Meeting Rooms II", "meeting-rooms-ii", "medium", "intervals"],
  ["Minimum Interval to Include Each Query", "minimum-interval-to-include-each-query", "hard", "intervals"],

  // Math & Geometry (8)
  ["Rotate Image", "rotate-image", "medium", "math-geometry"],
  ["Spiral Matrix", "spiral-matrix", "medium", "math-geometry"],
  ["Set Matrix Zeroes", "set-matrix-zeroes", "medium", "math-geometry"],
  ["Happy Number", "happy-number", "easy", "math-geometry"],
  ["Plus One", "plus-one", "easy", "math-geometry"],
  ["Pow(x, n)", "powx-n", "medium", "math-geometry"],
  ["Multiply Strings", "multiply-strings", "medium", "math-geometry"],
  ["Detect Squares", "detect-squares", "medium", "math-geometry"],

  // Bit Manipulation (7)
  ["Single Number", "single-number", "easy", "bit-manipulation"],
  ["Number of 1 Bits", "number-of-1-bits", "easy", "bit-manipulation"],
  ["Counting Bits", "counting-bits", "easy", "bit-manipulation"],
  ["Reverse Bits", "reverse-bits", "easy", "bit-manipulation"],
  ["Missing Number", "missing-number", "easy", "bit-manipulation"],
  ["Sum of Two Integers", "sum-of-two-integers", "medium", "bit-manipulation"],
  ["Reverse Integer", "reverse-integer", "medium", "bit-manipulation"],
];

const BLIND_75_SLUGS = new Set<string>([
  "two-sum",
  "best-time-to-buy-and-sell-stock",
  "contains-duplicate",
  "product-of-array-except-self",
  "maximum-subarray",
  "maximum-product-subarray",
  "find-minimum-in-rotated-sorted-array",
  "search-in-rotated-sorted-array",
  "3sum",
  "container-with-most-water",
  "sum-of-two-integers",
  "number-of-1-bits",
  "counting-bits",
  "missing-number",
  "reverse-bits",
  "climbing-stairs",
  "coin-change",
  "longest-increasing-subsequence",
  "longest-common-subsequence",
  "word-break",
  "combination-sum",
  "house-robber",
  "house-robber-ii",
  "decode-ways",
  "unique-paths",
  "jump-game",
  "clone-graph",
  "course-schedule",
  "pacific-atlantic-water-flow",
  "number-of-islands",
  "longest-consecutive-sequence",
  "alien-dictionary",
  "graph-valid-tree",
  "number-of-connected-components-in-an-undirected-graph",
  "insert-interval",
  "merge-intervals",
  "non-overlapping-intervals",
  "meeting-rooms",
  "meeting-rooms-ii",
  "reverse-linked-list",
  "linked-list-cycle",
  "merge-two-sorted-lists",
  "merge-k-sorted-lists",
  "remove-nth-node-from-end-of-list",
  "reorder-list",
  "set-matrix-zeroes",
  "spiral-matrix",
  "rotate-image",
  "longest-substring-without-repeating-characters",
  "longest-repeating-character-replacement",
  "minimum-window-substring",
  "valid-anagram",
  "group-anagrams",
  "valid-parentheses",
  "valid-palindrome",
  "longest-palindromic-substring",
  "palindromic-substrings",
  "encode-and-decode-strings",
  "maximum-depth-of-binary-tree",
  "same-tree",
  "invert-binary-tree",
  "binary-tree-maximum-path-sum",
  "binary-tree-level-order-traversal",
  "serialize-and-deserialize-binary-tree",
  "subtree-of-another-tree",
  "construct-binary-tree-from-preorder-and-inorder-traversal",
  "validate-binary-search-tree",
  "kth-smallest-element-in-a-bst",
  "lowest-common-ancestor-of-a-binary-search-tree",
  "implement-trie-prefix-tree",
  "design-add-and-search-words-data-structure",
  "word-search-ii",
  "top-k-frequent-elements",
  "find-median-from-data-stream",
]);

export const LIBRARY: readonly LibraryProblem[] = ROWS.map(
  ([title, slug, difficulty, patternSlug]) => {
    const sourceLists: SourceList[] = ["neetcode-150"];
    if (BLIND_75_SLUGS.has(slug)) sourceLists.push("blind-75");
    return {
      slug,
      title,
      difficulty,
      patternSlug,
      platform: "leetcode" as const,
      url: lc(slug),
      sourceLists,
    };
  }
);

export const DIFFICULTY_META: Record<Difficulty, { label: string }> = {
  easy: { label: "Easy" },
  medium: { label: "Medium" },
  hard: { label: "Hard" },
};

export const PLATFORM_META: Record<Platform, { label: string }> = {
  leetcode: { label: "LeetCode" },
  neetcode: { label: "NeetCode" },
  hackerrank: { label: "HackerRank" },
  gfg: { label: "GFG" },
  codeforces: { label: "Codeforces" },
};

export const SOURCE_LIST_META: Record<SourceList, { label: string; short: string }> = {
  "neetcode-150": { label: "NeetCode 150", short: "NC150" },
  "blind-75": { label: "Blind 75", short: "Blind75" },
  "lc-top-interview-150": { label: "LC Top Interview 150", short: "LC150" },
  "hackerrank-kit": { label: "HackerRank Kit", short: "HR" },
  "striver-sheet": { label: "Striver SDE Sheet", short: "Striver" },
};

export function libraryByPattern(patternSlug: string): LibraryProblem[] {
  return LIBRARY.filter((p) => p.patternSlug === patternSlug);
}

export function libraryBySlug(slug: string): LibraryProblem | undefined {
  return LIBRARY.find((p) => p.slug === slug);
}

# GrindKit

**Product Requirements Document**
*DSA + Dev Companion Web App · v1.0 · April 2026*

---

## 1. Overview

GrindKit is a minimalistic web app for tracking the daily grind of learning Data Structures & Algorithms while shipping development projects. It is a personal command center, not a code-execution platform — you solve problems on Leetcode, NeetCode, HackerRank, GFG, or Codeforces and log progress here.

The app is structured around the official **NeetCode 150 roadmap (18 patterns)** and combines: pattern-wise problem tracking, spaced repetition for revision, daily streaks, time tracking split by activity type, dev project Kanban, and progress analytics.

### 1.1 Problem Statement

Solo learners juggling DSA prep and dev projects have no single place to track both. Spreadsheets are friction; dedicated platforms are fragmented; nothing reinforces what you've already solved. Result: re-learning the same patterns, broken streaks, no visibility into what's actually working.

### 1.2 Goals

- Make the daily grind visible: streak, hours, problems-per-pattern at a glance.
- Force pattern-based learning by organizing all problems under NeetCode 150's 18 categories.
- Prevent forgetting via spaced repetition (SM-2 algorithm) on every solved problem.
- Show the DSA vs dev time split so balance is data-driven, not guesswork.
- Stay minimalistic: no feature bloat, no social features, no gamification beyond streaks.

### 1.3 Non-Goals (v1)

- In-app code execution / judge.
- Social features, leaderboards, friends.
- Auto-sync from Leetcode/HackerRank (manual logging only — pre-seeded library makes this fast).
- Native mobile app — responsive web only (PWA-installable on phone).

---

## 2. Target User

Primary: a single user (the developer) — a CS student / early-career engineer starting structured DSA prep in **C++** while continuing to build dev projects, comfortable with Next.js, who wants one source of truth for the journey.

---

## 3. Tech Stack

Aligned with the Portfolio Design System (Section 16). No additional UI / animation / icon libraries permitted.

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Backend:** **Appwrite Cloud** (auth + database + storage + functions)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **UI primitives:** **shadcn/ui** (style: `new-york`, baseColor: `neutral`, CSS variables: true), Radix UI
- **Theme:** `next-themes` with `attribute="class"`, `defaultTheme="system"`
- **State:** Zustand for client state, Server Components + Server Actions for server state
- **Forms:** `react-hook-form` + `zod`
- **Animation:** GSAP 3 (only for the theme toggle's circular reveal, per design system); plain Tailwind transitions for everything else
- **Charts:** Recharts
- **Calendar / Heatmap:** `react-activity-calendar` (GitHub-style)
- **Code editor / display:** Monaco editor for input, `shiki` for syntax-highlighted display
- **Drag & drop (Kanban):** `@dnd-kit/core`
- **Notifications:** Web Push API + `web-push` library + Appwrite Functions for scheduled delivery
- **Date utils:** `date-fns`
- **Icons:** `lucide-react` (UI affordances), `react-icons/si` (brand/tech logos), inline SVG (social icons with literal brand colors)
- **Utils:** `cn()` from `@/lib/utils` (clsx + tailwind-merge)
- **Path alias:** `@/*` → repo root
- **Fonts:** Space Grotesk (display), Geist Mono (body/code), Noto Serif JP (decorative kanji only) — no other fonts
- **Deployment:** **Vercel**
- **PWA:** `next-pwa` for installability + offline shell

---

## 4. NeetCode 150 Patterns (Seeded)

On first launch, the `patterns` collection is seeded with these 18 categories from the official NeetCode 150 roadmap. Total: **150 problems**.

| # | Pattern | Problems | Phase |
|---|---|---|---|
| 1 | Arrays & Hashing | 9 | Foundation |
| 2 | Two Pointers | 5 | Foundation |
| 3 | Sliding Window | 6 | Foundation |
| 4 | Stack | 7 | Foundation |
| 5 | Binary Search | 7 | Core |
| 6 | Linked List | 11 | Core |
| 7 | Trees | 15 | Core |
| 8 | Tries | 3 | Core |
| 9 | Heap / Priority Queue | 7 | Core |
| 10 | Backtracking | 9 | Core |
| 11 | Graphs | 13 | Advanced |
| 12 | Advanced Graphs | 6 | Advanced |
| 13 | 1-D Dynamic Programming | 12 | Advanced |
| 14 | 2-D Dynamic Programming | 11 | Advanced |
| 15 | Greedy | 8 | Advanced |
| 16 | Intervals | 6 | Advanced |
| 17 | Math & Geometry | 8 | Advanced |
| 18 | Bit Manipulation | 7 | Advanced |

Phase mapping drives the suggested learning order: **Foundation (27 problems) → Core (52) → Advanced (71)**.

---

## 5. Pre-Seeded Problem Library

A core differentiator. The `problem_library` collection ships with curated problems from major platforms, so logging is **search-and-pick**, not type-from-scratch.

### 5.1 Sources (v1 seed)

| Source | Count | Categorized By |
|---|---|---|
| **NeetCode 150** | 150 | NeetCode pattern (already mapped to our 18 categories) |
| **Blind 75** | 75 (subset of NeetCode 150, tagged) | Same categories |
| **LeetCode Top Interview 150** | 150 | Mapped to closest NeetCode pattern |
| **HackerRank Interview Preparation Kit** | ~70 | HackerRank's track names → mapped to our patterns |
| **GFG SDE Sheet (Striver)** | 191 | Striver's topic names → mapped to our patterns |

After dedup across sources, expect roughly **400-450 unique problems** in the library, each tagged with the platforms it appears on.

### 5.2 User Flow

1. User clicks **"+ Log Problem"** or hits `Cmd+K` → opens a command-palette-style search dialog.
2. Filter by: **Platform** (LeetCode, NeetCode, HackerRank, GFG), **Pattern/Category** (any of the 18), **Difficulty** (Easy / Medium / Hard), **Source list** (Blind 75, NeetCode 150, etc.).
3. Fuzzy search on title.
4. Click a problem → pre-filled form opens (title, URL, platform, difficulty, pattern already populated). User adds: confidence rating, code (Monaco editor, C++ default), notes (markdown), time taken.
5. Custom problems still supported via "+ Add Custom" if a problem isn't in the library.

### 5.3 Seed Data Pipeline

A one-time Node.js script at `scripts/seed-problems.ts` that:

- Pulls problem metadata from public sources (NeetCode roadmap JSON, Blind 75 GitHub repos, HackerRank track pages, public Striver sheet repos).
- Normalizes into our schema (title, url, platform, difficulty, patternSlug, sourceLists[], slug).
- Dedupes by normalized title + platform.
- Imports into Appwrite via the Node SDK using a server API key.
- Run once during project setup: `pnpm seed:problems`.

---

## 6. Authentication & Data Model

### 6.1 Auth (Appwrite Cloud + Next.js SSR)

- Email + password sign-up and login via Appwrite Account API.
- Session managed via **httpOnly cookies** (Appwrite SSR pattern with `node-appwrite` server SDK).
- `middleware.ts` checks session on protected routes (`/app/*`), redirects to `/login` if absent.
- Two SDK setups:
  - `lib/appwrite/client.ts` — browser SDK for client components.
  - `lib/appwrite/server.ts` — server SDK that reads session cookie, used in Server Components & Server Actions.
- Logout clears cookie via Server Action; account deletion handled in Settings.

### 6.2 Appwrite Collections

| Collection | Purpose | Key Attributes |
|---|---|---|
| `users` | Profile & stats | `userId`, `name`, `currentStreak`, `longestStreak`, `totalDsaMinutes`, `totalDevMinutes`, `dailyGoalProblems`, `dailyGoalMinutes`, `pushSubscription` (JSON), `joinedAt` |
| `patterns` | NeetCode 150 categories (seeded) | `name`, `slug`, `totalProblems`, `order`, `phase` |
| `problem_library` | Pre-seeded master problem list (shared, read-only) | `title`, `slug`, `url`, `platform`, `difficulty`, `patternSlug`, `sourceLists[]`, `tags[]` |
| `problems` | User's solved problem log | `userId`, `libraryId` (nullable for custom), `title`, `url`, `platform`, `difficulty`, `patternId`, `status`, `confidence` (1-5), `code`, `notes`, `timeTakenMin`, `solvedAt`, `nextReviewAt`, `reviewCount`, `easinessFactor`, `interval` |
| `sessions` | Time-tracked work blocks | `userId`, `type` (dsa/dev/learning), `durationMin`, `startedAt`, `endedAt`, `problemId?`, `projectId?`, `taskId?` |
| `projects` | Dev projects | `userId`, `name`, `description`, `status`, `color`, `createdAt` |
| `tasks` | Kanban tasks | `userId`, `projectId`, `title`, `status` (backlog/in_progress/done), `estimatedHours`, `actualHours`, `order`, `createdAt`, `completedAt` |
| `daily_logs` | Aggregated per-day stats | `userId`, `date`, `dsaMinutes`, `devMinutes`, `problemsSolved`, `streakDay` |
| `notifications_log` | Track sent notifications | `userId`, `type`, `sentAt`, `payload` |

**Permissions:**

- `problem_library`: read = `Role.users()`, write = restricted to seed script (uses API key).
- All other user-data collections: document-level `Permission.user(userId)` for read & write.

---

## 7. Routes & Information Architecture

Next.js App Router structure. Top nav with 5 links: **Home · Patterns · Revise · Projects · Analytics**. Timer is a persistent floating widget (bottom-right). Settings in user menu (top-right).

### 7.1 Route Map

```
/                         → Marketing/landing (or redirect to /app if logged in)
/login                    → Login form
/signup                   → Signup form
/app                      → Dashboard (default authenticated route)
/app/patterns             → All 18 patterns with progress
/app/patterns/[slug]      → Pattern detail (problems within)
/app/library              → Problem library browser with filters
/app/problems/new         → Manual log form (custom problem)
/app/problems/[id]        → Problem detail / edit
/app/revise               → Spaced repetition queue
/app/projects             → Projects list
/app/projects/[id]        → Kanban board for a project
/app/timer                → Full-screen Pomodoro (also as floating widget)
/app/analytics            → Charts & insights
/app/settings             → Profile, goals, notifications, account
```

### 7.2 Page Specs

| Route | Purpose | Key Components |
|---|---|---|
| `/login`, `/signup` | Appwrite email/password auth | shadcn Form, Input, Button |
| `/app` | Today at a glance | Streak card, today's hours (DSA vs Dev), problems due, active timer chip, next pattern card |
| `/app/patterns` | NeetCode 150 progress | Grid of 18 cards with progress bars, grouped by phase |
| `/app/patterns/[slug]` | Problems within a pattern | Tabs: "My Solved" / "From Library", '+ Log' button |
| `/app/library` | Browse & pick to log | Cmd+K dialog or full page; filter sidebar (platform, pattern, difficulty, source); virtualized list |
| `/app/problems/new` | Custom problem | Form with all fields editable |
| `/app/problems/[id]` | Edit / view | Pre-filled form, code in Monaco, notes in markdown |
| `/app/revise` | Spaced repetition | Card stack, click "Recalled" / "Forgot" buttons |
| `/app/projects` | Projects list | Cards with task counts, '+ New Project' |
| `/app/projects/[id]` | Kanban board | 3 columns, dnd-kit drag, quick-add task input per column |
| `/app/timer` | Pomodoro session | Type toggle (DSA/Dev/Learning), large timer, optional link to problem/task |
| `/app/analytics` | Progress visualisation | Heatmap, weekly hours chart, pattern distribution, streak history |
| `/app/settings` | Profile & app config | Profile, daily goal, notification toggles, theme, logout, delete account |

---

## 8. Core Feature Specs

### 8.1 Problem Logging (with Library)

- Click '+' or hit `Cmd+K` → opens Problem Library command palette.
- Filters: Platform · Pattern · Difficulty · Source List.
- Click a library problem → log form opens with metadata pre-filled.
- User adds: confidence (1-5 ★), code (Monaco editor with C++ syntax), notes (markdown), time taken.
- "+ Add Custom" option for problems not in the library.
- On save (Server Action): creates `problems` doc, computes `nextReviewAt` via SM-2, updates `daily_logs`, revalidates pattern progress.

### 8.2 Spaced Repetition (SM-2 simplified)

Each problem has `easinessFactor` (default 2.5), `interval` (days), `reviewCount`. On review:

- **Confidence 1-2 (Forgot)** → reset interval to 1 day, lower EF by 0.2.
- **Confidence 3 (Hard)** → interval × 1.2, EF unchanged.
- **Confidence 4-5 (Good/Easy)** → interval × EF, raise EF by 0.1 (cap 3.0).
- `nextReviewAt = today + interval days`. Surfaced in Revise tab.

### 8.3 Streak Logic

- Streak increments if **at least one problem logged OR 25+ DSA minutes recorded** on a given date.
- Computed from `daily_logs` at app open; cached in `users.currentStreak`.
- **Grace day:** 1 missed day per week is allowed without breaking streak (configurable in Settings).
- Computed server-side via Server Component on dashboard load.

### 8.4 Timer

- Default 25/5 Pomodoro. Type toggle: DSA, Dev, Learning.
- Persistent floating widget in bottom-right corner (shadcn Sheet collapsed).
- State managed in Zustand + persisted to `localStorage` so reload doesn't lose timer.
- On stop: Server Action creates a `sessions` doc.
- If linked to a problem (started from problem detail) → updates `problem.timeTakenMin`.
- Browser notification (with permission) fires when block ends, even if tab is in background.

### 8.5 Analytics

- **Heatmap:** `react-activity-calendar` showing 12 weeks coloured by total minutes per day.
- **Pattern distribution:** Recharts horizontal bar chart of solved-per-pattern.
- **Weekly hours:** Recharts stacked bar (DSA vs Dev) for last 7 days.
- **Weak topics:** any pattern with avg confidence < 3 across last 10 problems gets flagged with a callout.

---

## 9. Notifications

Two delivery channels: **in-browser** (when tab is open) and **Web Push** (when tab is closed, via service worker).

### 9.1 Notification Types

| Type | Trigger | Default Time | Toggleable |
|---|---|---|---|
| **Daily Streak Reminder** | If no activity logged by 8 PM local | 8:00 PM | Yes |
| **Streak About to Break** | 1 hour before midnight if no activity | 11:00 PM | Yes |
| **Daily Revision Reminder** | If problems are due in revise queue | 9:00 AM | Yes |
| **Pomodoro Session End** | When 25-min focus block ends | On event | Yes |
| **Pomodoro Break End** | When 5-min break ends | On event | Yes |
| **Weekly Recap** | Sunday evening summary | Sunday 7 PM | Yes |
| **Goal Achieved** | Hit daily goal (problems or minutes) | On event | Yes |
| **Milestone** | 7/30/100 day streak, 25/50/100 problems | On event | Yes |

### 9.2 Implementation

- **Browser notifications** via the standard `Notification` API for events while the tab is open (Pomodoro end, goal achieved).
- **Web Push** via service worker for scheduled / async events:
  - Frontend requests `PushManager.subscribe()` → stores subscription in `users.pushSubscription`.
  - Appwrite Function on a cron schedule checks per-user notification windows and sends push via `web-push` library using stored subscription + VAPID keys.
- Notification preferences stored in `users` collection, all togglable in Settings.
- `notifications_log` collection tracks sent notifications to prevent duplicates.

### 9.3 Permission Flow

- Asked on first visit to `/app` after login, with clear copy: *"GrindKit can remind you if your streak is at risk and when problems are due. Customizable anytime."*
- If declined, in-app banner on Home offers re-enabling.
- VAPID keys stored as env vars: `NEXT_PUBLIC_VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`.

### 9.4 PWA Installability

- Configured via `next-pwa` so the app can be installed on desktop and mobile home screens.
- Offline shell for the dashboard + revise pages (cached last fetched data).
- Manifest icon, theme color, name set up.

---

## 10. Design Principles

The full visual contract lives in **Section 16 — Portfolio Design System**. That document is authoritative; this section captures only product-level intent.

- **Minimalistic:** neutral palette + token-only colors. No gradients, glows, colored shadows, or decorative emoji.
- **System-default theme:** `next-themes` with `defaultTheme="system"`. Both modes work via CSS variables.
- **Numbers > words:** the dashboard surfaces numbers (streak, hours, problems) over prose.
- **One primary action per screen:** every screen has exactly one obvious CTA.
- **Friction-low logging:** logging from the library should take ≤ 15 seconds. `Cmd+K` from anywhere.
- **Typography:** Space Grotesk for headings (`font-display`), Geist Mono for body / code / meta (`font-mono`). No other fonts.
- **Keyboard-first:** core actions have shortcuts (`Cmd+K` library, `T` timer, `R` revise, `N` new problem).
- **Reuse before invent:** for any new list of items, reuse the project-card or blog-card structure from §16.6.

---

## 11. Project Structure

```
grindkit/
├── app/
│   ├── (marketing)/page.tsx           # Landing
│   ├── (auth)/login/page.tsx
│   ├── (auth)/signup/page.tsx
│   ├── app/
│   │   ├── layout.tsx                 # Authed shell w/ nav + timer widget
│   │   ├── page.tsx                   # Dashboard
│   │   ├── patterns/page.tsx
│   │   ├── patterns/[slug]/page.tsx
│   │   ├── library/page.tsx
│   │   ├── problems/new/page.tsx
│   │   ├── problems/[id]/page.tsx
│   │   ├── revise/page.tsx
│   │   ├── projects/page.tsx
│   │   ├── projects/[id]/page.tsx
│   │   ├── timer/page.tsx
│   │   ├── analytics/page.tsx
│   │   └── settings/page.tsx
│   └── api/                           # Web push endpoints if needed
├── components/
│   ├── ui/                            # shadcn components
│   ├── dashboard/
│   ├── problems/
│   ├── timer/
│   └── kanban/
├── lib/
│   ├── appwrite/
│   │   ├── client.ts                  # Browser SDK
│   │   ├── server.ts                  # Server SDK w/ session cookie
│   │   └── schemas.ts                 # Zod schemas matching collections
│   ├── srs/sm2.ts                     # Spaced repetition logic
│   ├── streak/calculator.ts
│   └── utils.ts
├── actions/                           # Server Actions
│   ├── problems.ts
│   ├── sessions.ts
│   ├── tasks.ts
│   └── notifications.ts
├── hooks/
├── store/                             # Zustand stores
├── public/
│   ├── sw.js                          # Service worker (web push)
│   └── manifest.json
├── scripts/
│   └── seed-problems.ts               # One-time library seeder
├── middleware.ts                      # Auth protection
└── next.config.ts
```

---

## 12. Build Phases (8 Weeks to v1)

### Week 1 — Foundation
- `create-next-app` with TS, Tailwind, App Router. Add shadcn/ui.
- Appwrite Cloud project, collections, attributes, indexes.
- Auth: signup, login, SSR session via cookies, middleware protection.
- Authed layout shell with nav.

### Week 2 — Patterns + Problem Library
- Seed `patterns` collection with NeetCode 150.
- Build seed script for `problem_library` (NeetCode 150 + Blind 75 first).
- Patterns page (grid grouped by phase).
- Library browser with filters + Cmd+K command palette.
- Add/Edit problem form (with library pre-fill path), Monaco editor.

### Week 3 — Timer + Sessions
- Pomodoro timer with type toggle.
- Floating widget + full-screen page.
- Zustand store with `localStorage` persistence.
- Browser notification on session end.

### Week 4 — Dashboard + Streak
- Daily logs aggregation (Server Component computes from sessions + problems).
- Streak computation + grace day logic.
- Dashboard cards.

### Week 5 — Spaced Repetition
- SM-2 algorithm utility (`lib/srs/sm2.ts`).
- Revise page UI: card stack.
- Mark recalled / forgot via Server Actions.

### Week 6 — Projects + Tasks
- Projects CRUD.
- Kanban board with `@dnd-kit/core`, optimistic updates.

### Week 7 — Analytics + Extended Library
- Heatmap calendar (`react-activity-calendar`).
- Recharts: weekly hours stacked bar, pattern distribution.
- Weak topic detection.
- Extend library: HackerRank Kit, GFG Sheet, LC Top Interview 150.

### Week 8 — Notifications + Polish + Deploy
- Service worker + Web Push setup, VAPID keys.
- Appwrite Function for scheduled notification cron.
- Permission flow, settings toggles.
- PWA manifest, icons, install prompt.
- Empty states, loading skeletons (Suspense), error boundaries.
- Deploy to Vercel, configure env vars, custom domain (optional).

---

## 13. Success Metrics (Personal)

- Solve 150 NeetCode problems within 6 months of launch.
- Maintain a 60+ day streak by month 3.
- App is opened daily — primary measure of stickiness.
- Average confidence on revision ≥ 3.5 by month 4 (proxy for actual retention).
- Problem logging takes ≤ 15 seconds (from library) or ≤ 60 seconds (custom).

---

## 14. Decided / Confirmed

- ✅ **Framework:** Next.js 16 (App Router) + React 19 + TypeScript strict
- ✅ **UI:** shadcn/ui (`new-york`, `neutral`) + Tailwind v4
- ✅ **Backend:** Appwrite Cloud
- ✅ **Deployment:** Vercel
- ✅ **Pre-seeded library:** LeetCode, NeetCode, HackerRank, GFG with category & platform filters
- ✅ **Notifications:** full suite via Web Push + service worker
- ✅ **PWA:** installable, offline shell
- ✅ **Design system:** locked — see Section 16. No new fonts, icon libraries, motion libraries, or color tokens may be introduced.
- ✅ **Theme:** `next-themes` with `defaultTheme="system"` (per design system)
- ✅ **Fonts:** Space Grotesk + Geist Mono + Noto Serif JP (decorative only)

## 15. Still To Decide

- Notification *exact* default times — current proposals (8 PM, 9 AM, etc.) feel right but personalize based on your routine.
- Whether to apply the `.kanji-bg` decorative kanji to GrindKit's hero (the design system supports it; choose a kanji like "鍛錬" / "tanren" — *forging / disciplined practice* — or skip).

---

## 16. Portfolio Design System

> The following is the authoritative visual & implementation contract for this app. It is embedded verbatim. Any UI work must follow these rules exactly. When in doubt, prefer existing tokens and classes over introducing new ones.

# Portfolio Design System

A strict style guide for this portfolio. Any agent editing UI must follow these rules exactly. When in doubt, prefer existing tokens and classes over introducing new ones.

---

## 1. Tech Stack

- **Framework:** Next.js 16 (App Router) + React 19 + TypeScript (strict)
- **Styling:** Tailwind CSS v4 via `@tailwindcss/postcss`
- **UI primitives:** shadcn/ui (style: `new-york`, baseColor: `neutral`, CSS variables: true), Radix UI
- **Theme:** `next-themes` with `attribute="class"`, `defaultTheme="system"`
- **Animation:** GSAP 3 (for scripted effects), plain Tailwind transitions for everything else
- **Icons:** `lucide-react` for UI affordances; `react-icons/si` for brand/tech logos; inline SVG for social icons with literal brand colors
- **Utils:** `cn()` from `@/lib/utils` (clsx + tailwind-merge). Always compose classes with `cn()` when conditionals are involved
- **Path alias:** `@/*` → repo root

Do not introduce additional animation, icon, or CSS-in-JS libraries.

---

## 2. Color Tokens (authoritative)

Colors are defined in `app/globals.css` as OKLCH CSS variables. **Never hardcode hex/rgb in components** — always reference tokens via Tailwind utilities (`bg-background`, `text-muted-foreground`, `border-border`, etc.).

### Light mode (`:root`)
```
--background:            oklch(1 0 0)
--foreground:            oklch(0.145 0 0)
--card:                  oklch(1 0 0)
--card-foreground:       oklch(0.145 0 0)
--primary:               oklch(0.205 0 0)
--primary-foreground:    oklch(0.985 0 0)
--secondary:             oklch(0.97 0 0)
--secondary-foreground:  oklch(0.205 0 0)
--muted:                 oklch(0.97 0 0)
--muted-foreground:      oklch(0.556 0 0)
--accent:                oklch(0.97 0 0)
--accent-foreground:     oklch(0.205 0 0)
--destructive:           oklch(0.577 0.245 27.325)
--border:                oklch(0.922 0 0)
--input:                 oklch(0.922 0 0)
--ring:                  oklch(0.708 0 0)
--radius:                0.625rem   /* 10px base */
```

### Dark mode (`.dark`)
```
--background:            oklch(0.145 0 0)
--foreground:            oklch(0.985 0 0)
--card:                  oklch(0.205 0 0)
--primary:               oklch(0.922 0 0)
--secondary:             oklch(0.269 0 0)
--muted:                 oklch(0.269 0 0)
--muted-foreground:      oklch(0.708 0 0)
--accent:                oklch(0.269 0 0)
--border:                oklch(1 0 0 / 10%)
--input:                 oklch(1 0 0 / 15%)
--ring:                  oklch(0.556 0 0)
```

### Permitted accent colors (literal, non-token)
Only these brand accents are allowed, and only where they already appear:
- Blog title hover: `text-blue-400`
- Contribution graph levels: `fill-muted`, `fill-blue-400/25`, `/50`, `/75`, `/100`
- Social icons (inline SVG): Mail `#EA4335`, LinkedIn `#0A66C2`, Hashnode `#2962FF`
- Tech icons (`react-icons/si`): use each library's brand color, except neutral/monochrome brands (Next.js, Express, Bun, Prisma) which use `className="fill-foreground"`

Do not add new named colors. New UI must compose from tokens + opacity modifiers (e.g. `border-border/50`, `bg-background/75`).

---

## 3. Typography

Three families — **do not add fonts**.

| Role | Font | CSS var | Tailwind class |
|---|---|---|---|
| Display / headings | Space Grotesk (300–700) | `--font-sans` | `font-display` |
| Body / code / metadata | Geist Mono (100–900) | `--font-mono` | `font-mono` |
| Decorative kanji only | Noto Serif JP (700) | `--font-japanese` | `font-japanese` |

### Rules
- **Headings (`h1`–`h6`):** Space Grotesk, `font-weight: 700`, `letter-spacing: -0.025em` (applied globally — do not override)
- **Body text default:** Geist Mono at `text-sm` (0.875rem / 14px), `line-height: 1.5`
- **Section title pattern:** `text-xl font-semibold tracking-tight` (display font)
- **Hero name:** `text-2xl sm:text-5xl font-bold tracking-tight`
- **Card title:** `font-display text-lg font-semibold tracking-tight` (projects) or `text-[15px]` (blogs)
- **Muted secondary text:** `font-mono text-sm text-muted-foreground`
- **Meta / badges / labels:** `font-mono text-[10px]` or `text-xs`, often `uppercase tracking-wider` for category labels
- **Numeric alignment:** use `tabular-nums` for durations, counters, timestamps
- **Wrapping:** `text-pretty` on descriptive prose, `line-clamp-3` on blog summaries

---

## 4. Spacing, Layout & Radius

### Page shell
- Root wrapper: `max-w-4xl mx-auto` with `.dotted-frame` (left/right dotted borders)
- Horizontal padding: `px-6` on every section
- Vertical rhythm between sections: `py-4`, `py-8`, `py-12`
- Section breaks: `.slant-divider` (40px tall 45° repeating stripes) between major sections
- Global container utility: `max-width: 896px; padding: 0 1.5rem; margin: 0 auto`

### Radii (Tailwind tokens derived from `--radius: 0.625rem`)
- `rounded-sm` (~4px), `rounded-md` (~6px) — default for buttons, badges
- `rounded-lg` (8px) — cards, larger surfaces
- `rounded-full` — avatars, pills
- Do not introduce custom pixel radii.

### Shadows & elevation
- Resting cards: `shadow-sm`
- Hover elevation: `hover:shadow-md`
- No other shadow utilities. No glow, no inset, no colored shadows.

### Borders
- Default: `border border-border`
- Subtle/internal dividers: `border-border/50`, `/20`, `/10`
- Dashed decorative container: apply `.plus-grid` (dashed border with corner `+` markers)
- Dotted vertical frame: apply `.dotted-frame`
- Do not use solid `border-black`/`border-white`.

---

## 5. Custom Utility Classes (globals.css)

Use these as-is; do not reimplement inline.

```
.dotted-frame      /* vertical dotted rails on left + right */
.slant-divider     /* 40px tall 45° striped separator */
.kanji-bg          /* 9rem Noto Serif JP, opacity 0.05, absolutely positioned */
.plus-grid         /* dashed border w/ pseudo-element '+' corner markers */
.plus-grid-inner   /* inner '+' markers */
.font-display      /* Space Grotesk */
.font-mono         /* Geist Mono */
.font-japanese     /* Noto Serif JP */
.container         /* max-w 896px wrapper */
```

---

## 6. Component Patterns (copy these exactly)

### Navbar
```
sticky top-0 z-50 mb-8 flex items-center justify-between
border-b border-border/20 bg-background/75 py-2 backdrop-blur-xs
```
- Nav links: `text-sm font-medium`, color transition to `text-foreground` on hover
- Active indicator: `absolute -bottom-1 left-0 right-0 h-0.5 bg-foreground rounded-full`
- Theme toggle button: `inline-flex items-center justify-center rounded-md p-2 size-9`
- Theme switch uses GSAP circular clip-path reveal (see §8)

### Hero
- Decorative kanji (e.g. "改善") positioned with `.kanji-bg`
- Avatar: `h-24 w-24 sm:h-44 sm:w-44 rounded-full ring-2 ring-border ring-offset-2`
- Name: `text-2xl sm:text-5xl font-bold tracking-tight`
- Role line: `font-mono text-sm text-muted-foreground`
- Social icons: inline SVGs with brand colors, `hover:opacity-80`

### Section title + body
```
<h2 class="text-xl font-semibold tracking-tight">…</h2>
<p class="font-mono text-sm text-muted-foreground text-pretty">…</p>
```

### Experience (accordion)
- Item wrapper: `group flex w-full items-center justify-between`, hover `hover:bg-muted/30`
- Logo: `h-8 w-8 rounded-full border border-border`
- Role: `text-base font-semibold text-foreground`
- Company / employment type: `font-mono text-xs sm:text-sm text-muted-foreground`
- Duration: `font-mono text-xs tabular-nums text-muted-foreground`
- Toggle icons: `ChevronUp` / `ChevronDown` (lucide)
- Skill chip:
  ```
  inline-flex items-center rounded-md border border-border/50 bg-muted
  px-2 py-0.5 text-[10px] font-semibold text-foreground
  ```
- Panel transition: `transition-all duration-200 ease-in-out` with `max-h-[32rem] opacity-100/0`
- Bulleted detail list: `list-disc pl-4 space-y-1.5 leading-relaxed`

### Project card
```
group flex flex-col overflow-hidden rounded-lg
border border-border/50 bg-card/50 p-3 text-card-foreground
shadow-sm transition-all duration-300 hover:shadow-md
sm:flex-row sm:items-start
```
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Image: `aspect-video rounded-md`, zoom on hover via `group-hover:scale-105`
- Title: `font-display text-lg font-semibold tracking-tight`
- Description: `font-mono text-sm leading-relaxed text-muted-foreground`
- Action button:
  ```
  inline-flex items-center gap-1.5 rounded-md border bg-background/50
  px-2 py-1 font-mono text-[10px] text-muted-foreground
  transition-colors hover:bg-background/80 hover:text-foreground sm:text-xs
  ```
- Tech tag:
  ```
  inline-flex items-center rounded-md border border-secondary-foreground/10
  bg-secondary/50 px-2 py-0.5 font-mono text-[10px] font-medium
  text-secondary-foreground hover:bg-secondary/70
  ```

### Blog card
```
group relative flex flex-col justify-between rounded-lg
border border-border/50 bg-card p-5
transition-all duration-300 hover:shadow-md hover:border-border
```
- Grid: `grid grid-cols-1 md:grid-cols-2 gap-4`
- Title hover: `group-hover:text-blue-400 transition-colors` (the one sanctioned accent)
- Meta: `text-[10px] font-mono text-muted-foreground whitespace-nowrap`
- Summary: `text-sm text-muted-foreground leading-relaxed font-mono line-clamp-3`
- "Read more" arrow: `group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5`

### Skills
- Category label: `text-[10px] uppercase tracking-wider text-muted-foreground` (mono)
- Skill chip:
  ```
  inline-flex items-center gap-1.5 rounded-md border border-border/50
  bg-background/50 px-2.5 py-2 font-mono text-[13px] font-medium
  leading-tight transition-colors hover:bg-muted/30
  ```
- Icon: `react-icons/si` preserving brand color; monochrome brands use `fill-foreground`

### Contact CTA
- Wrap in `.plus-grid`
- Heading: `text-3xl font-bold tracking-tight text-foreground sm:text-4xl`
- Subhead: `font-mono text-sm text-muted-foreground`
- Button (shadcn outline shape):
  ```
  inline-flex h-9 items-center justify-center rounded-md
  border border-input bg-background px-4 py-2 text-sm font-medium
  transition-colors hover:bg-accent hover:text-accent-foreground
  ```

### Footer
- Layout: `flex flex-col md:flex-row justify-between items-start md:items-center gap-6`
- Text: `text-[13px] text-muted-foreground font-mono leading-relaxed`
- Emphasis: `font-bold text-foreground`
- Numeric (visitor count, clock): `text-foreground font-bold tabular-nums`

### GitHub contribution graph
- Levels: `data-[level="0"]:fill-muted`, then `fill-blue-400/25 | /50 | /75 | /100`
- Wrapper: `overflow-x-auto overflow-y-hidden`
- Legend: 5-step gradient with "Less" / "More" labels

---

## 7. States: hover, focus, transitions

Consistency here matters more than novelty.

- **Hover text:** muted → foreground (`hover:text-foreground`)
- **Hover bg:** `hover:bg-muted`, `hover:bg-muted/30`, `hover:bg-accent`, or `hover:bg-background/80`
- **Hover elevation:** `hover:shadow-md` only; never `shadow-lg`+
- **Hover opacity:** `hover:opacity-80` for social/brand icons only
- **Hover scale:** `group-hover:scale-105` for card images only
- **Focus:** `focus-visible:ring-1 focus-visible:ring-ring` (never a colored ring)
- **Transition utilities:** `transition-colors`, `transition-all duration-200` or `duration-300`, `ease-in-out` for accordions
- **No** bouncy, elastic, or long (>500ms) CSS transitions.

---

## 8. Motion (GSAP)

GSAP is used **only** for the theme toggle's circular reveal:
- Create an overlay element at the toggle button's screen position
- Animate `clip-path: circle(0 at x y)` → `circle(150vmax at x y)`
- Duration `0.6s`, easing `power2.inOut`
- Sync with double `requestAnimationFrame` before the class swap

Do not add GSAP-driven scroll, parallax, or entrance animations. Everything else is Tailwind transitions.

---

## 9. Iconography rules

- UI affordances (chevrons, arrows, external-link, sun/moon, github): **lucide-react**
- Technology/brand logos inside Skills/Projects: **react-icons/si** with native brand color (monochrome brands → `fill-foreground`)
- Social links in hero/footer: hand-rolled inline SVG with the exact brand hex:
  - Mail `#EA4335`, LinkedIn `#0A66C2`, Hashnode `#2962FF`, GitHub (monochrome, uses `fill-foreground`)
- Icon size inline with text: `size-4` or `h-4 w-4`; larger hero icons `size-5`
- Never mix two icon libraries for the same semantic role in one component.

---

## 10. Theme switching

- Provider wraps the app in `app/layout.tsx`:
  ```tsx
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
  ```
- Toggle button uses GSAP circular reveal (§8), then flips `class="dark"` on `<html>`
- All components must read colors through tokens so both themes work automatically. Never write `if (theme === 'dark') …` in JSX for colors — let CSS variables do it.
- Body transitions: `transition: background-color 0.2s ease, color 0.2s ease` (already global)

---

## 11. Responsive rules

Mobile-first. Only these breakpoints are used:
- `sm:` 640px
- `md:` 768px
- `lg:` 1024px (rarely)
- `xl:` 1280px (rarely)

Common patterns:
- Hero name: `text-2xl sm:text-5xl`
- Cards: `flex-col sm:flex-row` or `grid-cols-1 md:grid-cols-2`
- Footer: `flex-col md:flex-row`

Avoid `xl:` / `2xl:` unless a specific layout demands it; the page is capped at `max-w-4xl` anyway.

---

## 12. Accessibility (non-negotiable)

- Every interactive non-text element carries `aria-label`
- Use semantic tags: `<nav>`, `<main>`, `<section>`, `<article>`, `<footer>`
- Visible focus state via `focus-visible:ring-1 focus-visible:ring-ring`
- All `<img>` require descriptive `alt`; decorative → `alt=""`
- Buttons default to `type="button"` unless submitting a form
- Preserve `sr-only` helpers for screen-reader-only text (e.g., theme toggle labels)

---

## 13. File / asset conventions

- Sections live in `components/sections/<name>.tsx` (kebab-case files, PascalCase exports)
- shadcn primitives live in `components/ui/`
- Local images go in `public/`; use `next/image` with explicit `alt`
- Remote images must be whitelisted in `next.config.ts` (Supabase, YouTube thumbnails)
- Never introduce new CSS files — extend `app/globals.css` only if absolutely needed, and only by adding a new utility class alongside the existing ones.

---

## 14. Do / Don't checklist for new UI

**Do**
- Compose with existing tokens (`bg-card`, `text-muted-foreground`, `border-border/50`)
- Use `font-mono` for body/meta, `font-display` for headings
- Pair `rounded-md` / `rounded-lg` with `border-border/50 shadow-sm`
- Reuse the project-card and blog-card structures for any new list of items
- Use `cn()` for conditional classes
- Keep animations to Tailwind `transition-*` at 200–300ms
- Keep text lengths tight; hero-ish prose gets `text-pretty`

**Don't**
- Don't hardcode colors, shadows, or radii outside tokens
- Don't add a new font, icon set, or motion library
- Don't use gradients, neon glows, colored shadows, or decorative emoji
- Don't write theme-conditional JSX — use CSS variables
- Don't exceed `max-w-4xl` at the page level
- Don't introduce `xl:`/`2xl:` breakpoints casually
- Don't add GSAP beyond the existing theme-toggle reveal

---

## 15. Minimal starter snippet (new section)

```tsx
<section className="px-6 py-8">
  <div className="mb-3 flex items-center justify-between">
    <h2 className="text-xl font-semibold tracking-tight">Section Title</h2>
    <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
      label
    </span>
  </div>
  <p className="font-mono text-sm leading-relaxed text-muted-foreground text-pretty">
    Body copy goes here. Keep it short, factual, and information-dense.
  </p>
</section>
```

Follow this file verbatim. If a proposed change cannot be expressed within these tokens and patterns, stop and ask the user before adding new ones.
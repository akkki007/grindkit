![GrindKit GitHub Banner](./public/grindkitgithub.png)

# GrindKit

A minimalist, single-user command center for tracking the daily grind of
learning Data Structures & Algorithms while shipping dev projects. Built
around the official **NeetCode 150** roadmap with pattern-based learning,
SM-2 spaced repetition, Pomodoro sessions, a dev Kanban, streaks, and
analytics — in one place.

## Stack

- **Next.js 16** (App Router, Turbopack) + **React 19** + **TypeScript** (strict)
- **Tailwind CSS v4** + **shadcn/ui** (new-york, neutral)
- **Appwrite Cloud** — auth + database + collections (per-user document permissions)
- **Zustand** + localStorage for the Pomodoro timer (survives reloads)
- **Recharts** + **react-activity-calendar** for analytics
- **@dnd-kit** for the project Kanban (optimistic drag-and-drop)
- **Monaco** editor for code, **next-themes** for light / dark
- **Web Push** + Service Worker for installable PWA
- **next/font** — Space Grotesk (display), Geist Mono (body), Noto Serif JP (decorative)

## Features

- 🧠 **Pre-seeded library** — NeetCode 150, Blind 75, LC Top Interview 150, HackerRank Kit, Striver SDE Sheet — all categorized under 18 NeetCode patterns with multi-platform links (LeetCode / NeetCode / HackerRank / GFG)
- ⌘K **global command palette** for instant logging from anywhere
- 🔁 **SM-2 spaced repetition** queue with confidence-based scheduling (Forgot / Hard / Good grades)
- ⏱️ **Persistent Pomodoro widget** (DSA / Dev / Learning types) + full-screen view. Deadline stored wall-clock, so it survives tab closes. Logs sessions on stop and increments the linked problem's time.
- 🔥 **Streak tracking** (≥ 25 DSA min or 1+ problem logged) with a rolling 1-miss-per-week grace window
- 📊 **12-week activity heatmap**, weekly DSA / Dev / Learning split, pattern coverage bar, weak-topic detection (avg confidence < 3 in last 10 reviews)
- 🗂️ **Dev project Kanban** with drag-and-drop between columns, optimistic UI, quick-add per column
- 👤 **Platform profile URLs** (LC / CF / CC / NC / HR / GFG / GitHub / Hashnode / LinkedIn) with one-click navbar access
- 🔔 **Web Push notifications** + installable PWA with offline shell
- 🎨 **Locked-down design system** — OKLCH tokens, three fonts, no color drift

## Routes

| Route | Purpose |
|---|---|
| `/` | Landing |
| `/login`, `/signup` | Email + password via Appwrite |
| `/app` | Dashboard — streak, today's split, due reviews, next pattern |
| `/app/patterns` | 18 NeetCode patterns grouped by phase |
| `/app/patterns/[slug]` | Problems within a pattern |
| `/app/library` | Full library browser with filters |
| `/app/revise` | SM-2 review queue |
| `/app/projects` | Dev projects list |
| `/app/projects/[id]` | Kanban board |
| `/app/timer` | Full-screen Pomodoro |
| `/app/analytics` | Heatmap, weekly chart, pattern coverage, weak topics |
| `/app/settings` | Profile URLs + push notifications |

## Quickstart

```bash
pnpm install
cp .env.example .env.local    # fill in Appwrite + VAPID keys
pnpm seed                     # provision collections + seed library (150 problems)
pnpm dev
```

### Environment

```env
NEXT_PUBLIC_APPWRITE_ENDPOINT=https://cloud.appwrite.io/v1
NEXT_PUBLIC_APPWRITE_PROJECT_ID=
NEXT_PUBLIC_APPWRITE_DATABASE_ID=grindkit
APPWRITE_API_KEY=             # server key with Databases scope

# Generate once with: pnpm dlx web-push generate-vapid-keys
NEXT_PUBLIC_VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=
VAPID_SUBJECT=mailto:you@example.com
```

### Scripts

```bash
pnpm dev         # next dev
pnpm build       # production build
pnpm typecheck   # tsc --noEmit
pnpm lint        # eslint
pnpm seed        # idempotent Appwrite collection provisioning + library seed
```

## Architecture

- **Server Components by default**, `"use client"` only where needed
- Next 16 **`proxy.ts`** gates `/app/*` and redirects authed users away from `/login`
- Appwrite SDK split — `lib/appwrite/client.ts` (browser), `lib/appwrite/server.ts` (session cookie + admin)
- All user data scoped via `Permission.user(userId)` document-level permissions
- Mutations go through **Server Actions**, `revalidatePath()` to refresh affected pages
- Appwrite documents serialized to plain objects before crossing the Server → Client boundary

## Design System

Every component in `components/` follows the tokens and patterns in
`docs/design.md`. No hardcoded colors, no new fonts, no motion libraries
beyond the theme-toggle GSAP hook (not currently active).

## Scheduled notifications

`/api/cron/notifications` runs hourly via Vercel Cron (`vercel.json`). It:

- Scans users with a saved push subscription
- Computes each user's current local hour from their IANA timezone
- Fires daily-revision (09:00), streak-reminder (20:00), streak-at-risk
  (23:00) and weekly-recap (Sun 19:00) pushes based on their prefs
- Deduplicates against `notifications_log` (3-hour window) so re-runs
  don't double-send

The route requires `Authorization: Bearer $CRON_SECRET`. Vercel attaches
this header automatically when the env var is set.

## Deploy

```bash
vercel link
vercel env add NEXT_PUBLIC_APPWRITE_PROJECT_ID
vercel env add APPWRITE_API_KEY
vercel env add NEXT_PUBLIC_VAPID_PUBLIC_KEY
vercel env add VAPID_PRIVATE_KEY
vercel env add VAPID_SUBJECT
vercel env add CRON_SECRET
vercel deploy --prod
```

## License

MIT — personal project, use at your own risk.

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

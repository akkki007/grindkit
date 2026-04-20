import { LibraryBrowser } from "@/components/library/library-browser";

export default function LibraryPage() {
  return (
    <section className="px-6 py-4 space-y-4">
      <div className="space-y-1">
        <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
          Problem library
        </p>
        <h1 className="text-2xl font-bold tracking-tight">Browse 150 problems</h1>
        <p className="font-mono text-sm text-muted-foreground">
          Filter by platform, pattern, difficulty, or source list. Hit{" "}
          <kbd className="rounded border border-border/50 bg-muted px-1 font-mono text-[10px]">
            ⌘K
          </kbd>{" "}
          for the command palette.
        </p>
      </div>
      <LibraryBrowser />
    </section>
  );
}

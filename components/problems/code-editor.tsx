"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const Monaco = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => (
    <div className="flex h-[260px] items-center justify-center rounded-md border border-border/50 bg-card/30 font-mono text-[10px] text-muted-foreground">
      Loading editor…
    </div>
  ),
});

export function CodeEditor({
  value,
  onChange,
  language = "cpp",
  height = 260,
}: {
  value: string;
  onChange: (v: string) => void;
  language?: string;
  height?: number;
}) {
  const { resolvedTheme } = useTheme();
  return (
    <div className="overflow-hidden rounded-md border border-border/50">
      <Monaco
        value={value}
        onChange={(v) => onChange(v ?? "")}
        language={language}
        height={height}
        theme={resolvedTheme === "dark" ? "vs-dark" : "vs-light"}
        options={{
          fontFamily: "var(--font-mono), ui-monospace, monospace",
          fontSize: 13,
          minimap: { enabled: false },
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
          lineNumbers: "on",
          renderLineHighlight: "none",
          padding: { top: 8, bottom: 8 },
        }}
      />
    </div>
  );
}

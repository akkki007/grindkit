"use client";

import { useRouter } from "next/navigation";
import { Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTimerStore } from "@/store/timer";
import { useHydrated } from "@/lib/hooks/use-hydrated";

export function LinkTimerButton({
  problemId,
  label = "Start focus timer",
}: {
  problemId: string;
  label?: string;
}) {
  const hydrated = useHydrated();
  const router = useRouter();
  const setType = useTimerStore((s) => s.setType);
  const start = useTimerStore((s) => s.start);
  const running = useTimerStore((s) => s.running);
  const linkedProblemId = useTimerStore((s) => s.linkedProblemId);

  function onClick() {
    setType("dsa");
    start({ problemId });
    router.push("/app/timer");
  }

  const isRunningThis = hydrated && running && linkedProblemId === problemId;

  return (
    <Button
      type="button"
      size="sm"
      variant={isRunningThis ? "outline" : "default"}
      onClick={onClick}
      disabled={!hydrated}
    >
      <Play className="size-3.5" />
      {isRunningThis ? "Resume timer" : label}
    </Button>
  );
}

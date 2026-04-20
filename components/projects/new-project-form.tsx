"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createProjectAction } from "@/actions/projects";

export function NewProjectForm() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    startTransition(async () => {
      const res = await createProjectAction({
        name,
        description,
        status: "active",
        color: "",
      });
      if (!res.ok) {
        setError(res.error);
        return;
      }
      setName("");
      setDescription("");
      setOpen(false);
      router.push(`/app/projects/${res.id}`);
      router.refresh();
    });
  }

  if (!open) {
    return (
      <Button onClick={() => setOpen(true)} size="sm">
        <Plus className="size-4" />
        New project
      </Button>
    );
  }

  return (
    <form
      onSubmit={submit}
      className="w-full max-w-md space-y-3 rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm"
    >
      <div className="space-y-1.5">
        <Label htmlFor="project-name">Name</Label>
        <Input
          id="project-name"
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={isPending}
          placeholder="e.g. GrindKit v1"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="project-desc">Description</Label>
        <textarea
          id="project-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isPending}
          className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-xs shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
      </div>
      {error ? (
        <p className="font-mono text-xs text-destructive">{error}</p>
      ) : null}
      <div className="flex justify-end gap-2">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={() => setOpen(false)}
          disabled={isPending}
        >
          Cancel
        </Button>
        <Button type="submit" size="sm" disabled={isPending || !name.trim()}>
          {isPending ? "Creating…" : "Create project"}
        </Button>
      </div>
    </form>
  );
}
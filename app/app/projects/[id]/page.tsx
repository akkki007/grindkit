import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { KanbanBoard } from "@/components/projects/kanban-board";
import { getCurrentUser } from "@/lib/appwrite/server";
import {
  getUserProject,
  listProjectTasks,
} from "@/lib/appwrite/queries";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getCurrentUser();
  if (!user) notFound();

  const [project, tasks] = await Promise.all([
    getUserProject(user.$id, id),
    listProjectTasks(user.$id, id),
  ]);
  if (!project) notFound();

  const done = tasks.filter((t) => t.status === "done").length;

  return (
    <section className="px-6 py-4 space-y-6">
      <div>
        <Link
          href="/app/projects"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-3" />
          Projects
        </Link>
      </div>

      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            {project.status} · {new Date(project.createdAt).toLocaleDateString()}
          </p>
          <h1 className="text-2xl font-bold tracking-tight">{project.name}</h1>
          {project.description ? (
            <p className="font-mono text-sm text-muted-foreground text-pretty">
              {project.description}
            </p>
          ) : null}
        </div>
        <p className="font-mono text-xs text-muted-foreground tabular-nums">
          {done}/{tasks.length} done
        </p>
      </div>

      <KanbanBoard projectId={id} initialTasks={tasks} />
    </section>
  );
}

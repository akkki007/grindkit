import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { NewProjectForm } from "@/components/projects/new-project-form";
import { getCurrentUser } from "@/lib/appwrite/server";
import {
  listUserProjects,
  countTasksPerProject,
} from "@/lib/appwrite/queries";

export default async function ProjectsPage() {
  const user = await getCurrentUser();
  const [projects, counts] = user
    ? await Promise.all([
        listUserProjects(user.$id),
        countTasksPerProject(user.$id),
      ])
    : [[], {} as Record<string, { total: number; done: number }>];

  return (
    <section className="px-6 py-4 space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
            Dev projects
          </p>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="font-mono text-sm text-muted-foreground">
            Track what you&apos;re shipping. Each project gets a kanban board.
          </p>
        </div>
        <NewProjectForm />
      </div>

      {projects.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border/50 bg-card/30 p-8 text-center font-mono text-sm text-muted-foreground">
          No projects yet. Create one above to get started.
        </div>
      ) : (
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {projects.map((project) => {
            const c = counts[project.$id] ?? { total: 0, done: 0 };
            const pct = c.total > 0 ? Math.round((c.done / c.total) * 100) : 0;
            return (
              <li key={project.$id}>
                <Link
                  href={`/app/projects/${project.$id}`}
                  className="group flex flex-col justify-between rounded-lg border border-border/50 bg-card/50 p-4 shadow-sm transition-all duration-300 hover:shadow-md hover:border-border"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <h2 className="font-display text-lg font-semibold tracking-tight">
                        {project.name}
                      </h2>
                      {project.description ? (
                        <p className="mt-1 font-mono text-xs text-muted-foreground line-clamp-2">
                          {project.description}
                        </p>
                      ) : null}
                    </div>
                    <ArrowRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
                  </div>
                  <div className="mt-4 space-y-1.5">
                    <div className="flex items-center justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
                      <span>
                        {c.done}/{c.total} tasks
                      </span>
                      <span>{pct}%</span>
                    </div>
                    <div className="h-1 overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-foreground transition-all"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

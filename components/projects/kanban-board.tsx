"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { Plus, GripVertical } from "lucide-react";
import { createTaskAction, moveTaskAction } from "@/actions/tasks";
import type { TaskRow } from "@/lib/appwrite/queries";
import { cn } from "@/lib/utils";

type Status = "backlog" | "in_progress" | "done";

type Column = {
  status: Status;
  label: string;
  hint: string;
};

const COLUMNS: Column[] = [
  { status: "backlog", label: "Backlog", hint: "To do" },
  { status: "in_progress", label: "In progress", hint: "Doing" },
  { status: "done", label: "Done", hint: "Shipped" },
];

export function KanbanBoard({
  projectId,
  initialTasks,
}: {
  projectId: string;
  initialTasks: TaskRow[];
}) {
  const [tasks, setTasks] = useState<TaskRow[]>(initialTasks);
  const [optimisticTasks, applyOptimistic] = useOptimistic<TaskRow[], TaskRow[]>(
    tasks,
    (_, next) => next
  );
  const [activeId, setActiveId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const tempIdSeq = useRef(0);
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } })
  );

  function onDragStart(e: DragStartEvent) {
    setActiveId(String(e.active.id));
  }

  function onDragEnd(e: DragEndEvent) {
    setActiveId(null);
    const { active, over } = e;
    if (!over) return;

    const activeTask = optimisticTasks.find((t) => t.$id === active.id);
    if (!activeTask) return;

    const overId = String(over.id);
    let targetStatus: Status = activeTask.status;
    let targetIndex = 0;

    if (overId.startsWith("col:")) {
      targetStatus = overId.slice(4) as Status;
      targetIndex = optimisticTasks.filter((t) => t.status === targetStatus && t.$id !== activeTask.$id).length;
    } else {
      const overTask = optimisticTasks.find((t) => t.$id === overId);
      if (!overTask) return;
      targetStatus = overTask.status;
      const colTasks = optimisticTasks.filter((t) => t.status === targetStatus);
      targetIndex = colTasks.findIndex((t) => t.$id === overTask.$id);
    }

    const sameColumn = targetStatus === activeTask.status;
    let nextList: TaskRow[];

    if (sameColumn) {
      const colTasks = optimisticTasks.filter((t) => t.status === targetStatus);
      const currentIndex = colTasks.findIndex((t) => t.$id === activeTask.$id);
      if (currentIndex === targetIndex) return;
      const reordered = arrayMove(colTasks, currentIndex, targetIndex).map(
        (t, i) => ({ ...t, order: i })
      );
      const others = optimisticTasks.filter((t) => t.status !== targetStatus);
      nextList = [...others, ...reordered];
    } else {
      const moved: TaskRow = {
        ...activeTask,
        status: targetStatus,
        order: targetIndex,
      };
      const sourceCol = optimisticTasks
        .filter((t) => t.status === activeTask.status && t.$id !== activeTask.$id)
        .map((t, i) => ({ ...t, order: i }));
      const destCol = optimisticTasks
        .filter((t) => t.status === targetStatus)
        .slice();
      destCol.splice(targetIndex, 0, moved);
      const renumberedDest = destCol.map((t, i) => ({ ...t, order: i }));
      const untouched = optimisticTasks.filter(
        (t) => t.status !== activeTask.status && t.status !== targetStatus
      );
      nextList = [...untouched, ...sourceCol, ...renumberedDest];
    }

    startTransition(async () => {
      applyOptimistic(nextList);
      const res = await moveTaskAction({
        taskId: activeTask.$id,
        toStatus: targetStatus,
        toOrder: targetIndex,
        projectId,
      });
      if (res.ok) {
        setTasks(nextList);
      }
    });
  }

  function addTask(status: Status, title: string) {
    if (!title.trim()) return;
    tempIdSeq.current += 1;
    const tempId = `tmp-${tempIdSeq.current}`;
    const optimisticCount = optimisticTasks.filter((t) => t.status === status).length;
    const placeholder: TaskRow = {
      $id: tempId,
      projectId,
      title: title.trim(),
      status,
      order: optimisticCount,
      createdAt: new Date().toISOString(),
      estimatedHours: null,
      actualHours: null,
      completedAt: null,
    };

    startTransition(async () => {
      applyOptimistic([...optimisticTasks, placeholder]);
      const res = await createTaskAction({
        projectId,
        title: placeholder.title,
        status,
      });
      if (res.ok) {
        setTasks((prev) => [
          ...prev,
          { ...placeholder, $id: res.id },
        ]);
      }
    });
  }

  const activeTask = activeId
    ? optimisticTasks.find((t) => t.$id === activeId)
    : null;

  return (
    <DndContext sensors={sensors} onDragStart={onDragStart} onDragEnd={onDragEnd}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {COLUMNS.map((col) => {
          const items = optimisticTasks
            .filter((t) => t.status === col.status)
            .sort((a, b) => a.order - b.order);
          return (
            <KanbanColumn
              key={col.status}
              column={col}
              tasks={items}
              onAdd={(title) => addTask(col.status, title)}
            />
          );
        })}
      </div>
      <DragOverlay>
        {activeTask ? <TaskCardShell task={activeTask} isDragging /> : null}
      </DragOverlay>
    </DndContext>
  );
}

function KanbanColumn({
  column,
  tasks,
  onAdd,
}: {
  column: Column;
  tasks: TaskRow[];
  onAdd: (title: string) => void;
}) {
  const [draft, setDraft] = useState("");

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft);
    setDraft("");
  }

  return (
    <div
      id={`col:${column.status}`}
      className="flex h-full flex-col rounded-lg border border-border/50 bg-card/30 p-3"
    >
      <div className="mb-3 flex items-baseline justify-between">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {column.label}
        </h3>
        <span className="font-mono text-[10px] text-muted-foreground tabular-nums">
          {tasks.length}
        </span>
      </div>

      <SortableContext
        id={`col:${column.status}`}
        items={tasks.map((t) => t.$id)}
        strategy={verticalListSortingStrategy}
      >
        <ul className="flex min-h-12 flex-col gap-2">
          {tasks.map((task) => (
            <SortableTaskCard key={task.$id} task={task} />
          ))}
          <DroppableArea columnId={`col:${column.status}`} empty={tasks.length === 0} />
        </ul>
      </SortableContext>

      <form onSubmit={submit} className="mt-3 flex gap-1.5">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          placeholder="+ Add task"
          className="flex-1 rounded-md border border-input bg-background px-2 py-1 font-mono text-xs focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
        />
        <button
          type="submit"
          disabled={!draft.trim()}
          className="inline-flex size-7 items-center justify-center rounded-md bg-foreground text-background transition-opacity hover:opacity-90 disabled:opacity-40"
          aria-label="Add task"
        >
          <Plus className="size-3" />
        </button>
      </form>
    </div>
  );
}

function DroppableArea({ columnId, empty }: { columnId: string; empty: boolean }) {
  const { setNodeRef } = useSortable({ id: columnId });
  if (!empty) return null;
  return (
    <li
      ref={setNodeRef}
      className="rounded-md border border-dashed border-border/50 p-3 text-center font-mono text-[10px] text-muted-foreground"
    >
      Drop here
    </li>
  );
}

function SortableTaskCard({ task }: { task: TaskRow }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.$id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <li ref={setNodeRef} style={style}>
      <div className="group flex items-start gap-1.5 rounded-md border border-border/50 bg-card p-2.5 shadow-sm transition-colors hover:border-border">
        <button
          type="button"
          className={cn(
            "mt-0.5 shrink-0 cursor-grab text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100",
            "active:cursor-grabbing"
          )}
          aria-label="Drag"
          {...attributes}
          {...listeners}
        >
          <GripVertical className="size-3" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="wrap-break-word font-mono text-xs leading-relaxed">
            {task.title}
          </p>
          {task.estimatedHours ? (
            <p className="mt-1 font-mono text-[10px] text-muted-foreground">
              est {task.estimatedHours}h
            </p>
          ) : null}
        </div>
      </div>
    </li>
  );
}

function TaskCardShell({ task, isDragging }: { task: TaskRow; isDragging?: boolean }) {
  return (
    <div
      className={cn(
        "rounded-md border border-border bg-card p-2.5 shadow-md",
        isDragging && "rotate-1"
      )}
    >
      <p className="font-mono text-xs">{task.title}</p>
    </div>
  );
}

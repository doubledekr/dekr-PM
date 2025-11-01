import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import SortableTask from "./SortableTask";
import type { Task } from "../types";

interface DroppableColumnProps {
  id: string;
  status: "todo" | "doing" | "done";
  tasks: Array<Task & { status: "todo" | "doing" | "done"; attachments?: Array<{ name: string; url: string }> }>;
  onStatusChange: (id: string, status: "todo" | "doing" | "done") => void;
  onTitleChange: (id: string, title: string) => void;
  projectId: string;
}

export default function DroppableColumn({
  id,
  status,
  tasks,
  onStatusChange,
  onTitleChange,
  projectId,
}: DroppableColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id,
  });

  return (
    <section
      ref={setNodeRef}
      style={{
        border: isOver ? "2px solid #6366f1" : "1px solid #333",
        borderRadius: 12,
        padding: 16,
        backgroundColor: isOver ? "#242424" : "#1a1a1a",
        minHeight: 400,
        transition: "all 0.2s",
      }}
    >
      <h3 style={{ textTransform: "capitalize", marginTop: 0, marginBottom: 16 }}>
        {status} ({tasks.length})
      </h3>
      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
          {tasks.map((task) => (
            <SortableTask
              key={task.id}
              id={task.id}
              task={task}
              onStatusChange={onStatusChange}
              onTitleChange={onTitleChange}
              projectId={projectId}
            />
          ))}
          {tasks.length === 0 && (
            <li
              style={{
                color: "rgba(255,255,255,0.5)",
                fontStyle: "italic",
                padding: 16,
                textAlign: "center",
              }}
            >
              No tasks
            </li>
          )}
        </ul>
      </SortableContext>
    </section>
  );
}


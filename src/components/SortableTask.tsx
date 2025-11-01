import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import FileUpload from "./FileUpload";

interface SortableTaskProps {
  id: string;
  task: {
    id: string;
    title: string;
    description?: string;
    status: "todo" | "doing" | "done";
    priority?: "low" | "medium" | "high";
    attachments?: Array<{ name: string; url: string }>;
  };
  onStatusChange: (id: string, status: "todo" | "doing" | "done") => void;
  onTitleChange: (id: string, title: string) => void;
  projectId: string;
}

export default function SortableTask({
  id,
  task,
  onStatusChange,
  onTitleChange,
  projectId,
}: SortableTaskProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li
      ref={setNodeRef}
      style={{
        ...style,
        border: "1px solid #444",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
        backgroundColor: "#242424",
        cursor: isDragging ? "grabbing" : "grab",
      }}
      {...attributes}
      {...listeners}
    >
      <div style={{ marginBottom: 8 }}>
        <input
          type="text"
          value={task.title}
          onChange={(e) => onTitleChange(task.id, e.target.value)}
          onClick={(e) => e.stopPropagation()}
          style={{
            width: "100%",
            padding: "4px 8px",
            backgroundColor: "transparent",
            border: "1px solid transparent",
            color: "inherit",
            fontSize: "1em",
            fontWeight: 500,
            cursor: "text",
          }}
          onBlur={(e) => {
            if (!e.target.value.trim()) {
              onTitleChange(task.id, "New task");
            }
          }}
        />
      </div>
      {task.description && (
        <p
          style={{
            fontSize: "0.9em",
            color: "rgba(255,255,255,0.7)",
            margin: "8px 0",
          }}
        >
          {task.description}
        </p>
      )}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 8,
          flexWrap: "wrap",
        }}
      >
        <select
          value={task.status}
          onChange={(e) => {
            e.stopPropagation();
            onStatusChange(task.id, e.target.value as "todo" | "doing" | "done");
          }}
          onClick={(e) => e.stopPropagation()}
          style={{
            padding: "4px 8px",
            backgroundColor: "#1a1a1a",
            border: "1px solid #444",
            borderRadius: 4,
            color: "inherit",
            fontSize: "0.9em",
            cursor: "pointer",
          }}
        >
          <option value="todo">Todo</option>
          <option value="doing">Doing</option>
          <option value="done">Done</option>
        </select>
        {task.priority && (
          <span
            style={{
              padding: "2px 8px",
              borderRadius: 12,
              fontSize: "0.75em",
              backgroundColor:
                task.priority === "high"
                  ? "#ef4444"
                  : task.priority === "medium"
                  ? "#f59e0b"
                  : "#10b981",
            }}
          >
            {task.priority}
          </span>
        )}
      </div>
      {task.attachments && task.attachments.length > 0 && (
        <div style={{ marginTop: 8 }}>
          <FileUpload
            projectId={projectId}
            taskId={task.id}
            attachments={task.attachments}
          />
        </div>
      )}
    </li>
  );
}


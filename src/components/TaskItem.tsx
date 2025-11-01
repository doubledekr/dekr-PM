import type { Task } from "../types";

interface TaskItemProps {
  task: Task;
  onToggle: () => void;
  onDelete: () => void;
}

export default function TaskItem({ task, onToggle, onDelete }: TaskItemProps) {
  const priorityColors = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#ef4444",
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm("Are you sure you want to delete this task?")) {
      onDelete();
    }
  };

  return (
    <div className={`task-item ${task.completed ? "completed" : ""}`}>
      <div className="task-checkbox">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={onToggle}
        />
      </div>
      <div className="task-content">
        <h3 className={task.completed ? "strikethrough" : ""}>{task.title}</h3>
        {task.description && (
          <p className={task.completed ? "strikethrough" : ""}>{task.description}</p>
        )}
        {task.priority && (
          <span 
            className="priority-badge"
            style={{ backgroundColor: priorityColors[task.priority] }}
          >
            {task.priority}
          </span>
        )}
      </div>
      <button className="btn-icon task-delete" onClick={handleDelete} aria-label="Delete task">
        ×
      </button>
    </div>
  );
}


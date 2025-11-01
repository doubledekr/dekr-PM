import { useParams, Link } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { auth, db } from "../firebaseClient";
import {
  collection,
  addDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  updateDoc,
  doc,
} from "firebase/firestore";
import { DndContext, DragOverlay, closestCenter } from "@dnd-kit/core";
import type { DragEndEvent } from "@dnd-kit/core";
import type { Task } from "../types";
import DroppableColumn from "../components/DroppableColumn";

type TaskStatus = "todo" | "doing" | "done";

interface KanbanTask extends Task {
  status: TaskStatus;
  attachments?: Array<{ name: string; url: string }>;
}

export default function ProjectBoard() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<{ name?: string; description?: string } | null>(null);
  const [tasks, setTasks] = useState<KanbanTask[]>([]);

  // Load project details
  useEffect(() => {
    if (!projectId) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubscribe = onSnapshot(projectRef, (snapshot) => {
      if (snapshot.exists()) {
        setProject(snapshot.data() as { name?: string; description?: string });
      }
    });

    return () => unsubscribe();
  }, [projectId]);

  // Load tasks
  useEffect(() => {
    if (!projectId) return;

    const q = query(
      collection(db, "projects", projectId, "tasks"),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setTasks(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<KanbanTask, "id">),
        }))
      );
    });

    return () => unsubscribe();
  }, [projectId]);

  const cols = useMemo(
    () => ({
      todo: tasks.filter((t) => t.status === "todo"),
      doing: tasks.filter((t) => t.status === "doing"),
      done: tasks.filter((t) => t.status === "done"),
    }),
    [tasks]
  );

  async function addTask() {
    const uid = auth.currentUser?.uid;
    if (!projectId || !uid) return;

    try {
      await addDoc(collection(db, "projects", projectId, "tasks"), {
        projectId,
        title: "New task",
        description: "",
        status: "todo",
        completed: false,
        priority: "medium",
        updatedAt: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error adding task:", error);
      alert("Failed to add task");
    }
  }

  async function moveTask(id: string, status: TaskStatus) {
    if (!projectId) return;

    try {
      await updateDoc(doc(db, "projects", projectId, "tasks", id), {
        status,
        updatedAt: serverTimestamp(),
      });

      // Update completed flag based on status
      if (status === "done") {
        await updateDoc(doc(db, "projects", projectId, "tasks", id), {
          completed: true,
        });
      } else {
        await updateDoc(doc(db, "projects", projectId, "tasks", id), {
          completed: false,
        });
      }
    } catch (error) {
      console.error("Error moving task:", error);
      alert("Failed to move task");
    }
  }

  async function updateTaskTitle(id: string, title: string) {
    if (!projectId) return;

    try {
      await updateDoc(doc(db, "projects", projectId, "tasks", id), {
        title,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error updating task:", error);
    }
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over || !projectId) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    // Find the task being dragged
    const draggedTask = tasks.find((t) => t.id === taskId);
    if (!draggedTask) return;

    // If dropped on a column (status-todo, status-doing, status-done)
    if (overId.startsWith("status-")) {
      const newStatus = overId.replace("status-", "") as TaskStatus;
      
      // Only move if status changed
      if (draggedTask.status !== newStatus) {
        moveTask(taskId, newStatus);
      }
    }
  }

  if (!projectId) {
    return (
      <main style={{ padding: 24 }}>
        <p>Project not found</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ marginBottom: 24 }}>
        <Link to="/" className="btn btn-secondary">
          ← Back to Projects
        </Link>
      </div>

      <div style={{ marginBottom: 24 }}>
        <h1>{project?.name || "Project Board"}</h1>
        {project?.description && <p>{project.description}</p>}
      </div>

      <button className="btn btn-primary" onClick={addTask} style={{ marginBottom: 24 }}>
        + Add Task
      </button>

      <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 }}>
          {(["todo", "doing", "done"] as const).map((status) => (
            <DroppableColumn
              key={status}
              id={`status-${status}`}
              status={status}
              tasks={cols[status]}
              onStatusChange={moveTask}
              onTitleChange={updateTaskTitle}
              projectId={projectId}
            />
          ))}
        </div>
        <DragOverlay>
          <div
            style={{
              border: "2px solid #6366f1",
              borderRadius: 8,
              padding: 12,
              backgroundColor: "#242424",
              opacity: 0.9,
            }}
          >
            Dragging...
          </div>
        </DragOverlay>
      </DndContext>
    </main>
  );
}


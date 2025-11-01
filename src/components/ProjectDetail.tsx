import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { doc, onSnapshot, updateDoc, deleteDoc, collection, query, orderBy } from "firebase/firestore";
import { auth, db } from "../firebaseClient";
import type { Project, Task } from "../types";
import TaskItem from "./TaskItem";
import CreateTaskModal from "./CreateTaskModal";

export default function ProjectDetail() {
  const { projectId } = useParams<{ projectId: string }>();
  const [project, setProject] = useState<Project | null>(null);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [isCreateTaskModalOpen, setIsCreateTaskModalOpen] = useState(false);
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");

  useEffect(() => {
    if (!projectId || !auth.currentUser) return;

    const projectRef = doc(db, "projects", projectId);
    const unsubscribeProject = onSnapshot(projectRef, (snapshot) => {
      if (!snapshot.exists()) {
        setProject(null);
        return;
      }
      const data = snapshot.data();
      setProject({
        id: snapshot.id,
        name: data.name,
        description: data.description,
        createdAt: data.createdAt?.toDate() || new Date(),
        updatedAt: data.updatedAt?.toDate() || new Date(),
        ownerId: data.ownerId,
        color: data.color,
      });
    });

    return () => unsubscribeProject();
  }, [projectId]);

  useEffect(() => {
    if (!projectId) return;

    // Tasks are stored as subcollections: projects/{projectId}/tasks
    const tasksRef = collection(db, "projects", projectId, "tasks");
    const q = query(
      tasksRef,
      orderBy("createdAt", "desc")
    );

    const unsubscribeTasks = onSnapshot(q, (snapshot) => {
      const tasksData: Task[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        return {
          id: docSnap.id,
          projectId: projectId,
          title: data.title,
          description: data.description,
          completed: data.completed || false,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          priority: data.priority,
        };
      });
      setTasks(tasksData);
    });

    return () => unsubscribeTasks();
  }, [projectId]);

  const handleDeleteTask = async (taskId: string) => {
    if (!projectId) return;
    await deleteDoc(doc(db, "projects", projectId, "tasks", taskId));
  };

  const handleToggleTask = async (task: Task) => {
    if (!projectId) return;
    await updateDoc(doc(db, "projects", projectId, "tasks", task.id), {
      completed: !task.completed,
      updatedAt: new Date(),
    });
    
    // Also update project's updatedAt
    if (projectId) {
      await updateDoc(doc(db, "projects", projectId), {
        updatedAt: new Date(),
      });
    }
  };

  const filteredTasks = tasks.filter((task) => {
    if (filter === "active") return !task.completed;
    if (filter === "completed") return task.completed;
    return true;
  });

  if (!project) {
    return (
      <div className="project-detail">
        <Link to="/" className="btn btn-secondary">← Back to Projects</Link>
        <p>Project not found</p>
      </div>
    );
  }

  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="project-detail">
      <div className="project-detail-header">
        <Link to="/" className="btn btn-secondary">← Back to Projects</Link>
        <div 
          className="project-banner"
          style={{ backgroundColor: project.color || "#6366f1" }}
        >
          <h1>{project.name}</h1>
          {project.description && <p>{project.description}</p>}
        </div>
      </div>

      <div className="project-detail-content">
        <div className="task-section-header">
          <div className="task-filters">
            <button
              className={`filter-btn ${filter === "all" ? "active" : ""}`}
              onClick={() => setFilter("all")}
            >
              All ({totalCount})
            </button>
            <button
              className={`filter-btn ${filter === "active" ? "active" : ""}`}
              onClick={() => setFilter("active")}
            >
              Active ({totalCount - completedCount})
            </button>
            <button
              className={`filter-btn ${filter === "completed" ? "active" : ""}`}
              onClick={() => setFilter("completed")}
            >
              Completed ({completedCount})
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => setIsCreateTaskModalOpen(true)}
          >
            + Add Task
          </button>
        </div>

        {filteredTasks.length === 0 ? (
          <div className="empty-state">
            <p>
              {filter === "all" 
                ? "No tasks yet. Add your first task!"
                : filter === "active"
                ? "No active tasks!"
                : "No completed tasks!"}
            </p>
          </div>
        ) : (
          <div className="task-list">
            {filteredTasks.map((task) => (
              <TaskItem
                key={task.id}
                task={task}
                onToggle={() => handleToggleTask(task)}
                onDelete={() => handleDeleteTask(task.id)}
              />
            ))}
          </div>
        )}
      </div>

      {isCreateTaskModalOpen && (
        <CreateTaskModal
          projectId={projectId!}
          onClose={() => setIsCreateTaskModalOpen(false)}
        />
      )}
    </div>
  );
}


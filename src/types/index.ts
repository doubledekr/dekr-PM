export interface Project {
  id: string;
  name: string;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
  ownerId: string;
  color?: string;
}

export interface Task {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
  priority?: "low" | "medium" | "high";
  status?: "todo" | "doing" | "done";
  attachments?: Array<{ name: string; url: string }>;
}

export interface ProjectWithTaskCount extends Project {
  taskCount: number;
  completedTaskCount: number;
}


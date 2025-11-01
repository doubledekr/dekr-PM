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
}

export interface ProjectWithTaskCount extends Project {
  taskCount: number;
  completedTaskCount: number;
}


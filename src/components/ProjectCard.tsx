import { Link } from "react-router-dom";
import type { ProjectWithTaskCount } from "../types";

interface ProjectCardProps {
  project: ProjectWithTaskCount;
  onDelete: (projectId: string) => void;
}

export default function ProjectCard({ project, onDelete }: ProjectCardProps) {
  const progress = project.taskCount > 0 
    ? Math.round((project.completedTaskCount / project.taskCount) * 100)
    : 0;

  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(project.id);
  };

  return (
    <Link to={`/project/${project.id}`} className="project-card">
      <div 
        className="project-card-header"
        style={{ backgroundColor: project.color || "#6366f1" }}
      >
        <h3>{project.name}</h3>
        <button
          className="btn-icon"
          onClick={handleDelete}
          aria-label="Delete project"
        >
          ×
        </button>
      </div>
      <div className="project-card-body">
        {project.description && (
          <p className="project-description">{project.description}</p>
        )}
        <div className="project-stats">
          <span>{project.completedTaskCount}/{project.taskCount} tasks completed</span>
        </div>
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>
    </Link>
  );
}


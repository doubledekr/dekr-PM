import { useEffect, useState } from "react";
import { collection, query, where, orderBy, onSnapshot, deleteDoc, doc, getDocs } from "firebase/firestore";
import { auth, db } from "../firebaseClient";
import type { ProjectWithTaskCount } from "../types";
import ProjectCard from "./ProjectCard";
import CreateProjectModal from "./CreateProjectModal";

export default function ProjectList() {
  const [projects, setProjects] = useState<ProjectWithTaskCount[]>([]);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  useEffect(() => {
    if (!auth.currentUser) return;

    const projectsRef = collection(db, "projects");
    const q = query(
      projectsRef,
      where("ownerId", "==", auth.currentUser.uid),
      orderBy("updatedAt", "desc")
    );

    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const projectsData: ProjectWithTaskCount[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        
        // Get task counts (using subcollection)
        const tasksRef = collection(db, "projects", docSnap.id, "tasks");
        const tasksSnapshot = await getDocs(tasksRef);
        
        const totalTasks = tasksSnapshot.size;
        const completedTasks = tasksSnapshot.docs.filter(
          (t) => t.data().completed === true
        ).length;

        projectsData.push({
          id: docSnap.id,
          name: data.name,
          description: data.description,
          createdAt: data.createdAt?.toDate() || new Date(),
          updatedAt: data.updatedAt?.toDate() || new Date(),
          ownerId: data.ownerId,
          color: data.color,
          taskCount: totalTasks,
          completedTaskCount: completedTasks,
        });
      }
      
      setProjects(projectsData);
    });

    return () => unsubscribe();
  }, []);

  const handleDeleteProject = async (projectId: string) => {
    if (!confirm("Are you sure you want to delete this project? All tasks will be deleted too.")) {
      return;
    }

    // Delete all tasks first (using subcollection)
    const tasksRef = collection(db, "projects", projectId, "tasks");
    const tasksSnapshot = await getDocs(tasksRef);
    
    const deletePromises = tasksSnapshot.docs.map((taskDoc) => 
      deleteDoc(doc(db, "projects", projectId, "tasks", taskDoc.id))
    );
    
    await Promise.all(deletePromises);
    await deleteDoc(doc(db, "projects", projectId));
  };

  if (!auth.currentUser) {
    return <div>Please sign in...</div>;
  }

  return (
    <div className="project-list">
      <header className="project-list-header">
        <h1>Dekr Projects</h1>
        <button 
          className="btn btn-primary"
          onClick={() => setIsCreateModalOpen(true)}
        >
          + New Project
        </button>
      </header>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onDelete={handleDeleteProject}
            />
          ))}
        </div>
      )}

      {isCreateModalOpen && (
        <CreateProjectModal
          onClose={() => setIsCreateModalOpen(false)}
        />
      )}
    </div>
  );
}


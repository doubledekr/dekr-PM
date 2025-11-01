import { useEffect, useState } from "react";
import { auth, db } from "../firebaseClient";
import { onAuthStateChanged, signInAnonymously } from "firebase/auth";
import { collection, addDoc, onSnapshot, query, where, orderBy, serverTimestamp } from "firebase/firestore";
import { Link } from "react-router-dom";

interface Project {
  id: string;
  name: string;
  description?: string;
  ownerId: string;
  createdAt?: any;
  updatedAt?: any;
}

export default function Projects() {
  const [uid, setUid] = useState<string>();
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    // Sign in anonymously if not already signed in
    signInAnonymously(auth).catch(console.error);
    
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUid(u?.uid ?? undefined);
    });
    
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!uid) return;

    const q = query(
      collection(db, "projects"),
      where("ownerId", "==", uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(
        snapshot.docs.map((d) => ({
          id: d.id,
          ...(d.data() as Omit<Project, "id">),
        }))
      );
    });

    return () => unsubscribe();
  }, [uid]);

  async function createProject() {
    if (!uid) return;

    try {
      await addDoc(collection(db, "projects"), {
        ownerId: uid,
        name: "New Project",
        description: "",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      console.error("Error creating project:", error);
      alert("Failed to create project");
    }
  }

  if (!uid) {
    return (
      <main style={{ padding: 24 }}>
        <p>Signing in...</p>
      </main>
    );
  }

  return (
    <main style={{ padding: 24 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 24 }}>
        <h1>Projects</h1>
        <button className="btn btn-primary" onClick={createProject}>
          + New Project
        </button>
      </div>

      {projects.length === 0 ? (
        <div className="empty-state">
          <p>No projects yet. Create your first project to get started!</p>
        </div>
      ) : (
        <div className="project-grid">
          {projects.map((p) => (
            <Link
              key={p.id}
              to={`/p/${p.id}`}
              className="project-card"
              style={{ textDecoration: "none", color: "inherit" }}
            >
              <div className="project-card-header" style={{ backgroundColor: "#6366f1" }}>
                <h3>{p.name}</h3>
              </div>
              <div className="project-card-body">
                {p.description && (
                  <p className="project-description">{p.description}</p>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}


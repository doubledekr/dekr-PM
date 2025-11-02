import { useEffect } from "react";
import { Outlet } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "./firebaseClient";
import { signInAnonymously } from "firebase/auth";
import "./App.css";

export default function App() {
  useEffect(() => {
    // Sign in anonymously on app load
    signInAnonymously(auth).catch((error) => {
      console.error("Error signing in:", error);
    });
  }, []);

  // Seed function for testing - creates a project + task using the rules schema
  async function createProjectWithTask() {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      alert("Please sign in first");
      return;
    }

    try {
      const projectRef = await addDoc(collection(db, "projects"), {
        ownerId: uid,
        name: "My First Project",
        description: "A test project created with the seed function",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      await addDoc(collection(db, "projects", projectRef.id, "tasks"), {
        title: "First task",
        description: "This is a test task",
        status: "todo",
        completed: false,
        priority: "medium",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });

      alert("Project and task created successfully!");
    } catch (error) {
      console.error("Error creating project with task:", error);
      alert("Failed to create project. Check console for details.");
    }
  }

  // Expose seed function globally for testing (only in dev)
  useEffect(() => {
    if (import.meta.env.DEV) {
      (window as any).createProjectWithTask = createProjectWithTask;
    }
  }, []);

  return (
    <div className="app-container">
      <Outlet />
      <footer
        style={{
          marginTop: 60,
          padding: 24,
          textAlign: "center",
          fontSize: "0.85em",
          color: "rgba(255,255,255,0.6)",
          borderTop: "1px solid #333",
        }}
      >
        <p style={{ margin: "8px 0" }}>
          <strong>Disclaimer:</strong> User predictions are opinions, not investment advice.
        </p>
        <p style={{ margin: "8px 0" }}>
          Past accuracy does not guarantee future performance. No trading or brokerage services.
        </p>
      </footer>
    </div>
  );
}

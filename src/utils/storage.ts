import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { storage, auth, db } from "../firebaseClient";
import { updateDoc, doc, arrayUnion, getDoc } from "firebase/firestore";

export interface Attachment {
  name: string;
  url: string;
}

/**
 * Upload a file to Firebase Storage and attach it to a task
 * Path format: user_uploads/{uid}/{projectId}/{taskId}/{filename}
 */
export async function attachFile(
  projectId: string,
  taskId: string,
  file: File
): Promise<Attachment> {
  const uid = auth.currentUser?.uid;
  if (!uid) {
    throw new Error("User must be authenticated to upload files");
  }

  if (!projectId || !taskId) {
    throw new Error("Project ID and Task ID are required");
  }

  // Create storage path matching security rules
  const path = `user_uploads/${uid}/${projectId}/${taskId}/${file.name}`;
  const storageRef = ref(storage, path);

  try {
    // Upload file
    await uploadBytes(storageRef, file);

    // Get download URL
    const url = await getDownloadURL(storageRef);

    const attachment: Attachment = {
      name: file.name,
      url,
    };

    // Update task document with attachment
    await updateDoc(doc(db, "projects", projectId, "tasks", taskId), {
      attachments: arrayUnion(attachment),
      updatedAt: new Date(),
    });

    return attachment;
  } catch (error) {
    console.error("Error uploading file:", error);
    throw new Error(`Failed to upload file: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Remove an attachment from a task
 */
export async function removeAttachment(
  projectId: string,
  taskId: string,
  attachmentToRemove: Attachment
): Promise<void> {
  const taskRef = doc(db, "projects", projectId, "tasks", taskId);

  try {
    // Get current task to find the attachment to remove
    const taskDoc = await getDoc(taskRef);

    if (!taskDoc.exists()) {
      throw new Error("Task not found");
    }

    const currentAttachments = (taskDoc.data().attachments || []) as Attachment[];
    const updatedAttachments = currentAttachments.filter(
      (att) => att.url !== attachmentToRemove.url || att.name !== attachmentToRemove.name
    );

    await updateDoc(taskRef, {
      attachments: updatedAttachments,
      updatedAt: new Date(),
    });
  } catch (error) {
    console.error("Error removing attachment:", error);
    throw new Error(`Failed to remove attachment: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}


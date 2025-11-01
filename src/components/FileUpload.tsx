import { useState } from "react";
import { attachFile, removeAttachment } from "../utils/storage";
import type { Attachment } from "../utils/storage";

interface FileUploadProps {
  projectId: string;
  taskId: string;
  attachments?: Attachment[];
  onAttachmentAdded?: (attachment: Attachment) => void;
  onAttachmentRemoved?: (attachment: Attachment) => void;
}

export default function FileUpload({
  projectId,
  taskId,
  attachments = [],
  onAttachmentAdded,
  onAttachmentRemoved,
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setError(null);

    try {
      const attachment = await attachFile(projectId, taskId, file);
      onAttachmentAdded?.(attachment);
      // Reset input
      e.target.value = "";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to upload file");
      console.error("Upload error:", err);
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async (attachment: Attachment) => {
    try {
      await removeAttachment(projectId, taskId, attachment);
      onAttachmentRemoved?.(attachment);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to remove attachment");
      console.error("Remove error:", err);
    }
  };

  return (
    <div style={{ marginTop: 8 }}>
      <label
        style={{
          display: "inline-block",
          padding: "4px 8px",
          backgroundColor: "#6366f1",
          color: "white",
          borderRadius: 4,
          cursor: uploading ? "not-allowed" : "pointer",
          opacity: uploading ? 0.6 : 1,
          fontSize: "0.85em",
        }}
      >
        {uploading ? "Uploading..." : "+ Attach File"}
        <input
          type="file"
          onChange={handleFileChange}
          disabled={uploading}
          style={{ display: "none" }}
        />
      </label>

      {error && (
        <div style={{ color: "#ef4444", fontSize: "0.85em", marginTop: 4 }}>
          {error}
        </div>
      )}

      {attachments.length > 0 && (
        <div style={{ marginTop: 8 }}>
          {attachments.map((att, idx) => (
            <div
              key={idx}
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                padding: "4px 8px",
                backgroundColor: "#2a2a2a",
                borderRadius: 4,
                marginTop: 4,
                fontSize: "0.85em",
              }}
            >
              <a
                href={att.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "#6366f1", textDecoration: "none" }}
              >
                {att.name}
              </a>
              <button
                onClick={() => handleRemove(att)}
                style={{
                  background: "none",
                  border: "none",
                  color: "#ef4444",
                  cursor: "pointer",
                  fontSize: "1em",
                  padding: "0 4px",
                }}
                aria-label={`Remove ${att.name}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


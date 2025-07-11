import { useState } from "react";
import { toast } from "react-toastify";

export interface UploadedFile {
  id: string;
  originalName: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export function useFileUpload(chatId: string | null, userId: string | null) {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);

  const validateFile = (file: File) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "text/plain",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast.error("Nieobsługiwany typ pliku");
      return false;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error("Plik zbyt duży (max 10MB)");
      return false;
    }
    return true;
  };

  const uploadFile = async (file: File) => {
    if (!chatId || !userId || !validateFile(file)) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("chatId", chatId);
    formData.append("userId", userId);

    try {
      const res = await fetch("http://localhost:3001/api/files/upload", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) throw new Error(await res.text());

      const newFile: UploadedFile = await res.json();
      setFiles((prev) => [...prev, newFile]);
      toast.success("Plik załadowany");
    } catch (error: any) {
      toast.error(error.message || "Błąd uploadu");
    } finally {
      setUploading(false);
    }
  };

  const removeFile = async (fileId: string) => {
    if (!userId) return;

    try {
      const res = await fetch(`http://localhost:3001/api/files/${fileId}`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) throw new Error(await res.text());

      setFiles((prev) => prev.filter((f) => f.id !== fileId));
      toast.info("Plik usunięty");
    } catch (error: any) {
      toast.error(error.message || "Błąd usuwania");
    }
  };

  return { files, uploading, uploadFile, removeFile };
}

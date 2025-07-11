import { useState, useCallback } from "react";
import { toast } from "react-toastify";

export interface FileUploadData {
  id: string;
  file: File;
  url: string;
  filename: string;
  mimetype: string;
  size: number;
  preview?: string; // URL do podglądu (dla obrazów)
  isUploading: boolean;
  uploadProgress: number;
  error?: string;
}

interface UseFileUploadReturn {
  files: FileUploadData[];
  isUploading: boolean;
  addFiles: (files: FileList | File[]) => void;
  removeFile: (fileId: string) => void;
  clearFiles: () => void;
  uploadFiles: (
    userId: string
  ) => Promise<{ success: boolean; uploadedFiles: any[] }>;
}

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/csv",
  "application/json",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
];

export const useFileUpload = (): UseFileUploadReturn => {
  const [files, setFiles] = useState<FileUploadData[]>([]);
  const [isUploading, setIsUploading] = useState(false);

  const validateFile = (file: File): string | null => {
    if (file.size > MAX_FILE_SIZE) {
      return `Plik "${file.name}" jest za duży. Maksymalny rozmiar to 10MB.`;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return `Plik "${file.name}" ma nieobsługiwany format. Dozwolone formaty: obrazy, PDF, TXT, CSV, JSON, DOCX, XLSX.`;
    }

    return null;
  };

  const createFilePreview = (file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith("image/")) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  };

  const addFiles = useCallback(async (newFiles: FileList | File[]) => {
    const fileArray = Array.from(newFiles);
    const validFiles: FileUploadData[] = [];

    for (const file of fileArray) {
      const validationError = validateFile(file);

      if (validationError) {
        toast.error(validationError);
        continue;
      }

      const preview = await createFilePreview(file);

      const fileData: FileUploadData = {
        id: `file-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        file,
        url: "", // Zostanie ustawione po przesłaniu
        filename: file.name,
        mimetype: file.type,
        size: file.size,
        preview,
        isUploading: false,
        uploadProgress: 0,
      };

      validFiles.push(fileData);
    }

    if (validFiles.length > 0) {
      setFiles((prev) => [...prev, ...validFiles]);
      toast.success(`Dodano ${validFiles.length} plik(ów) do wysłania`);
    }
  }, []);

  const removeFile = useCallback((fileId: string) => {
    setFiles((prev) => prev.filter((file) => file.id !== fileId));
  }, []);

  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  const uploadFiles = useCallback(
    async (
      userId: string
    ): Promise<{
      success: boolean;
      uploadedFiles: any[];
    }> => {
      if (files.length === 0) {
        return { success: true, uploadedFiles: [] };
      }

      setIsUploading(true);
      const uploadedFiles: any[] = [];
      let allSuccessful = true;

      try {
        for (const fileData of files) {
          // Oznacz plik jako przesyłany
          setFiles((prev) =>
            prev.map((f) =>
              f.id === fileData.id
                ? { ...f, isUploading: true, uploadProgress: 0 }
                : f
            )
          );

          try {
            const formData = new FormData();
            formData.append("file", fileData.file);
            formData.append("userId", userId);

            const response = await fetch(
              "http://localhost:3001/api/files/upload",
              {
                method: "POST",
                body: formData,
              }
            );

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || "Błąd przesyłania pliku");
            }

            const uploadResult = await response.json();
            uploadedFiles.push(uploadResult);

            // Oznacz plik jako przesłany
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id
                  ? {
                      ...f,
                      isUploading: false,
                      uploadProgress: 100,
                      url: uploadResult.url,
                    }
                  : f
              )
            );
          } catch (error: any) {
            console.error(
              `Błąd przesyłania pliku ${fileData.filename}:`,
              error
            );

            // Oznacz plik jako błędny
            setFiles((prev) =>
              prev.map((f) =>
                f.id === fileData.id
                  ? {
                      ...f,
                      isUploading: false,
                      uploadProgress: 0,
                      error: error.message,
                    }
                  : f
              )
            );

            allSuccessful = false;
            toast.error(`Nie udało się przesłać pliku: ${fileData.filename}`);
          }
        }

        return { success: allSuccessful, uploadedFiles };
      } finally {
        setIsUploading(false);
      }
    },
    [files]
  );

  return {
    files,
    isUploading,
    addFiles,
    removeFile,
    clearFiles,
    uploadFiles,
  };
};

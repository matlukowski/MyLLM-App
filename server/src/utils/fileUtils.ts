import fs from "fs";
import path from "path";
import sharp from "sharp";
import pdfParse from "pdf-parse";

export interface ProcessedFile {
  id: string;
  originalName: string;
  mimeType: string;
  fileSize: number;
  fileType: "TEXT" | "IMAGE";
  content?: string;
  filePath: string;
  base64Data?: string;
}

// Funkcja do określenia typu pliku
export function getFileType(mimeType: string): "TEXT" | "IMAGE" {
  if (mimeType.startsWith("image/")) {
    return "IMAGE";
  }
  return "TEXT";
}

// Funkcja do odczytu zawartości pliku tekstowego
export async function readTextFile(
  filePath: string,
  mimeType: string
): Promise<string> {
  try {
    if (mimeType === "application/pdf") {
      const dataBuffer = fs.readFileSync(filePath);
      const pdfData = await pdfParse(dataBuffer);
      return pdfData.text;
    } else if (mimeType === "text/plain" || mimeType.includes("text/")) {
      return fs.readFileSync(filePath, "utf8");
    } else if (
      mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Dla plików Word - podstawowa obsługa
      return "Zawartość pliku Word (wymagana dodatkowa implementacja do pełnego odczytu)";
    }
    return "";
  } catch (error) {
    console.error("Błąd odczytu pliku tekstowego:", error);
    return "";
  }
}

// Funkcja do przetwarzania obrazów
export async function processImage(
  filePath: string
): Promise<{ base64Data: string; content: string }> {
  try {
    // Konwertuj obraz do base64
    const imageBuffer = fs.readFileSync(filePath);
    const base64Data = imageBuffer.toString("base64");

    // Podstawowy opis obrazu (w przyszłości można dodać OCR)
    const metadata = await sharp(filePath).metadata();
    const content = `Obraz: ${metadata.width}x${metadata.height} pikseli, format: ${metadata.format}`;

    return { base64Data, content };
  } catch (error) {
    console.error("Błąd przetwarzania obrazu:", error);
    return { base64Data: "", content: "Błąd przetwarzania obrazu" };
  }
}

// Funkcja do przetwarzania pliku po uploadzie
export async function processUploadedFile(
  file: Express.Multer.File
): Promise<ProcessedFile> {
  const fileType = getFileType(file.mimetype);

  const processedFile: ProcessedFile = {
    id: generateFileId(),
    originalName: file.originalname,
    mimeType: file.mimetype,
    fileSize: file.size,
    fileType,
    filePath: file.path,
  };

  if (fileType === "IMAGE") {
    const imageData = await processImage(file.path);
    processedFile.base64Data = imageData.base64Data;
    processedFile.content = imageData.content;
  } else {
    processedFile.content = await readTextFile(file.path, file.mimetype);
  }

  return processedFile;
}

// Funkcja do generowania ID pliku
function generateFileId(): string {
  return `file_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

// Funkcja do tworzenia opisu pliku dla AI
export function createFileDescriptionForAI(file: ProcessedFile): string {
  if (file.fileType === "IMAGE") {
    return `[ZAŁĄCZONY OBRAZ: ${file.originalName}]
Typ: ${file.mimeType}
Rozmiar: ${(file.fileSize / 1024).toFixed(2)} KB
Opis: ${file.content || "Obraz do analizy"}

Uwaga: Użytkownik załączył obraz. Przeanalizuj go i odwołaj się do niego w swojej odpowiedzi.`;
  } else {
    return `[ZAŁĄCZONY PLIK: ${file.originalName}]
Typ: ${file.mimeType}
Rozmiar: ${(file.fileSize / 1024).toFixed(2)} KB
Zawartość:
${file.content || "Brak zawartości"}

Uwaga: Użytkownik załączył plik tekstowy. Przeanalizuj jego zawartość i odwołaj się do niej w swojej odpowiedzi.`;
  }
}

// Funkcja do czyszczenia starych plików
export function cleanupOldFiles(
  uploadsDir: string,
  maxAgeHours: number = 24
): void {
  try {
    const files = fs.readdirSync(uploadsDir);
    const now = Date.now();

    files.forEach((file) => {
      const filePath = path.join(uploadsDir, file);
      const stats = fs.statSync(filePath);
      const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);

      if (ageHours > maxAgeHours) {
        fs.unlinkSync(filePath);
        console.log(`Usunięto stary plik: ${file}`);
      }
    });
  } catch (error) {
    console.error("Błąd czyszczenia starych plików:", error);
  }
}

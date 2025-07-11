import fs from "fs";
import path from "path";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";
// @ts-ignore
import mammoth from "mammoth";
// @ts-ignore
import pdfParse from "pdf-parse";
// @ts-ignore
import XLSX from "xlsx";

// Konfiguracja multer dla przesyłania plików
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, "../../uploads");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${uuidv4()}-${Date.now()}`;
    const extension = path.extname(file.originalname);
    cb(null, `${uniqueSuffix}${extension}`);
  },
});

const fileFilter = (req: any, file: any, cb: any) => {
  const allowedTypes = [
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

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error("Nieobsługiwany typ pliku"), false);
  }
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
});

// Funkcja do konwersji pliku na tekst dla AI
export const convertFileToText = async (
  filePath: string,
  mimetype: string
): Promise<string> => {
  try {
    if (
      mimetype === "text/plain" ||
      mimetype === "text/csv" ||
      mimetype === "application/json"
    ) {
      // Zwykłe pliki tekstowe
      return fs.readFileSync(filePath, "utf8");
    }

    if (mimetype === "application/pdf") {
      // Dla PDF - odczytaj zawartość
      try {
        const dataBuffer = fs.readFileSync(filePath);
        const pdfData = await pdfParse(dataBuffer);
        const text = pdfData.text;
        const stats = fs.statSync(filePath);

        if (text && text.trim()) {
          return `[PLIK PDF: ${path.basename(
            filePath
          )}, rozmiar: ${formatFileSize(stats.size)}]

Zawartość dokumentu PDF:
${text}`;
        } else {
          return `[PLIK PDF: ${path.basename(
            filePath
          )}, rozmiar: ${formatFileSize(stats.size)}]

Plik PDF wydaje się być pusty lub nie zawiera tekstu do odczytania (może zawierać tylko obrazy).`;
        }
      } catch (error) {
        console.error("Błąd odczytywania pliku PDF:", error);
        const stats = fs.statSync(filePath);
        return `[PLIK PDF: ${path.basename(
          filePath
        )}, rozmiar: ${formatFileSize(stats.size)}]
        
Uwaga: Wystąpił błąd podczas odczytywania zawartości pliku PDF. Możesz opisać mi zawartość, a ja pomogę w analizie.`;
      }
    }

    if (mimetype.startsWith("image/")) {
      // Dla obrazów - zwróć informację o pliku
      const stats = fs.statSync(filePath);
      return `[OBRAZ: ${path.basename(
        filePath
      )}, typ: ${mimetype}, rozmiar: ${formatFileSize(stats.size)}]
      
Widzę, że przesłałeś obraz. Mogę odpowiedzieć na pytania dotyczące obrazów, formatów graficznych, lub pomóc w analizie jeśli opiszesz mi co przedstawia obraz.`;
    }

    if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      // Dla DOCX - odczytaj zawartość
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        const text = result.value;
        const stats = fs.statSync(filePath);

        if (text && text.trim()) {
          return `[DOKUMENT WORD: ${path.basename(
            filePath
          )}, rozmiar: ${formatFileSize(stats.size)}]

Zawartość dokumentu:
${text}`;
        } else {
          return `[DOKUMENT WORD: ${path.basename(
            filePath
          )}, rozmiar: ${formatFileSize(stats.size)}]

Dokument wydaje się być pusty lub nie zawiera tekstu do odczytania.`;
        }
      } catch (error) {
        console.error("Błąd odczytywania pliku DOCX:", error);
        const stats = fs.statSync(filePath);
        return `[DOKUMENT WORD: ${path.basename(
          filePath
        )}, rozmiar: ${formatFileSize(stats.size)}]
        
Uwaga: Wystąpił błąd podczas odczytywania zawartości dokumentu Word. Możesz opisać mi zawartość, a ja pomogę w analizie.`;
      }
    }

    if (
      mimetype ===
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    ) {
      // Dla XLSX - odczytaj zawartość
      try {
        const workbook = XLSX.readFile(filePath);
        const stats = fs.statSync(filePath);
        let content = `[ARKUSZ EXCEL: ${path.basename(
          filePath
        )}, rozmiar: ${formatFileSize(stats.size)}]

Zawartość arkusza Excel:
`;

        // Przejdź przez wszystkie arkusze
        workbook.SheetNames.forEach((sheetName, index) => {
          const sheet = workbook.Sheets[sheetName];
          const csvData = XLSX.utils.sheet_to_csv(sheet);

          if (csvData && csvData.trim()) {
            content += `\n--- Arkusz: ${sheetName} ---\n${csvData}\n`;
          } else {
            content += `\n--- Arkusz: ${sheetName} ---\n(Arkusz pusty)\n`;
          }
        });

        return content;
      } catch (error) {
        console.error("Błąd odczytywania pliku Excel:", error);
        const stats = fs.statSync(filePath);
        return `[ARKUSZ EXCEL: ${path.basename(
          filePath
        )}, rozmiar: ${formatFileSize(stats.size)}]
        
Uwaga: Wystąpił błąd podczas odczytywania zawartości arkusza Excel. Możesz opisać mi zawartość, a ja pomogę w analizie.`;
      }
    }

    // Domyślnie zwróć informację o pliku
    const stats = fs.statSync(filePath);
    return `[PLIK: ${path.basename(
      filePath
    )}, typ: ${mimetype}, rozmiar: ${formatFileSize(stats.size)}]
    
Przesłałeś plik, ale nie mogę bezpośrednio odczytać jego zawartości. Mogę jednak pomóc w analizie lub odpowiedzieć na pytania jeśli opiszesz mi zawartość pliku.`;
  } catch (error) {
    console.error("Błąd podczas konwersji pliku na tekst:", error);
    return `[BŁĄD: Nie udało się odczytać pliku ${path.basename(filePath)}]`;
  }
};

// Funkcja do formatowania rozmiaru pliku
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return "0 B";

  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

// Funkcja do walidacji pliku
export const validateFile = (
  file: Express.Multer.File
): { isValid: boolean; error?: string } => {
  const allowedTypes = [
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

  if (!allowedTypes.includes(file.mimetype)) {
    return {
      isValid: false,
      error:
        "Nieobsługiwany typ pliku. Dozwolone: obrazy, PDF, TXT, CSV, JSON, DOCX, XLSX",
    };
  }

  if (file.size > 10 * 1024 * 1024) {
    return {
      isValid: false,
      error: "Plik jest za duży. Maksymalny rozmiar to 10MB",
    };
  }

  return { isValid: true };
};

// Funkcja do usuwania pliku z dysku
export const deleteFile = (filePath: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    fs.unlink(filePath, (err) => {
      if (err) {
        console.error("Błąd podczas usuwania pliku:", err);
        reject(err);
      } else {
        resolve();
      }
    });
  });
};

// Funkcja do sprawdzania czy plik istnieje
export const fileExists = (filePath: string): boolean => {
  return fs.existsSync(filePath);
};

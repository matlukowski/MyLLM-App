import express, { Express, Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import path from "path";
import {
  upload,
  convertFileToText,
  formatFileSize,
  validateFile,
  deleteFile,
  fileExists,
} from "./utils/fileUtils";
import VectorMemoryService from "./services/VectorMemoryService";
import IntentAnalyzer, { type MemoryAggressiveness } from "./services/IntentAnalyzer";

// Inicjalizacje
const prisma = new PrismaClient();
const app: Express = express();
const vectorMemoryService = new VectorMemoryService(prisma);

// Inicjalizacja serwisu pamięci wektorowej w tle
(async () => {
  try {
    console.log('🧠 Rozpoczynam inicjalizację VectorMemoryService...');
    await vectorMemoryService.initialize();
    console.log('✅ VectorMemoryService zainicjalizowany poprawnie');
  } catch (error) {
    console.error('❌ Nie udało się zainicjalizować VectorMemoryService:', error);
    console.log('⚠️  Aplikacja będzie działać bez pamięci wektorowej');
    console.log('💡 Spróbuj ponownie uruchomić serwer - pierwszy model może być pobierany');
  }
})();

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
  })
);
app.use(express.json());

// Serwowanie statycznych plików z katalogu uploads
app.use("/uploads", express.static(path.join(__dirname, "../uploads")));

// --- API Endpoints ---

// Endpoint logowania użytkownika
app.post("/api/users/login", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  console.log("🔐 Próba logowania:", { username, password });

  if (!username || !password) {
    console.log("❌ Brak username lub password");
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  try {
    // Sprawdź wszystkich użytkowników w bazie
    const allUsers = await prisma.user.findMany({
      select: { id: true, username: true },
    });
    console.log("👥 Wszyscy użytkownicy w bazie:", allUsers);

    // Znajdź użytkownika po nazwie użytkownika
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, passwordHash: true },
    });

    console.log("🔍 Znaleziony użytkownik:", user);

    if (!user) {
      console.log("❌ Użytkownik nie znaleziony");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    // Sprawdź hasło
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      console.log("❌ Nieprawidłowe hasło");
      return res.status(401).json({ error: "Invalid username or password" });
    }

    console.log("✅ Logowanie udane");
    res.json({ id: user.id, username: user.username });
  } catch (error) {
    console.error("💥 Error during login:", error);
    res.status(500).json({ error: "Could not process login" });
  }
});

// Endpoint rejestracji użytkownika
app.post("/api/users/register", async (req: Request, res: Response) => {
  const { username, password } = req.body;

  console.log("📝 Próba rejestracji:", { username });

  if (!username || !password) {
    console.log("❌ Brak username lub password");
    return res
      .status(400)
      .json({ error: "Username and password are required" });
  }

  if (password.length < 6) {
    console.log("❌ Hasło za krótkie");
    return res
      .status(400)
      .json({ error: "Password must be at least 6 characters long" });
  }

  try {
    // Sprawdź czy użytkownik już istnieje
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      console.log("❌ Użytkownik już istnieje");
      return res.status(409).json({ error: "Username already exists" });
    }

    // Zahashuj hasło
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // Utwórz nowego użytkownika
    const newUser = await prisma.user.create({
      data: {
        username,
        passwordHash,
      },
      select: {
        id: true,
        username: true,
        createdAt: true,
      },
    });

    console.log("✅ Rejestracja udana:", newUser);
    res.status(201).json(newUser);
  } catch (error) {
    console.error("💥 Error during registration:", error);
    res.status(500).json({ error: "Could not process registration" });
  }
});

// Pobierz listę czatów dla zalogowanego użytkownika
app.get("/api/chats", async (req: Request, res: Response) => {
  // Pobierz ID użytkownika z query parametru lub headera
  const loggedInUserId =
    (req.query.userId as string) || (req.headers["user-id"] as string);

  if (!loggedInUserId) {
    return res.status(401).json({ error: "User ID is required" });
  }

  try {
    const userChatParticipants = await prisma.chatParticipant.findMany({
      where: { userId: loggedInUserId },
      orderBy: { chat: { updatedAt: "desc" } },
      include: {
        chat: {
          include: {
            participants: {
              include: {
                user: { select: { id: true, username: true } },
              },
            },
            messages: {
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
        },
      },
    });

    const chats = userChatParticipants.map((p) => {
      const chat = p.chat as any; // Rzutowanie typu, aby uzyskać dostęp do pól title i metadata
      const lastMessage = chat.messages[0];
      const metadata = chat.metadata as any;

      return {
        id: chat.id,
        title: chat.title || "Nowa rozmowa",
        lastMessage: lastMessage?.content || "",
        lastMessageTime: lastMessage?.createdAt || chat.createdAt,
        messageCount: chat.messages.length,
        modelId: metadata?.modelId || "unknown",
        userId: loggedInUserId,
        isAIChat: metadata?.isAIChat || false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.json(chats);
  } catch (error) {
    console.error("Error fetching chats:", error);
    res.status(500).json({ error: "Could not fetch chats" });
  }
});

// Pobierz wiadomości dla konkretnego czatu (z paginacją)
app.get("/api/chats/:chatId/messages", async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { cursor } = req.query; // Dla paginacji (ID ostatniej wiadomości)

  try {
    // TODO: W prawdziwej aplikacji sprawdź, czy użytkownik ma dostęp do tego czatu
    const messages = await prisma.message.findMany({
      where: { chatId },
      take: 30,
      ...(cursor && { skip: 1, cursor: { id: String(cursor) } }),
      orderBy: { createdAt: "desc" },
      include: { sender: { select: { id: true, username: true } } },
    });
    res.json(messages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

// Endpoint do tworzenia nowego czatu AI
app.post("/api/ai/chats", async (req: Request, res: Response) => {
  const { userId, title, modelId } = req.body;

  if (!userId || !title || !modelId) {
    return res.status(400).json({
      error: "userId, title i modelId są wymagane",
    });
  }

  try {
    // Utwórz nowy czat AI
    const newChat = await prisma.chat.create({
      data: {
        title,
        participants: {
          create: [
            { userId },
            { userId: "ai-assistant" }, // Specjalny ID dla AI
          ],
        },
        // Dodaj metadane czatu AI
        metadata: {
          modelId,
          isAIChat: true,
        },
      } as any, // Rzutowanie typu dla pól title i metadata
      include: {
        participants: {
          include: {
            user: { select: { id: true, username: true } },
          },
        },
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    console.log("✅ Utworzono nowy czat AI:", newChat.id);
    res.status(201).json(newChat);
  } catch (error) {
    console.error("❌ Błąd tworzenia czatu AI:", error);
    res.status(500).json({ error: "Nie udało się utworzyć czatu AI" });
  }
});

// Endpoint do usuwania czatu
app.delete("/api/chats/:chatId", async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId jest wymagany" });
  }

  try {
    // Sprawdź czy czat istnieje i czy użytkownik ma do niego dostęp
    const chat = await prisma.chat.findFirst({
      where: {
        id: chatId,
        participants: {
          some: { userId: userId },
        },
      },
    });

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Czat nie został znaleziony lub brak dostępu" });
    }

    // Sprawdź czy użytkownik chce automatycznie usuwać pamięć
    let memoryDeletedCount = 0;
    if (vectorMemoryService.isReady()) {
      try {
        const userSettings = await prisma.memorySettings.findUnique({
          where: { userId }
        });
        
        if (userSettings?.autoDeleteOnChatRemoval !== false) {
          // Domyślnie usuń pamięć (chyba że użytkownik wyłączył)
          memoryDeletedCount = await vectorMemoryService.deleteMemoryByChat(chatId, userId);
          console.log(`🗑️ Automatycznie usunięto pamięć czatu (ustawienie: ${userSettings?.autoDeleteOnChatRemoval})`);
        } else {
          console.log(`🔒 Zachowano pamięć czatu (ustawienie użytkownika)`);
        }
      } catch (error) {
        console.error("❌ Błąd usuwania pamięci wektorowej:", error);
        // Nie przerywamy procesu - pamięć można wyczyścić później
      }
    }

    // Usuń wszystkie wiadomości z czatu
    await prisma.message.deleteMany({
      where: { chatId },
    });

    // Usuń wszystkich uczestników czatu
    await prisma.chatParticipant.deleteMany({
      where: { chatId },
    });

    // Usuń czat
    await prisma.chat.delete({
      where: { id: chatId },
    });

    console.log("✅ Usunięto czat:", chatId, `(${memoryDeletedCount} wpisów pamięci)`);
    res.json({ 
      message: "Czat został usunięty",
      memoryEntriesDeleted: memoryDeletedCount
    });
  } catch (error) {
    console.error("❌ Błąd podczas usuwania czatu:", error);
    res.status(500).json({ error: "Nie udało się usunąć czatu" });
  }
});

// Funkcja do generowania odpowiedzi AI z pamięcią wektorową
async function generateAIResponseWithMemory(
  userMessage: string,
  provider: string,
  apiKey: string,
  modelId: string,
  userId: string,
  chatId: string,
  attachments: any[] = []
): Promise<string> {
  const basicPrompt = `Jesteś inteligentnym asystentem AI. Odpowiadaj w sposób rzeczowy, pomocny i praktyczny.
Jeśli otrzymasz kontekst z poprzednich rozmów, wykorzystaj te informacje naturalnie.
Dostosowuj długość odpowiedzi do złożoności pytania. Bądź pozytywny i motywujący, ale unikaj przesadnej empatii czy rozczulania się.
Skupiaj się na rozwiązaniach i praktycznych poradach zamiast na współczuciu.`;

  // Przetwórz załączniki
  let attachmentContext = "";
  if (attachments && attachments.length > 0) {
    attachmentContext = "\n\nZałączniki użytkownika:\n";

    for (const attachment of attachments) {
      try {
        const filePath = path.join(
          __dirname,
          "../uploads",
          path.basename(attachment.url)
        );
        if (fileExists(filePath)) {
          const fileContent = await convertFileToText(
            filePath,
            attachment.mimetype
          );
          attachmentContext += `\n${fileContent}\n`;
        } else {
          attachmentContext += `\n[BŁĄD: Plik ${attachment.filename} nie został znaleziony]\n`;
        }
      } catch (error) {
        console.error(
          `Błąd przetwarzania załącznika ${attachment.filename}:`,
          error
        );
        attachmentContext += `\n[BŁĄD: Nie udało się przetworzyć pliku ${attachment.filename}]\n`;
      }
    }
  }

  // NOWA LOGIKA: Inteligentne wybieranie źródła kontekstu
  let memoryContext = "";
  
  try {
    // 1. Pobierz długość historii aktualnego czatu
    const chatHistoryCount = await prisma.message.count({
      where: { chatId }
    });

    // 2. Pobierz ustawienia użytkownika
    const userSettings = await prisma.memorySettings.findUnique({
      where: { userId }
    });
    
    const aggressiveness = (userSettings?.memoryAggressiveness || 'conservative') as MemoryAggressiveness;

    // 3. Analizuj intencję użytkownika
    const intentAnalysis = IntentAnalyzer.analyzeIntent(
      userMessage,
      chatHistoryCount,
      aggressiveness
    );

    console.log(`🧐 Analiza intencji: ${intentAnalysis.detectedIntent} (ufność: ${intentAnalysis.confidence.toFixed(2)})`);
    console.log(`💡 Uzasadnienie: ${intentAnalysis.reasoning}`);

    // 4. Pobierz kontekst na podstawie analizy intencji
    if (intentAnalysis.useVectorMemory && vectorMemoryService.isReady()) {
      // Użyj pamięci wektorowej
      memoryContext = await vectorMemoryService.getMemoryContext(
        userMessage,
        userId,
        intentAnalysis.useChatHistory ? undefined : chatId, // Globalne vs lokalne
        1500
      );
      
      if (memoryContext) {
        console.log(`🧠 Używam pamięci wektorowej (${memoryContext.length} znaków)`);
      } else {
        console.log(`🤷 Pamięć wektorowa nie znalazła relevant kontekstu`);
      }
    }
    
    // 5. Fallback do historii czatu jeśli nie ma kontekstu z pamięci wektorowej
    if (!memoryContext && intentAnalysis.useChatHistory && chatHistoryCount > 1) {
      const recentMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        take: 6,
        include: { sender: { select: { username: true } } }
      });

      if (recentMessages.length > 1) {
        const chatHistory = recentMessages
          .reverse()
          .slice(0, -1) // Usuń aktualną wiadomość użytkownika
          .map(msg => `${(msg.sender as any)?.username || 'AI'}: ${msg.content}`)
          .join('\n');
        
        if (chatHistory) {
          memoryContext = `Historia z tego czatu:\n\n${chatHistory}`;
          console.log(`📜 Używam historii czatu (${memoryContext.length} znaków)`);
        }
      }
    }

    // 6. Loguj końcową decyzję
    if (!memoryContext) {
      console.log(`🆕 Brak dodatkowego kontekstu - traktuj jako nowe pytanie`);
    }

  } catch (error) {
    console.error('❌ Błąd analizy intencji lub pobierania kontekstu:', error);
    
    // Emergency fallback - historia czatu jeśli wszystko inne zawiedzie
    try {
      const recentMessages = await prisma.message.findMany({
        where: { chatId },
        orderBy: { createdAt: 'desc' },
        take: 4,
        include: { sender: { select: { username: true } } }
      });

      if (recentMessages.length > 1) {
        const chatHistory = recentMessages
          .reverse()
          .slice(0, -1)
          .map(msg => `${(msg.sender as any)?.username || 'AI'}: ${msg.content}`)
          .join('\n');
        
        if (chatHistory) {
          memoryContext = `Historia z tego czatu:\n\n${chatHistory}`;
          console.log(`🆘 Emergency fallback - historia czatu (${memoryContext.length} znaków)`);
        }
      }
    } catch (fallbackError) {
      console.error('❌ Nawet fallback nie zadziałał:', fallbackError);
    }
  }

  // Buduj pełną wiadomość z kontekstem
  let fullMessage = userMessage;
  
  if (memoryContext) {
    fullMessage = `${memoryContext}\n\n---\n\nBieżące pytanie użytkownika: ${userMessage}`;
  }
  
  fullMessage += attachmentContext;

  if (provider === "google") {
    try {
      const { GoogleGenerativeAI } = await import("@google/generative-ai");
      const genAI = new GoogleGenerativeAI(apiKey);

      // Mapowanie modeli Gemini
      const geminiModels = {
        "gemini-2.5-flash": "gemini-1.5-flash",
        "gemini-2.5-pro": "gemini-1.5-pro",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-1.5-pro": "gemini-1.5-pro",
      };
      const modelName =
        geminiModels[modelId as keyof typeof geminiModels] ||
        "gemini-1.5-flash";

      const model = genAI.getGenerativeModel({
        model: modelName,
        systemInstruction: basicPrompt,
        generationConfig: {
          maxOutputTokens: 4000,
          temperature: 0.7,
        },
      });

      const result = await model.generateContent(fullMessage);
      return (
        result.response.text() ||
        "Przepraszam, nie mogę wygenerować odpowiedzi."
      );
    } catch (error) {
      throw new Error(`Błąd Google Gemini: ${error}`);
    }
  } else if (provider === "openai") {
    try {
      const { OpenAI } = await import("openai");
      const openai = new OpenAI({ apiKey });

      const modelMapping = {
        "gpt-4.1": "gpt-4",
        "gpt-4": "gpt-4",
        "gpt-3.5-turbo": "gpt-3.5-turbo",
      };
      const openaiModel =
        modelMapping[modelId as keyof typeof modelMapping] || "gpt-4";

      const response = await openai.chat.completions.create({
        model: openaiModel,
        messages: [
          { role: "system", content: basicPrompt },
          { role: "user", content: fullMessage },
        ],
        temperature: 0.7,
        max_tokens: 4000,
      });

      return (
        response.choices[0]?.message?.content ||
        "Przepraszam, nie mogę wygenerować odpowiedzi."
      );
    } catch (error) {
      throw new Error(`Błąd OpenAI: ${error}`);
    }
  } else if (provider === "anthropic") {
    try {
      const { Anthropic } = await import("@anthropic-ai/sdk");
      const anthropic = new Anthropic({ apiKey });

      const modelMapping = {
        "claude-3.5-sonnet": "claude-3-5-sonnet-20241022",
        "claude-3.5-haiku": "claude-3-5-haiku-20241022",
      };
      const claudeModel =
        modelMapping[modelId as keyof typeof modelMapping] ||
        "claude-3-5-sonnet-20241022";

      const response = await anthropic.messages.create({
        model: claudeModel,
        max_tokens: 4000,
        system: basicPrompt,
        messages: [{ role: "user", content: fullMessage }],
      });

      const content = response.content[0];
      if (content.type === "text") {
        return content.text;
      }
      return "Przepraszam, nie mogę wygenerować odpowiedzi.";
    } catch (error) {
      throw new Error(`Błąd Anthropic: ${error}`);
    }
  } else {
    throw new Error(`Nieobsługiwany dostawca: ${provider}`);
  }
}

// --- Endpointy do obsługi plików ---

// Endpoint do przesyłania plików
app.post("/api/files/upload", (req: Request, res: Response) => {
  // @ts-ignore - Konflikt typów między wersjami Express
  const uploadHandler = upload.single("file");

  // @ts-ignore - Konflikt typów między wersjami Express
  uploadHandler(req, res, async (err: any) => {
    try {
      if (err) {
        console.error("❌ Błąd multer:", err);
        return res
          .status(400)
          .json({ error: err.message || "Błąd przesyłania pliku" });
      }

      const file = (req as any).file;
      if (!file) {
        return res.status(400).json({ error: "Nie przesłano pliku" });
      }

      // Pobierz userId z body (będzie wysłany przez frontend)
      const userId = (req as any).body?.userId;
      if (!userId) {
        return res.status(400).json({ error: "userId jest wymagany" });
      }

      // Walidacja pliku
      const validation = validateFile(file);
      if (!validation.isValid) {
        // Usuń plik jeśli walidacja nie powiodła się
        if (fileExists(file.path)) {
          await deleteFile(file.path);
        }
        return res.status(400).json({ error: validation.error });
      }

      // Znajdź lub utwórz tymczasowy czat dla załączników
      let tempChat = await prisma.chat.findFirst({
        where: { title: "TEMP_ATTACHMENTS" },
      });

      if (!tempChat) {
        tempChat = await prisma.chat.create({
          data: {
            title: "TEMP_ATTACHMENTS",
            metadata: { isTemp: true },
          },
        });
      }

      // Utwórz tymczasową wiadomość dla załącznika
      const tempMessage = await prisma.message.create({
        data: {
          content: `[TEMP_ATTACHMENT_${Date.now()}]`,
          senderId: userId,
          chatId: tempChat.id,
        },
      });

      // Utwórz rekord w bazie danych
      const attachment = await prisma.attachment.create({
        data: {
          url: `/uploads/${file.filename}`,
          filename: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          messageId: tempMessage.id,
        },
      });

      console.log("✅ Plik przesłany:", {
        id: attachment.id,
        filename: attachment.filename,
        size: formatFileSize(attachment.size),
      });

      res.json({
        id: attachment.id,
        url: attachment.url,
        filename: attachment.filename,
        mimetype: attachment.mimetype,
        size: attachment.size,
        formattedSize: formatFileSize(attachment.size),
      });
    } catch (error: any) {
      console.error("❌ Błąd przesyłania pliku:", error);

      // Usuń plik w przypadku błędu
      const file = (req as any).file;
      if (file && fileExists(file.path)) {
        try {
          await deleteFile(file.path);
        } catch (deleteError) {
          console.error("❌ Błąd usuwania pliku po błędzie:", deleteError);
        }
      }

      res.status(500).json({ error: "Błąd podczas przesyłania pliku" });
    }
  });
});

// Endpoint do usuwania plików
app.delete("/api/files/:fileId", async (req: Request, res: Response) => {
  const { fileId } = req.params;

  try {
    // Znajdź plik w bazie danych
    const attachment = await prisma.attachment.findUnique({
      where: { id: fileId },
    });

    if (!attachment) {
      return res.status(404).json({ error: "Plik nie został znaleziony" });
    }

    // Usuń plik z dysku
    const filePath = path.join(
      __dirname,
      "../uploads",
      path.basename(attachment.url)
    );
    if (fileExists(filePath)) {
      await deleteFile(filePath);
    }

    // Usuń rekord z bazy danych
    await prisma.attachment.delete({
      where: { id: fileId },
    });

    console.log("✅ Plik usunięty:", attachment.filename);
    res.json({ message: "Plik został usunięty" });
  } catch (error: any) {
    console.error("❌ Błąd usuwania pliku:", error);
    res.status(500).json({ error: "Błąd podczas usuwania pliku" });
  }
});

// Prosty endpoint do czatu z AI - bez pamięci wektorowej
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const {
    userId,
    modelId,
    userMessage,
    chatId,
    apiKey,
    provider,
    attachments,
  } = req.body;

  if (!userId || !modelId || !userMessage) {
    return res.status(400).json({
      error: "userId, modelId i userMessage są wymagane",
    });
  }

  // Walidacja klucza API w zależności od dostawcy
  if (!apiKey) {
    return res.status(400).json({
      error: `Brak klucza API dla dostawcy ${
        provider || "nieznany"
      }. Proszę skonfigurować klucz API.`,
    });
  }

  try {
    let currentChatId = chatId;
    let chatTitle = "";

    // Jeśli nie ma chatId, utwórz nowy czat
    if (!currentChatId) {
      chatTitle =
        userMessage.length > 50
          ? userMessage.substring(0, 50) + "..."
          : userMessage;

      const newChat = await prisma.chat.create({
        data: {
          title: chatTitle,
          participants: {
            create: [{ userId }, { userId: "ai-assistant" }],
          },
          metadata: {
            modelId,
            isAIChat: true,
          },
        } as any,
      });

      currentChatId = newChat.id;
      console.log("✅ Utworzono nowy czat AI:", currentChatId);
    }

    // Zapisz wiadomość użytkownika
    const userMessageRecord = await prisma.message.create({
      data: {
        content: userMessage,
        senderId: userId,
        chatId: currentChatId,
      },
    });

    // Jeśli są załączniki, zaktualizuj je aby wskazywały na nową wiadomość
    if (attachments && attachments.length > 0) {
      const attachmentIds = attachments.map((att: any) => att.id);

      // Zaktualizuj załączniki aby wskazywały na nową wiadomość użytkownika
      await prisma.attachment.updateMany({
        where: { id: { in: attachmentIds } },
        data: { messageId: userMessageRecord.id },
      });

      // Usuń tymczasowe wiadomości (opcjonalne - dla porządku)
      const tempMessageIds = await prisma.attachment.findMany({
        where: { id: { in: attachmentIds } },
        select: { messageId: true },
      });

      const uniqueTempMessageIds = [
        ...new Set(tempMessageIds.map((att) => att.messageId)),
      ];

      // Sprawdź czy to są tymczasowe wiadomości i usuń je
      for (const messageId of uniqueTempMessageIds) {
        if (!messageId) continue;

        const message = await prisma.message.findUnique({
          where: { id: messageId },
          include: { attachments: true },
        });

        if (
          message &&
          message.content.startsWith("[TEMP_ATTACHMENT_") &&
          (message as any).attachments.length === 0
        ) {
          await prisma.message.delete({
            where: { id: messageId },
          });
        }
      }

      console.log(
        `✅ Zaktualizowano ${attachmentIds.length} załączników dla wiadomości ${userMessageRecord.id}`
      );
    }

    // Generuj prostą odpowiedź AI bez pamięci wektorowej
    let aiResponse = "";

    try {
      console.log("🤖 Generowanie odpowiedzi AI:", {
        chatId: currentChatId,
        provider: provider,
        modelId: modelId,
      });

      // Nowa implementacja z pamięcią wektorową
      aiResponse = await generateAIResponseWithMemory(
        userMessage,
        provider,
        apiKey,
        modelId,
        userId,
        currentChatId,
        attachments
      );

      if (!aiResponse || !aiResponse.trim()) {
        aiResponse = "Przepraszam, nie udało mi się wygenerować odpowiedzi.";
      }
    } catch (aiError: any) {
      console.error(
        "❌ Błąd podczas generowania odpowiedzi AI:",
        aiError.message
      );

      return res.status(500).json({
        error: "Błąd podczas generowania odpowiedzi AI. Sprawdź klucz API.",
      });
    }

    // Zapisz odpowiedź AI
    const aiMessageRecord = await prisma.message.create({
      data: {
        content: aiResponse,
        senderId: "ai-assistant",
        chatId: currentChatId,
      },
    });

    // Zapisz wiadomości do pamięci wektorowej (asynchronicznie)
    if (vectorMemoryService.isReady()) {
      // Pobierz kontekst (kilka poprzednich wiadomości)
      const recentMessages = await prisma.message.findMany({
        where: { chatId: currentChatId },
        orderBy: { createdAt: 'desc' },
        take: 3,
        include: { sender: { select: { username: true } } }
      });
      
      const context = recentMessages
        .reverse()
        .map(msg => `${(msg.sender as any)?.username || 'AI'}: ${msg.content}`)
        .join('\n');

      // Zapisz wiadomość użytkownika do pamięci (asynchronicznie)
      vectorMemoryService.addMemoryEntry(
        userMessage,
        userId,
        currentChatId,
        userMessageRecord.id,
        context
      ).catch(error => {
        console.error('❌ Błąd zapisywania wiadomości użytkownika do pamięci:', error);
      });

      // Zapisz odpowiedź AI do pamięci jako część konwersacji użytkownika (asynchronicznie)
      vectorMemoryService.addMemoryEntry(
        `AI odpowiedział: ${aiResponse}`, // Oznacz że to odpowiedź AI
        userId, // Zapisz jako część pamięci użytkownika
        currentChatId,
        aiMessageRecord.id,
        context
      ).catch(error => {
        console.error('❌ Błąd zapisywania odpowiedzi AI do pamięci:', error);
      });
    }

    // Zaktualizuj czas ostatniej modyfikacji czatu
    await prisma.chat.update({
      where: { id: currentChatId },
      data: { updatedAt: new Date() },
    });

    console.log("✅ Odpowiedź AI wygenerowana:", {
      responseLength: aiResponse.length,
      chatId: currentChatId,
      provider: provider,
      memoryEnabled: vectorMemoryService.isReady()
    });

    res.json({
      response: aiResponse,
      modelId,
      chatId: currentChatId,
      chatTitle: chatTitle || undefined,
    });
  } catch (error: any) {
    console.error("❌ Błąd przetwarzania żądania AI:", error.message);
    res.status(500).json({
      error: "Wystąpił błąd podczas przetwarzania żądania AI",
    });
  }
});

// --- Endpointy do zarządzania pamięcią wektorową ---

// TESTOWY endpoint do ręcznego sprawdzenia pamięci
app.post("/api/memory/test", async (req: Request, res: Response) => {
  const { userId, content } = req.body;

  if (!userId || !content) {
    return res.status(400).json({ error: "userId i content są wymagane" });
  }

  try {
    console.log(`🧪 TEST: Dodaję do pamięci: "${content}"`);
    
    if (vectorMemoryService.isReady()) {
      const result = await vectorMemoryService.addMemoryEntry(
        content,
        userId,
        "test-chat",
        undefined,
        "Test context"
      );
      
      res.json({ 
        success: true, 
        result,
        message: "Wpis dodany do pamięci" 
      });
    } else {
      res.json({ 
        success: false, 
        message: "Serwis pamięci wektorowej nie jest gotowy" 
      });
    }
  } catch (error) {
    console.error("❌ Błąd testu pamięci:", error);
    res.status(500).json({ error: "Błąd testu pamięci" });
  }
});

// Endpoint do wyszukiwania w pamięci
app.post("/api/memory/search", async (req: Request, res: Response) => {
  const { query, userId, chatId, limit = 10, minImportance = 0.3 } = req.body;

  if (!query || !userId) {
    return res.status(400).json({ error: "query i userId są wymagane" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const results = await vectorMemoryService.searchMemory(query, {
      userId,
      chatId,
      limit,
      minImportance
    });

    res.json({ results, count: results.length });
  } catch (error) {
    console.error("❌ Błąd wyszukiwania w pamięci:", error);
    res.status(500).json({ error: "Błąd podczas wyszukiwania w pamięci" });
  }
});

// Endpoint do czyszczenia pamięci użytkownika (stare wpisy)
app.delete("/api/memory/cleanup/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.cleanupMemory(userId);
    res.json({ message: `Wyczyszczono ${deletedCount} starych wpisów z pamięci`, deletedCount });
  } catch (error) {
    console.error("❌ Błąd czyszczenia pamięci:", error);
    res.status(500).json({ error: "Błąd podczas czyszczenia pamięci" });
  }
});

// Endpoint do usuwania pamięci konkretnego czatu
app.delete("/api/memory/chat/:chatId", async (req: Request, res: Response) => {
  const { chatId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId jest wymagany" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteMemoryByChat(chatId, userId);
    res.json({ 
      message: `Usunięto pamięć z czatu ${chatId}`, 
      deletedCount,
      chatId 
    });
  } catch (error) {
    console.error("❌ Błąd usuwania pamięci czatu:", error);
    res.status(500).json({ error: "Błąd podczas usuwania pamięci czatu" });
  }
});

// Endpoint do usuwania pamięci konkretnej wiadomości
app.delete("/api/memory/message/:messageId", async (req: Request, res: Response) => {
  const { messageId } = req.params;
  const { userId } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId jest wymagany" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteMemoryByMessage(messageId, userId);
    res.json({ 
      message: `Usunięto pamięć wiadomości ${messageId}`, 
      deletedCount,
      messageId 
    });
  } catch (error) {
    console.error("❌ Błąd usuwania pamięci wiadomości:", error);
    res.status(500).json({ error: "Błąd podczas usuwania pamięci wiadomości" });
  }
});

// Endpoint do usuwania całej pamięci użytkownika
app.delete("/api/memory/user/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { confirmUserId } = req.body; // Dodatkowa weryfikacja

  if (!confirmUserId || confirmUserId !== userId) {
    return res.status(400).json({ error: "Potwierdzenie userId jest wymagane" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteAllUserMemory(userId);
    res.json({ 
      message: `Usunięto całą pamięć użytkownika ${userId}`, 
      deletedCount,
      userId 
    });
  } catch (error) {
    console.error("❌ Błąd usuwania pamięci użytkownika:", error);
    res.status(500).json({ error: "Błąd podczas usuwania pamięci użytkownika" });
  }
});

// Endpoint do eksportu pamięci użytkownika
app.get("/api/memory/export/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    const memoryEntries = await prisma.vectorMemory.findMany({
      where: { userId },
      orderBy: { timestamp: 'desc' },
      select: {
        id: true,
        content: true,
        importanceScore: true,
        timestamp: true,
        tags: true,
        context: true,
        metadata: true
      }
    });

    const exportData = {
      userId,
      exportDate: new Date().toISOString(),
      entriesCount: memoryEntries.length,
      entries: memoryEntries
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="memory-export-${userId}-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error("❌ Błąd eksportu pamięci:", error);
    res.status(500).json({ error: "Błąd podczas eksportu pamięci" });
  }
});

// Endpoint do statystyk pamięci użytkownika (ulepszony)
app.get("/api/memory/stats/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    if (vectorMemoryService.isReady()) {
      // Użyj nowej metody z VectorMemoryService
      const stats = await vectorMemoryService.getMemoryStats(userId);
      res.json({
        ...stats,
        memoryServiceReady: true
      });
    } else {
      // Fallback - podstawowe statystyki z Prisma
      const totalEntries = await prisma.vectorMemory.count({ where: { userId } });
      
      const averageImportance = await prisma.vectorMemory.aggregate({
        where: { userId },
        _avg: { importanceScore: true }
      });

      res.json({
        totalEntries,
        averageImportance: averageImportance._avg.importanceScore || 0,
        entriesByChat: [],
        topTags: [],
        oldestEntry: null,
        newestEntry: null,
        memoryServiceReady: false
      });
    }
  } catch (error) {
    console.error("❌ Błąd pobierania statystyk pamięci:", error);
    res.status(500).json({ error: "Błąd podczas pobierania statystyk pamięci" });
  }
});

// Endpoint do weryfikacji spójności pamięci
app.post("/api/memory/validate/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    console.log(`🔍 Rozpoczynam weryfikację spójności pamięci dla użytkownika ${userId}`);
    
    const validationStats = await vectorMemoryService.validateMemoryConsistency(userId);
    
    res.json({
      message: "Weryfikacja spójności zakończona",
      stats: validationStats,
      userId
    });
  } catch (error) {
    console.error("❌ Błąd weryfikacji spójności pamięci:", error);
    res.status(500).json({ error: "Błąd podczas weryfikacji spójności pamięci" });
  }
});

// Endpoint do ustawień pamięci użytkownika
app.get("/api/memory/settings/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;

  try {
    let settings = await prisma.memorySettings.findUnique({
      where: { userId }
    });

    if (!settings) {
      // Utwórz domyślne ustawienia
      settings = await prisma.memorySettings.create({
        data: { userId }
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("❌ Błąd pobierania ustawień pamięci:", error);
    res.status(500).json({ error: "Błąd podczas pobierania ustawień pamięci" });
  }
});

// Endpoint do aktualizacji ustawień pamięci (rozszerzony)
app.put("/api/memory/settings/:userId", async (req: Request, res: Response) => {
  const { userId } = req.params;
  const { 
    importanceThreshold, 
    maxMemoryEntries, 
    retentionDays, 
    autoCleanupEnabled,
    memoryEnabled,
    autoDeleteOnChatRemoval,
    incognitoMode,
    shareMemoryAcrossChats,
    memoryAggressiveness
  } = req.body;

  try {
    const settings = await prisma.memorySettings.upsert({
      where: { userId },
      update: {
        ...(importanceThreshold !== undefined && { importanceThreshold }),
        ...(maxMemoryEntries !== undefined && { maxMemoryEntries }),
        ...(retentionDays !== undefined && { retentionDays }),
        ...(autoCleanupEnabled !== undefined && { autoCleanupEnabled }),
        ...(memoryEnabled !== undefined && { memoryEnabled }),
        ...(autoDeleteOnChatRemoval !== undefined && { autoDeleteOnChatRemoval }),
        ...(incognitoMode !== undefined && { incognitoMode }),
        ...(shareMemoryAcrossChats !== undefined && { shareMemoryAcrossChats }),
        ...(memoryAggressiveness !== undefined && { memoryAggressiveness }),
        updatedAt: new Date()
      },
      create: {
        userId,
        importanceThreshold: importanceThreshold || 0.3,
        maxMemoryEntries: maxMemoryEntries || 10000,
        retentionDays: retentionDays || 365,
        autoCleanupEnabled: autoCleanupEnabled !== undefined ? autoCleanupEnabled : true,
        memoryEnabled: memoryEnabled !== undefined ? memoryEnabled : true,
        autoDeleteOnChatRemoval: autoDeleteOnChatRemoval !== undefined ? autoDeleteOnChatRemoval : true,
        incognitoMode: incognitoMode !== undefined ? incognitoMode : false,
        shareMemoryAcrossChats: shareMemoryAcrossChats !== undefined ? shareMemoryAcrossChats : true,
        memoryAggressiveness: memoryAggressiveness || 'conservative'
      }
    });

    console.log(`⚙️ Zaktualizowano ustawienia pamięci dla użytkownika ${userId}`);
    res.json(settings);
  } catch (error) {
    console.error("❌ Błąd aktualizacji ustawień pamięci:", error);
    res.status(500).json({ error: "Błąd podczas aktualizacji ustawień pamięci" });
  }
});

// --- Uruchomienie serwera i obsługa zamykania ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
});

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

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

// Initialize VectorMemoryService (fixed for single user mode)
async function initializeVectorMemory() {
  try {
    await vectorMemoryService.initialize();
    console.log('🧠 VectorMemoryService initialized for single user mode');
  } catch (error) {
    console.error('❌ Failed to initialize VectorMemoryService:', error);
    console.log('📱 Desktop app will work without vector memory - basic chat functionality available');
  }
}

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

// AUTH ENDPOINTS REMOVED FOR SINGLE USER MODE
// No login/register needed - app works with single local user

// Single User Mode - hardcoded user ID
const SINGLE_USER_ID = "single-user";

// Pobierz listę czatów dla użytkownika (single user mode)
app.get("/api/chats", async (req: Request, res: Response) => {
  // Use hardcoded single user ID
  const loggedInUserId = SINGLE_USER_ID;

  try {
    const chats = await prisma.chat.findMany({
      orderBy: { updatedAt: "desc" },
      include: {
        messages: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    const chatList = chats.map((chat) => {
      const lastMessage = chat.messages[0];
      const metadata = chat.metadata as any;

      return {
        id: chat.id,
        title: chat.title || "Nowa rozmowa",
        lastMessage: lastMessage?.content || "",
        lastMessageTime: lastMessage?.createdAt || chat.createdAt,
        messageCount: chat.messages.length,
        modelId: metadata?.modelId || "unknown",
        userId: loggedInUserId, // Keep for frontend compatibility
        isAIChat: metadata?.isAIChat || false,
        createdAt: chat.createdAt,
        updatedAt: chat.updatedAt,
      };
    });

    res.json(chatList);
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
    const messages = await prisma.message.findMany({
      where: { chatId },
      take: 30,
      ...(cursor && { skip: 1, cursor: { id: String(cursor) } }),
      orderBy: { createdAt: "desc" },
    });
    
    // Transform messages to include sender info for frontend compatibility
    const transformedMessages = messages.map(message => ({
      ...message,
      sender: {
        id: message.senderType === "user" ? SINGLE_USER_ID : "ai-assistant",
        username: message.senderType === "user" ? "User" : "AI"
      }
    }));
    
    res.json(transformedMessages.reverse());
  } catch (error) {
    console.error("Error fetching messages:", error);
    res.status(500).json({ error: "Could not fetch messages" });
  }
});

// Endpoint do tworzenia nowego czatu AI
app.post("/api/ai/chats", async (req: Request, res: Response) => {
  const { title, modelId } = req.body; // userId no longer needed

  if (!title || !modelId) {
    return res.status(400).json({
      error: "title i modelId są wymagane",
    });
  }

  try {
    // Utwórz nowy czat AI
    const newChat = await prisma.chat.create({
      data: {
        title,
        // Dodaj metadane czatu AI
        metadata: {
          modelId,
          isAIChat: true,
        },
      } as any, // Rzutowanie typu dla pól title i metadata
      include: {
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

  try {
    // Sprawdź czy czat istnieje
    const chat = await prisma.chat.findFirst({
      where: { id: chatId },
    });

    if (!chat) {
      return res
        .status(404)
        .json({ error: "Czat nie został znaleziony" });
    }

    // Sprawdź czy użytkownik chce automatycznie usuwać pamięć
    let memoryDeletedCount = 0;
    if (vectorMemoryService.isReady()) {
      try {
        const userSettings = await prisma.memorySettings.findFirst();
        
        if (userSettings?.autoDeleteOnChatRemoval !== false) {
          // Domyślnie usuń pamięć (chyba że użytkownik wyłączył)
          memoryDeletedCount = await vectorMemoryService.deleteMemoryByChat(chatId);
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

    // 2. Pobierz ustawienia pamięci (single user mode)
    const userSettings = await prisma.memorySettings.findFirst();
    
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
        take: 6
      });

      if (recentMessages.length > 1) {
        const chatHistory = recentMessages
          .reverse()
          .slice(0, -1) // Usuń aktualną wiadomość użytkownika
          .map(msg => `${msg.senderType === 'user' ? 'User' : 'AI'}: ${msg.content}`)
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
        take: 4
      });

      if (recentMessages.length > 1) {
        const chatHistory = recentMessages
          .reverse()
          .slice(0, -1)
          .map(msg => `${msg.senderType === 'user' ? 'User' : 'AI'}: ${msg.content}`)
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
        "gemini-2.5-flash": "gemini-2.0-flash-exp",
        "gemini-2.5-pro": "gemini-2.0-flash-exp",
        "gemini-1.5-flash": "gemini-1.5-flash",
        "gemini-1.5-pro": "gemini-1.5-pro",
      };
      const modelName =
        geminiModels[modelId as keyof typeof geminiModels] ||
        "gemini-2.0-flash-exp";

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
        "o3-2025-04-16": "o1-preview",
        "chatgpt-4o-latest-20250326": "gpt-4o",
        "gpt4-1": "gpt-4-turbo",
        "gpt4-1-mini": "gpt-4o-mini",
        "o4-mini-high": "o1-mini",
        "gpt-4o": "gpt-4o",
        "gpt-4": "gpt-4",
        "gpt-3.5-turbo": "gpt-3.5-turbo",
      };
      const openaiModel =
        modelMapping[modelId as keyof typeof modelMapping] || "gpt-4o";

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
        "claude-opus-4-20250514-thinking-16k": "claude-3-5-sonnet-20241022",
        "claude-opus-4-20250514": "claude-3-opus-20240229", 
        "claude-sonnet-4-20250514": "claude-3-5-sonnet-20241022",
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
  } else if (provider === "xai") {
    try {
      const { OpenAI } = await import("openai");
      const xai = new OpenAI({
        apiKey,
        baseURL: "https://api.x.ai/v1",
      });

      const modelMapping = {
        "grok-4-0709": "grok-beta",
      };
      const xaiModel =
        modelMapping[modelId as keyof typeof modelMapping] || "grok-beta";

      const response = await xai.chat.completions.create({
        model: xaiModel,
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
      throw new Error(`Błąd xAI: ${error}`);
    }
  } else if (provider === "deepseek") {
    try {
      const { OpenAI } = await import("openai");
      const deepseek = new OpenAI({
        apiKey,
        baseURL: "https://api.deepseek.com",
      });

      const modelMapping = {
        "deepseek-r1-0528": "deepseek-reasoner",
      };
      const deepseekModel =
        modelMapping[modelId as keyof typeof modelMapping] || "deepseek-reasoner";

      const response = await deepseek.chat.completions.create({
        model: deepseekModel,
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
      throw new Error(`Błąd DeepSeek: ${error}`);
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
          senderType: "user",
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
        senderType: "user",
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
        senderType: "ai",
        chatId: currentChatId,
      },
    });

    // Zapisz wiadomości do pamięci wektorowej (asynchronicznie)
    if (vectorMemoryService.isReady()) {
      // Pobierz kontekst (kilka poprzednich wiadomości)
      const recentMessages = await prisma.message.findMany({
        where: { chatId: currentChatId },
        orderBy: { createdAt: 'desc' },
        take: 3
        // No need for sender include in single user mode
      });
      
      const context = recentMessages
        .reverse()
        .map(msg => `${msg.senderType === 'user' ? 'User' : 'AI'}: ${msg.content}`)
        .join('\n');

      // Zapisz wiadomość użytkownika do pamięci (asynchronicznie)
      vectorMemoryService.addMemoryEntry(
        userMessage,
        currentChatId,
        userMessageRecord.id,
        context
      ).catch(error => {
        console.error('❌ Błąd zapisywania wiadomości użytkownika do pamięci:', error);
      });

      // Zapisz odpowiedź AI do pamięci jako część konwersacji użytkownika (asynchronicznie)
      vectorMemoryService.addMemoryEntry(
        `AI odpowiedział: ${aiResponse}`, // Oznacz że to odpowiedź AI
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
  const { content } = req.body;

  if (!content) {
    return res.status(400).json({ error: "content jest wymagany" });
  }

  try {
    console.log(`🧪 TEST: Dodaję do pamięci: "${content}"`);
    
    if (vectorMemoryService.isReady()) {
      const result = await vectorMemoryService.addMemoryEntry(
        content,
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
  const { query, chatId, limit = 10, minImportance = 0.3 } = req.body;

  if (!query) {
    return res.status(400).json({ error: "query jest wymagany" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const results = await vectorMemoryService.searchMemory(query, {
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

// Endpoint do czyszczenia pamięci (stare wpisy)
app.delete("/api/memory/cleanup", async (req: Request, res: Response) => {
  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.cleanupMemory();
    res.json({ message: `Wyczyszczono ${deletedCount} starych wpisów z pamięci`, deletedCount });
  } catch (error) {
    console.error("❌ Błąd czyszczenia pamięci:", error);
    res.status(500).json({ error: "Błąd podczas czyszczenia pamięci" });
  }
});

// Endpoint do usuwania pamięci konkretnego czatu
app.delete("/api/memory/chat/:chatId", async (req: Request, res: Response) => {
  const { chatId } = req.params;

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteMemoryByChat(chatId);
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

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteMemoryByMessage(messageId);
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

// Endpoint do usuwania całej pamięci (single user mode)
app.delete("/api/memory/all", async (req: Request, res: Response) => {
  const { confirm } = req.body; // Dodatkowa weryfikacja

  if (!confirm || confirm !== 'DELETE_ALL_MEMORY') {
    return res.status(400).json({ error: "Potwierdzenie 'DELETE_ALL_MEMORY' jest wymagane" });
  }

  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    const deletedCount = await vectorMemoryService.deleteAllMemory();
    res.json({ 
      message: `Usunięto całą pamięć`, 
      deletedCount
    });
  } catch (error) {
    console.error("❌ Błąd usuwania pamięci:", error);
    res.status(500).json({ error: "Błąd podczas usuwania pamięci" });
  }
});

// Endpoint do eksportu pamięci (single user mode)
app.get("/api/memory/export", async (req: Request, res: Response) => {
  try {
    const memoryEntries = await prisma.vectorMemory.findMany({
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
      exportDate: new Date().toISOString(),
      entriesCount: memoryEntries.length,
      entries: memoryEntries
    };

    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="memory-export-${Date.now()}.json"`);
    res.json(exportData);
  } catch (error) {
    console.error("❌ Błąd eksportu pamięci:", error);
    res.status(500).json({ error: "Błąd podczas eksportu pamięci" });
  }
});

// Endpoint do statystyk pamięci (single user mode)
app.get("/api/memory/stats", async (req: Request, res: Response) => {
  try {
    if (vectorMemoryService.isReady()) {
      // Użyj nowej metody z VectorMemoryService
      const stats = await vectorMemoryService.getMemoryStats();
      res.json({
        ...stats,
        memoryServiceReady: true
      });
    } else {
      // Fallback - podstawowe statystyki z Prisma
      const totalEntries = await prisma.vectorMemory.count();
      
      const averageImportance = await prisma.vectorMemory.aggregate({
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
app.post("/api/memory/validate", async (req: Request, res: Response) => {
  if (!vectorMemoryService.isReady()) {
    return res.status(503).json({ error: "Serwis pamięci wektorowej nie jest gotowy" });
  }

  try {
    console.log(`🔍 Rozpoczynam weryfikację spójności pamięci`);
    
    const validationStats = await vectorMemoryService.validateMemoryConsistency();
    
    res.json({
      message: "Weryfikacja spójności zakończona",
      stats: validationStats
    });
  } catch (error) {
    console.error("❌ Błąd weryfikacji spójności pamięci:", error);
    res.status(500).json({ error: "Błąd podczas weryfikacji spójności pamięci" });
  }
});

// Endpoint do ustawień pamięci użytkownika (single user mode)
app.get("/api/memory/settings", async (req: Request, res: Response) => {
  try {
    let settings = await prisma.memorySettings.findFirst();

    if (!settings) {
      // Utwórz domyślne ustawienia
      settings = await prisma.memorySettings.create({
        data: {}
      });
    }

    res.json(settings);
  } catch (error) {
    console.error("❌ Błąd pobierania ustawień pamięci:", error);
    res.status(500).json({ error: "Błąd podczas pobierania ustawień pamięci" });
  }
});

// Endpoint do aktualizacji ustawień pamięci (single user mode)
app.put("/api/memory/settings", async (req: Request, res: Response) => {
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
    // Find existing settings or create new ones
    let settings = await prisma.memorySettings.findFirst();
    
    if (settings) {
      // Update existing settings
      settings = await prisma.memorySettings.update({
        where: { id: settings.id },
        data: {
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
        }
      });
    } else {
      // Create new settings
      settings = await prisma.memorySettings.create({
        data: {
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
    }

    console.log(`⚙️ Zaktualizowano ustawienia pamięci`);
    res.json(settings);
  } catch (error) {
    console.error("❌ Błąd aktualizacji ustawień pamięci:", error);
    res.status(500).json({ error: "Błąd podczas aktualizacji ustawień pamięci" });
  }
});

// --- Uruchomienie serwera i obsługa zamykania ---

const PORT = process.env.PORT || 3001;
app.listen(PORT, async () => {
  console.log(`🚀 Server is running at http://localhost:${PORT}`);
  // Initialize vector memory service
  await initializeVectorMemory();
});

const gracefulShutdown = async (signal: string) => {
  console.log(`Received ${signal}. Shutting down gracefully...`);
  await prisma.$disconnect();
  console.log("Prisma Client disconnected.");
  process.exit(0);
};

process.on("SIGINT", () => gracefulShutdown("SIGINT"));
process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));

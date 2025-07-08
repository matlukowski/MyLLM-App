import express, { Express, Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import axios from "axios";
import bcrypt from "bcrypt";

// Inicjalizacje
const prisma = new PrismaClient();
const app: Express = express();

// Konfiguracja serwisu RAG
const RAG_SERVICE_URL = process.env.RAG_SERVICE_URL || "http://localhost:5000";

// Middlewares
app.use(
  cors({
    origin: ["http://localhost:3000", "http://localhost:5173"],
  })
);
app.use(express.json());

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

    console.log("✅ Usunięto czat:", chatId);
    res.json({ message: "Czat został usunięty" });
  } catch (error) {
    console.error("❌ Błąd podczas usuwania czatu:", error);
    res.status(500).json({ error: "Nie udało się usunąć czatu" });
  }
});

// Zaktualizowany endpoint do czatu z AI
app.post("/api/ai/chat", async (req: Request, res: Response) => {
  const { userId, modelId, userMessage, chatHistory, chatId, apiKey } =
    req.body;

  if (!userId || !modelId || !userMessage) {
    return res.status(400).json({
      error: "userId, modelId i userMessage są wymagane",
    });
  }

  if (!apiKey) {
    return res.status(401).json({
      error:
        "Klucz API od Google jest wymagany. Dodaj go w ustawieniach kluczy API.",
    });
  }

  try {
    let currentChatId = chatId;
    let chatTitle = "";

    // Konfiguracja specyficzna dla modelu
    const isProModel = modelId === "gemini-2.5-pro";
    const timeout = isProModel ? 600000 : 120000; // 10 minut dla Pro, 2 minuty dla Flash
    const maxOutputTokens = isProModel ? 32768 : 8192; // 32k dla Pro, 8k dla Flash

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
    await prisma.message.create({
      data: {
        content: userMessage,
        senderId: userId,
        chatId: currentChatId,
      },
    });

    // Mapowanie historii czatu do formatu Google Gemini
    const contents = [
      ...(chatHistory || []).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
      {
        role: "user",
        parts: [{ text: userMessage }],
      },
    ];

    const payload: any = {
      contents,
      generationConfig: {
        maxOutputTokens,
      },
    };

    console.log("🤖 Generowanie odpowiedzi AI z Google Gemini:", {
      modelId,
      chatId: currentChatId,
    });

    let aiResponse = "";
    const geminiModelId = modelId;
    const geminiApiUrl = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModelId}:generateContent?key=${apiKey}`;

    try {
      const geminiResponse = await axios.post(geminiApiUrl, payload, {
        headers: { "Content-Type": "application/json" },
        timeout,
        maxContentLength: Infinity,
        maxBodyLength: Infinity,
      });

      const candidate = geminiResponse.data.candidates?.[0];

      if (candidate) {
        const parts = candidate.content?.parts;
        if (parts && Array.isArray(parts)) {
          const responseChunks: string[] = [];
          for (const part of parts) {
            if (part.text) {
              responseChunks.push(part.text);
            } else if (part.code_execution_result?.output) {
              const formattedOutput = part.code_execution_result.output.trim();
              if (formattedOutput) {
                // Ulepszone formatowanie wyniku z code execution
                responseChunks.push(
                  `\n\n---\n**Wynik wykonania kodu:**\n\`\`\`\n${formattedOutput}\n\`\`\`\n`
                );
              }
            }
          }
          aiResponse = responseChunks.join("");
        }

        if (!aiResponse.trim()) {
          aiResponse = "Przepraszam, nie udało mi się wygenerować odpowiedzi.";
        }
      } else {
        aiResponse = "Przepraszam, nie udało mi się wygenerować odpowiedzi.";
      }
    } catch (apiError: any) {
      // Dedykowana obsługa błędu timeout
      if (apiError.code === "ECONNABORTED") {
        console.error(
          "❌ Błąd: Przekroczono czas oczekiwania na odpowiedź z API",
          apiError.message
        );
        return res.status(504).json({
          error:
            "Serwer zbyt długo czekał na odpowiedź z Gemini API. Spróbuj ponownie później lub uprość zapytanie.",
        });
      }

      console.error(
        "❌ Błąd podczas komunikacji z Google Gemini API:",
        apiError.response?.data || apiError.message
      );
      return res.status(500).json({
        error:
          "Błąd komunikacji z Google Gemini API. Sprawdź swój klucz API i spróbuj ponownie.",
      });
    }

    // Zapisz odpowiedź AI
    await prisma.message.create({
      data: {
        content: aiResponse,
        senderId: "ai-assistant",
        chatId: currentChatId,
      },
    });

    // Zaktualizuj czas ostatniej modyfikacji czatu
    await prisma.chat.update({
      where: { id: currentChatId },
      data: { updatedAt: new Date() },
    });

    console.log("✅ Odpowiedź AI z Gemini wygenerowana:", {
      responseLength: aiResponse.length,
      chatId: currentChatId,
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

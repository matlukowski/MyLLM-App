// types.ts
export interface User {
  id: string;
  username: string;
  avatar: string;
  isFollowing: boolean;
}

export interface PostType {
  id: string;
  author: {
    id: string;
    username: string;
    avatarUrl: string;
    isFollowing?: boolean;
  };
  createdAt: string;
  imageUrl: string;
  caption: string;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
}

// Typy dla modeli LLM
export interface LLMModel {
  id: string;
  name: string;
  provider: string;
  description: string;
  maxTokens: number;
  isPopular?: boolean;
}

// Typy dla czatów
export interface Chat {
  id: string;
  title: string;
  lastMessage: string;
  lastMessageTime: Date;
  messageCount: number;
  modelId: string;
  userId: string;
}

// Typy dla wiadomości w czacie
export interface ChatMessage {
  id: string;
  chatId: string;
  content: string;
  timestamp: Date;
  role: "user" | "assistant";
  modelId: string;
}

// Typy dla kluczy API
export interface ApiKey {
  id: string;
  provider: string;
  key: string;
  isActive: boolean;
}

// Konfiguracja dostępnych modeli LLM
export const AVAILABLE_LLM_MODELS: LLMModel[] = [
  {
    id: "gemini-flash-2.5",
    name: "Gemini Flash 2.5",
    provider: "Google",
    description: "Szybki i wydajny model Gemini Flash 2.5",
    maxTokens: 1000000,
    isPopular: true,
  },
  {
    id: "gemini-2.5-flash-thinking",
    name: "Gemini 2.5 Flash Thinking",
    provider: "Google",
    description: "Model zoptymalizowany pod kątem złożonych zadań",
    maxTokens: 1500000,
    isPopular: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    description: "Zaawansowany model Gemini 2.5 Pro",
    maxTokens: 2000000,
    isPopular: true,
  },
];

// Funkcja pomocnicza do pobierania modelu LLM
export const getLLMModel = (id: string): LLMModel | undefined => {
  return AVAILABLE_LLM_MODELS.find((model) => model.id === id);
};

// Funkcja pomocnicza do pobierania popularnych modeli
export const getPopularLLMModels = (): LLMModel[] => {
  return AVAILABLE_LLM_MODELS.filter((model) => model.isPopular);
};

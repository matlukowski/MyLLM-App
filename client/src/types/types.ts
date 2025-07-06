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
    id: "gpt-4.1",
    name: "GPT-4.1",
    provider: "OpenAI",
    description: "Najnowszy model GPT-4.1 z ulepszonymi możliwościami",
    maxTokens: 128000,
    isPopular: true,
  },

  {
    id: "claude-4-sonnet",
    name: "Claude 4 Sonnet",
    provider: "Anthropic",
    description: "Najnowszy model Claude 4 z zaawansowanymi możliwościami",
    maxTokens: 200000,
    isPopular: true,
  },
  {
    id: "gemini-flash-2.5",
    name: "Gemini Flash 2.5",
    provider: "Google",
    description: "Szybki i wydajny model Gemini Flash 2.5",
    maxTokens: 32768,
    isPopular: true,
  },

  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Najbardziej zaawansowany model Claude 3",
    maxTokens: 200000,
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

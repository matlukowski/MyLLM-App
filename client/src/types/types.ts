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
  contextWindow: number;
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
    id: "gemini-2.5-flash",
    name: "Gemini 2.5 Flash",
    provider: "Google",
    contextWindow: 1000000,
    isPopular: true,
  },
  {
    id: "gemini-2.5-pro",
    name: "Gemini 2.5 Pro",
    provider: "Google",
    contextWindow: 1000000,
    isPopular: true,
  },
  {
    id: "o3-2025-04-16",
    name: "O3 2025-04-16",
    provider: "OpenAI",
    contextWindow: 128000,
    isPopular: true,
  },
  {
    id: "chatgpt-4o-latest-20250326",
    name: "GPT-4o",
    provider: "OpenAI",
    contextWindow: 128000,
    isPopular: true,
  },
  {
    id: "grok-4-0709",
    name: "Grok 4",
    provider: "xAI",
    contextWindow: 128000,
    isPopular: true,
  },
  {
    id: "claude-opus-4-20250514-thinking-16k",
    name: "Claude Opus 4 Thinking 16k",
    provider: "Anthropic",
    contextWindow: 16000,
    isPopular: true,
  },
  {
    id: "claude-opus-4-20250514",
    name: "Claude Opus 4",
    provider: "Anthropic",
    contextWindow: 8000,
    isPopular: true,
  },
  {
    id: "claude-sonnet-4-20250514",
    name: "Claude Sonnet 4",
    provider: "Anthropic",
    contextWindow: 32000,
    isPopular: true,
  },
  {
    id: "gpt4-1",
    name: "GPT-4.1",
    provider: "OpenAI",
    contextWindow: 1000000,
    isPopular: true,
  },
  {
    id: "gpt4-1-mini",
    name: "GPT-4.1 mini",
    provider: "OpenAI",
    contextWindow: 1000000,
    isPopular: true,
  },
  {
    id: "o4-mini-high",
    name: "o4-mini high",
    provider: "OpenAI",
    contextWindow: 128000,
    isPopular: true,
  },
  {
    id: "deepseek-r1-0528",
    name: "DeepSeek R1",
    provider: "DeepSeek",
    contextWindow: 32000,
    isPopular: true,
  },
];

// Funkcja pomocnicza do pobierania konfiguracji modelu
export const getLLMModel = (modelId: string): LLMModel | undefined => {
  return AVAILABLE_LLM_MODELS.find((model) => model.id === modelId);
};

// Funkcja pomocnicza do pobierania popularnych modeli
export const getPopularLLMModels = (): LLMModel[] => {
  return AVAILABLE_LLM_MODELS.filter((model) => model.isPopular);
};

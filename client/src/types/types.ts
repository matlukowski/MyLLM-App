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

// Konfiguracja dostępnych modeli LLM
export const AVAILABLE_LLM_MODELS: LLMModel[] = [
  {
    id: "gpt-4-turbo",
    name: "GPT-4 Turbo",
    provider: "OpenAI",
    description: "Najnowszy model GPT-4 z rozszerzonymi możliwościami",
    maxTokens: 128000,
    isPopular: true,
  },
  {
    id: "gpt-4",
    name: "GPT-4",
    provider: "OpenAI",
    description: "Zaawansowany model językowy GPT-4",
    maxTokens: 8192,
    isPopular: true,
  },
  {
    id: "claude-3-5-sonnet",
    name: "Claude 3.5 Sonnet",
    provider: "Anthropic",
    description: "Najnowszy model Claude z ulepszonymi możliwościami",
    maxTokens: 200000,
    isPopular: true,
  },
  {
    id: "claude-3-opus",
    name: "Claude 3 Opus",
    provider: "Anthropic",
    description: "Najbardziej zaawansowany model Claude",
    maxTokens: 200000,
    isPopular: true,
  },
  {
    id: "claude-3-haiku",
    name: "Claude 3 Haiku",
    provider: "Anthropic",
    description: "Szybki i ekonomiczny model Claude",
    maxTokens: 200000,
  },
  {
    id: "gemini-pro",
    name: "Gemini Pro",
    provider: "Google",
    description: "Zaawansowany model językowy od Google",
    maxTokens: 32768,
  },
  {
    id: "llama-2-70b",
    name: "Llama 2 70B",
    provider: "Meta",
    description: "Open-source model językowy Meta",
    maxTokens: 4096,
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

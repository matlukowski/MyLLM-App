// Interfejs dla postaci AI w frontend
export interface AICharacterFrontend {
  id: string;
  name: string;
  description: string;
  avatar: string;
  color: string;
}

// Konfiguracja postaci AI dla frontendu
export const AI_CHARACTERS_FRONTEND: AICharacterFrontend[] = [
  {
    id: "ai-assistant",
    name: "AI Assistant",
    description: "Pomocny asystent do zadań i pytań",
    avatar: "🤖",
    color: "blue.500",
  }
];

// Funkcja pomocnicza do pobierania postaci AI
export const getAICharacterFrontend = (
  id: string
): AICharacterFrontend | undefined => {
  return AI_CHARACTERS_FRONTEND.find((char) => char.id === id);
};

import React, { useState } from "react";
import { Box, Button, Input, VStack, HStack } from "@chakra-ui/react";
import StreamingMarkdown from "../ui/StreamingMarkdown";

const ChatViewExample: React.FC = () => {
  const [messageContent, setMessageContent] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [inputMessage, setInputMessage] = useState("");

  // Funkcja do symulacji otrzymywania chunks z API
  const simulateStreamingResponse = async (fullResponse: string) => {
    // Rozpocznij streaming
    setIsStreaming(true);
    setMessageContent("");

    // Podziel odpowiedź na słowa
    const words = fullResponse.split(" ");

    // Stopniowo dodawaj słowa
    for (let i = 0; i < words.length; i++) {
      const chunk = words[i];

      // Dodaj chunk do istniejącej zawartości
      setMessageContent((prev) => prev + (i > 0 ? " " : "") + chunk);

      // Symuluj opóźnienie między chunks
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Zakończ streaming
    setIsStreaming(false);
  };

  // Funkcja obsługi wysyłania wiadomości
  const handleSendMessage = async () => {
    if (!inputMessage.trim()) return;

    // Symuluj odpowiedź z API
    const mockResponse = `To jest przykładowa odpowiedź na wiadomość: "${inputMessage}". 
    
Ta odpowiedź zawiera **markdown** z różnymi elementami:

1. Lista numerowana
2. Drugi element listy
3. Trzeci element

- Lista nienumerowana
- Drugi element
- Trzeci element

\`\`\`javascript
// Przykład kodu
const example = "Hello World";
console.log(example);
\`\`\`

> To jest cytat blokowy

**Pogrubiony tekst** i *kursywa* również działają poprawnie.

[Link do przykładu](https://example.com)

Koniec przykładowej odpowiedzi.`;

    // Wyczyść input
    setInputMessage("");

    // Rozpocznij streaming
    await simulateStreamingResponse(mockResponse);
  };

  return (
    <Box maxW="4xl" mx="auto" p={6}>
      <VStack gap={6} align="stretch">
        <Box>
          <h2>Przykład użycia StreamingMarkdown</h2>
          <p>
            Ten komponent pokazuje jak zarządzać stanem streamingu w komponencie
            rodzica.
          </p>
        </Box>

        {/* Obszar wiadomości */}
        <Box
          bg="gray.50"
          p={4}
          borderRadius="md"
          minH="300px"
          border="1px solid"
          borderColor="gray.200"
        >
          {messageContent || isStreaming ? (
            <StreamingMarkdown
              content={messageContent}
              isStreaming={isStreaming}
            />
          ) : (
            <Box color="gray.500" fontStyle="italic">
              Wyślij wiadomość aby zobaczyć streaming w akcji...
            </Box>
          )}
        </Box>

        {/* Formularz wysyłania */}
        <HStack gap={3}>
          <Input
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder="Wpisz wiadomość..."
            disabled={isStreaming}
            onKeyPress={(e) => {
              if (e.key === "Enter" && !isStreaming) {
                handleSendMessage();
              }
            }}
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputMessage.trim() || isStreaming}
          >
            Wyślij
          </Button>
        </HStack>

        {/* Kod źródłowy przykładu */}
        <Box>
          <h3>Kod źródłowy zarządzania stanem:</h3>
          <Box
            as="pre"
            bg="gray.100"
            p={4}
            borderRadius="md"
            fontSize="sm"
            overflow="auto"
            whiteSpace="pre-wrap"
          >
            {`// Stan komponentu
const [messageContent, setMessageContent] = useState("");
const [isStreaming, setIsStreaming] = useState(false);

// Obsługa streamingu
const handleStreamChunk = (chunk: string) => {
  // Gdy nadejdzie nowy chunk, dodaj go do istniejącej zawartości
  setMessageContent(prev => prev + chunk);
};

// Rozpoczęcie streamingu
const startStreaming = () => {
  setIsStreaming(true);
  setMessageContent(""); // Wyczyść poprzednią zawartość
};

// Zakończenie streamingu
const endStreaming = () => {
  setIsStreaming(false);
};

// Renderowanie komponentu
<StreamingMarkdown 
  content={messageContent} 
  isStreaming={isStreaming} 
/>`}
          </Box>
        </Box>
      </VStack>
    </Box>
  );
};

export default ChatViewExample;

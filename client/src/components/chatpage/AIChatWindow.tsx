import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Box,
  Flex,
  Heading,
  Text,
  Input,
  Button,
  VStack,
  HStack,
  Spinner,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import {
  AVAILABLE_LLM_MODELS,
  getLLMModel,
  getPopularLLMModels,
  type LLMModel,
} from "../../types/types";

// Animacja migającego kursora
const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

// Komponent z efektem pisania maszynowego
interface TypewriterTextProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterText: React.FC<TypewriterTextProps> = ({
  text,
  speed = 30,
  onComplete,
}) => {
  const [displayedText, setDisplayedText] = useState("");
  const [isComplete, setIsComplete] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timer = setTimeout(() => {
        setDisplayedText((prev) => prev + text[currentIndex]);
        setCurrentIndex((prev) => prev + 1);
      }, speed);

      return () => clearTimeout(timer);
    } else if (currentIndex === text.length && !isComplete) {
      setIsComplete(true);
      onComplete?.();
    }
  }, [currentIndex, text, speed, isComplete, onComplete]);

  // Reset gdy zmieni się tekst
  useEffect(() => {
    setDisplayedText("");
    setCurrentIndex(0);
    setIsComplete(false);
  }, [text]);

  return (
    <Text
      fontSize="sm"
      whiteSpace="pre-wrap"
      lineHeight="1.6"
      wordBreak="break-word"
      display="inline"
      color="gray.800"
    >
      {displayedText}
      {!isComplete && (
        <Text
          as="span"
          color="gray.400"
          animation={`${blinkAnimation} 1s infinite`}
          fontWeight="normal"
        >
          |
        </Text>
      )}
    </Text>
  );
};

interface ChatMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: "user" | "assistant";
  modelId: string;
  isTyping?: boolean;
}

interface AIChatWindowProps {
  chatId: string | null;
  isNewChat: boolean;
  onChatCreated?: (chatId: string) => void;
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({
  chatId,
  isNewChat,
  onChatCreated,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string>(
    getPopularLLMModels()[0]?.id || "gpt-4-turbo"
  );
  const [chatTitle, setChatTitle] = useState<string>("");
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pobierz konfigurację wybranego modelu
  const currentModel = getLLMModel(selectedModel);

  // Przewiń do najnowszej wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Przewiń do dołu po dodaniu nowej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Załaduj czat jeśli nie jest nowy
  useEffect(() => {
    if (isNewChat) {
      setMessages([]);
      setChatTitle("");
      setLoading(false);
      return;
    }

    if (!chatId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    // TODO: Załaduj historię czatu z backendu
    // Na razie używamy dummy data
    setLoading(true);
    setTimeout(() => {
      setMessages([
        {
          id: "msg-1",
          content: "Cześć! Jak mogę Ci pomóc?",
          timestamp: new Date(Date.now() - 1000 * 60 * 5),
          role: "assistant",
          modelId: "gpt-4-turbo",
        },
        {
          id: "msg-2",
          content: "Potrzebuję pomocy z kodem React",
          timestamp: new Date(Date.now() - 1000 * 60 * 3),
          role: "user",
          modelId: "gpt-4-turbo",
        },
      ]);
      setChatTitle("Pomoc z kodem React");
      setLoading(false);
    }, 500);
  }, [chatId, isNewChat]);

  // Wyślij wiadomość do AI
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || isSending) return;

    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setError(null);
    setIsSending(true);

    try {
      // 1. Dodaj wiadomość użytkownika do lokalnego stanu
      const userMessage: ChatMessage = {
        id: `user-${Date.now()}`,
        content: userMessageContent,
        timestamp: new Date(),
        role: "user",
        modelId: selectedModel,
      };
      setMessages((prev) => [...prev, userMessage]);

      // 2. Przygotuj historię czatu (ostatnie 10 wiadomości)
      const chatHistory = [...messages, userMessage].slice(-10).map((msg) => ({
        role: msg.role === "user" ? "user" : "assistant",
        content: msg.content,
      }));

      // 3. Wyślij żądanie do backendu AI
      const response = await fetch("http://localhost:3001/api/ai/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          modelId: selectedModel,
          userMessage: userMessageContent,
          chatHistory,
          chatId: isNewChat ? null : chatId,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Wystąpił błąd podczas komunikacji z AI"
        );
      }

      type AIChatResponse = {
        response: string;
        modelId: string;
        chatId?: string;
        chatTitle?: string;
      };
      const data: AIChatResponse = await response.json();

      // 4. Jeśli to nowy czat, ustaw chatId
      if (isNewChat && data.chatId) {
        onChatCreated?.(data.chatId);
      }

      // 5. Ustaw tytuł czatu jeśli został zwrócony
      if (data.chatTitle) {
        setChatTitle(data.chatTitle);
      }

      // 6. Dodaj odpowiedź AI do lokalnego stanu
      const aiMessage: ChatMessage = {
        id: `ai-${Date.now()}`,
        content: data.response,
        timestamp: new Date(),
        role: "assistant",
        modelId: selectedModel,
        isTyping: true,
      };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error: any) {
      console.error("Błąd podczas wysyłania wiadomości do AI:", error);
      setError(error.message || "Wystąpił nieoczekiwany błąd");
    } finally {
      setIsSending(false);
    }
  };

  // Funkcja kopiowania wiadomości
  const copyMessage = (messageId: string, content: string) => {
    navigator.clipboard.writeText(content);
    setCopiedId(messageId);
    setTimeout(() => setCopiedId(null), 2000);
    toast.success("Wiadomość została skopiowana", {
      position: "bottom-right",
      autoClose: 2000,
    });
  };

  // Funkcja do generowania avatara modelu
  const getModelAvatar = (modelId: string): string => {
    const model = getLLMModel(modelId);
    if (!model) return "🤖";

    switch (model.provider) {
      case "OpenAI":
        return "🟢";
      case "Anthropic":
        return "🟠";
      case "Google":
        return "🔵";
      case "Meta":
        return "🟣";
      default:
        return "🤖";
    }
  };

  return (
    <Flex direction="column" h="100%" bg="white">
      {/* Nagłówek */}
      <Box
        px={6}
        py={4}
        bg="white"
        borderBottom="1px solid"
        borderColor="gray.200"
        position="sticky"
        top={0}
        zIndex={10}
      >
        <HStack gap={3} justify="space-between">
          <HStack gap={3}>
            <Flex
              align="center"
              justify="center"
              w={8}
              h={8}
              bg="blue.500"
              color="white"
              borderRadius="full"
              fontSize="sm"
              flexShrink={0}
            >
              {getModelAvatar(selectedModel)}
            </Flex>
            <VStack align="start" gap={0}>
              <Text fontWeight="600" color="gray.800" fontSize="md">
                {chatTitle || (isNewChat ? "Nowa rozmowa" : "Rozmowa")}
              </Text>
              <HStack gap={2}>
                <Badge
                  size="sm"
                  colorScheme="blue"
                  variant="subtle"
                  fontSize="xs"
                >
                  {currentModel?.name || "Nieznany model"}
                </Badge>
                <Text fontSize="xs" color="gray.500">
                  {currentModel?.provider}
                </Text>
              </HStack>
            </VStack>
          </HStack>
        </HStack>
      </Box>

      {/* Wyświetlanie błędów */}
      {error && (
        <Box
          bg="red.50"
          border="1px solid"
          borderColor="red.200"
          color="red.700"
          p={4}
          mx={4}
          mt={4}
          borderRadius="8px"
        >
          <HStack gap={2}>
            <Text fontSize="sm">⚠️</Text>
            <Text fontSize="sm" fontWeight="500">
              {error}
            </Text>
          </HStack>
        </Box>
      )}

      {/* Lista wiadomości */}
      {loading ? (
        <Flex justify="center" align="center" flex="1" bg="white">
          <VStack gap={4}>
            <Spinner size="lg" color="blue.500" />
            <Text color="gray.600" fontSize="sm">
              Ładowanie rozmowy...
            </Text>
          </VStack>
        </Flex>
      ) : (
        <VStack
          flex="1"
          overflowY="auto"
          px={4}
          py={6}
          align="stretch"
          gap={6}
          bg="white"
          maxW="4xl"
          mx="auto"
          w="full"
        >
          {messages.length === 0 ? (
            <Flex justify="center" align="center" h="full" py={20}>
              <VStack gap={6} textAlign="center" maxW="md">
                <Flex
                  align="center"
                  justify="center"
                  w={16}
                  h={16}
                  bg="blue.500"
                  color="white"
                  borderRadius="full"
                  fontSize="2xl"
                  flexShrink={0}
                >
                  {getModelAvatar(selectedModel)}
                </Flex>
                <VStack gap={3}>
                  <Heading size="lg" color="gray.800" fontWeight="600">
                    Cześć! Jestem {currentModel?.name || "AI"}
                  </Heading>
                  <Text color="gray.600" lineHeight="1.6">
                    Jak mogę Ci dzisiaj pomóc?
                  </Text>
                </VStack>
              </VStack>
            </Flex>
          ) : (
            messages.map((message) => {
              const isUserMessage = message.role === "user";
              const messageModel = getLLMModel(message.modelId);

              return (
                <VStack key={message.id} align="stretch" gap={3} w="full">
                  <HStack align="start" gap={3} w="full">
                    {/* Avatar */}
                    <Flex
                      align="center"
                      justify="center"
                      w={8}
                      h={8}
                      bg={isUserMessage ? "blue.500" : "gray.500"}
                      color="white"
                      borderRadius="full"
                      fontSize="sm"
                      flexShrink={0}
                    >
                      {isUserMessage ? (
                        <Icon as={HiOutlineUser} />
                      ) : (
                        getModelAvatar(message.modelId)
                      )}
                    </Flex>

                    <VStack align="start" gap={2} flex={1} minW={0}>
                      {/* Nazwa */}
                      <HStack gap={2}>
                        <Text fontWeight="600" color="gray.800" fontSize="sm">
                          {isUserMessage
                            ? user?.username || "Ty"
                            : messageModel?.name || "AI"}
                        </Text>
                        {!isUserMessage && (
                          <Badge
                            size="xs"
                            colorScheme="gray"
                            variant="subtle"
                            fontSize="10px"
                          >
                            {messageModel?.provider}
                          </Badge>
                        )}
                      </HStack>

                      {/* Treść wiadomości */}
                      <Box
                        bg={isUserMessage ? "blue.50" : "gray.50"}
                        px={4}
                        py={3}
                        borderRadius="12px"
                        border="1px solid"
                        borderColor={isUserMessage ? "blue.100" : "gray.200"}
                        position="relative"
                        w="full"
                        role="group"
                      >
                        {!isUserMessage && message.isTyping ? (
                          <TypewriterText
                            text={message.content}
                            speed={5}
                            onComplete={() => {
                              setMessages((prev) =>
                                prev.map((msg) =>
                                  msg.id === message.id
                                    ? { ...msg, isTyping: false }
                                    : msg
                                )
                              );
                            }}
                          />
                        ) : (
                          <Text
                            fontSize="sm"
                            whiteSpace="pre-wrap"
                            lineHeight="1.6"
                            wordBreak="break-word"
                            color="gray.800"
                          >
                            {message.content}
                          </Text>
                        )}

                        {/* Copy button */}
                        <Button
                          position="absolute"
                          top={2}
                          right={2}
                          size="xs"
                          variant="ghost"
                          color="gray.400"
                          minW="auto"
                          h="auto"
                          p={1}
                          onClick={() =>
                            copyMessage(message.id, message.content)
                          }
                          _hover={{
                            color: "gray.600",
                            bg: "gray.100",
                          }}
                          opacity={0}
                          _groupHover={{ opacity: 1 }}
                          transition="opacity 0.2s"
                        >
                          <Icon
                            as={
                              copiedId === message.id
                                ? HiOutlineCheck
                                : HiOutlineClipboardDocument
                            }
                            boxSize={3}
                            color={
                              copiedId === message.id ? "green.500" : undefined
                            }
                          />
                        </Button>
                      </Box>
                    </VStack>
                  </HStack>
                </VStack>
              );
            })
          )}

          {/* Wskaźnik pisania */}
          {isSending && (
            <HStack align="start" gap={3} w="full">
              <Flex
                align="center"
                justify="center"
                w={8}
                h={8}
                bg="gray.500"
                color="white"
                borderRadius="full"
                fontSize="sm"
                flexShrink={0}
              >
                {getModelAvatar(selectedModel)}
              </Flex>
              <VStack align="start" gap={2} flex={1}>
                <Text fontWeight="600" color="gray.800" fontSize="sm">
                  {currentModel?.name || "AI"}
                </Text>
                <Box
                  bg="gray.50"
                  px={4}
                  py={3}
                  borderRadius="12px"
                  border="1px solid"
                  borderColor="gray.200"
                >
                  <HStack gap={2}>
                    <Spinner size="xs" color="gray.400" />
                    <Text fontSize="sm" color="gray.600">
                      Pisze...
                    </Text>
                  </HStack>
                </Box>
              </VStack>
            </HStack>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      )}

      {/* Formularz wysyłania wiadomości */}
      <Box
        p={4}
        bg="white"
        borderTop="1px solid"
        borderColor="gray.200"
        position="sticky"
        bottom={0}
      >
        <Box maxW="4xl" mx="auto">
          <VStack gap={3}>
            {/* Wybór modelu */}
            <HStack w="full" justify="space-between" align="center">
              <Text fontSize="sm" color="gray.600" fontWeight="500">
                Model AI:
              </Text>
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                style={{
                  maxWidth: "300px",
                  background: "white",
                  border: "1px solid #d1d5db",
                  borderRadius: "8px",
                  padding: "8px 12px",
                  fontSize: "14px",
                  color: "#374151",
                  outline: "none",
                }}
              >
                <optgroup label="Popularne">
                  {getPopularLLMModels().map((model) => (
                    <option key={model.id} value={model.id}>
                      {model.name} ({model.provider})
                    </option>
                  ))}
                </optgroup>
                <optgroup label="Wszystkie">
                  {AVAILABLE_LLM_MODELS.filter((m) => !m.isPopular).map(
                    (model) => (
                      <option key={model.id} value={model.id}>
                        {model.name} ({model.provider})
                      </option>
                    )
                  )}
                </optgroup>
              </select>
            </HStack>

            {/* Formularz wiadomości */}
            <form onSubmit={handleSendMessage} style={{ width: "100%" }}>
              <HStack gap={3}>
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  placeholder={`Napisz wiadomość do ${
                    currentModel?.name || "AI"
                  }...`}
                  disabled={isSending}
                  size="lg"
                  bg="white"
                  border="1px solid"
                  borderColor="gray.300"
                  borderRadius="12px"
                  color="gray.800"
                  _placeholder={{
                    color: "gray.500",
                  }}
                  _hover={{
                    borderColor: "gray.400",
                  }}
                  _focus={{
                    borderColor: "blue.500",
                    boxShadow: "0 0 0 1px #3182ce",
                  }}
                  transition="all 0.2s ease"
                />
                <Button
                  type="submit"
                  size="lg"
                  bg="blue.500"
                  color="white"
                  borderRadius="12px"
                  px={6}
                  disabled={!newMessage.trim() || isSending}
                  loading={isSending}
                  loadingText="Wysyłanie..."
                  _hover={{
                    bg: "blue.600",
                  }}
                  _active={{
                    transform: "scale(0.98)",
                  }}
                  transition="all 0.2s ease"
                >
                  <Icon as={HiOutlinePaperAirplane} boxSize={4} />
                </Button>
              </HStack>
            </form>
          </VStack>
        </Box>
      </Box>
    </Flex>
  );
};

export default AIChatWindow;

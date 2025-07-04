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
} from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import { useAuth } from "../../contexts/AuthContext";
import {
  HiOutlinePaperAirplane,
  HiOutlineUser,
  HiOutlineClipboardDocument,
  HiOutlineCheck,
} from "react-icons/hi2";
import { getAICharacterFrontend } from "../../config/aiCharacters";

// Animacja migającego kursora
const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

// Komponent z efektem pisania maszynowego
interface TypewriterTextProps {
  text: string;
  speed?: number; // szybkość w ms na znak
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
      lineHeight="1.5"
      wordBreak="break-word"
      pr="40px"
      display="inline"
    >
      {displayedText}
      {!isComplete && (
        <Text
          as="span"
          color="white"
          animation={`${blinkAnimation} 1s infinite`}
          fontWeight="normal"
        >
          |
        </Text>
      )}
    </Text>
  );
};

interface AIMessage {
  id: string;
  content: string;
  timestamp: Date;
  role: "user" | "ai";
  memoriesUsed?: number;
  isTyping?: boolean; // nowe pole do śledzenia czy wiadomość jest aktualnie pisana
}

interface AIChatWindowProps {
  aiCharId: string;
  aiCharName: string;
}

const AIChatWindow: React.FC<AIChatWindowProps> = ({
  aiCharId,
  aiCharName,
}) => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<AIMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [chatId, setChatId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Pobierz konfigurację postaci AI
  const aiCharConfig = getAICharacterFrontend(aiCharId);
  const aiColor = aiCharConfig?.color || "blue.500";
  const aiAvatar = aiCharConfig?.avatar || "🤖";

  // Przewiń do najnowszej wiadomości
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Przewiń do dołu po dodaniu nowej wiadomości
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Pobierz lub utwórz czat user-AI i pobierz historię wiadomości
  useEffect(() => {
    const fetchOrCreateChat = async () => {
      if (!user?.id || !aiCharId) return;
      setLoading(true);
      setError(null);

      // Dla AI charakterów używamy specjalnego podejścia - generujemy "wirtualny" chatId
      const virtualChatId = `ai-chat-${user.id}-${aiCharId}`;
      setChatId(virtualChatId);

      // Dla AI nie pobieramy historii z bazy danych (na razie)
      // W przyszłości można to rozszerzyć o persystentną historię
      setMessages([]);
      setLoading(false);
    };
    fetchOrCreateChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id, aiCharId]);

  // Wyślij wiadomość do AI z pamięcią długoterminową
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newMessage.trim() || !user || isSending || !chatId) return;

    const userMessageContent = newMessage.trim();
    setNewMessage("");
    setError(null);
    setIsSending(true);

    try {
      // 1. Dodaj wiadomość użytkownika do lokalnego stanu (dla AI nie zapisujemy do bazy)
      const userMessage: AIMessage = {
        id: `user-${Date.now()}`,
        content: userMessageContent,
        timestamp: new Date(),
        role: "user",
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
          aiCharId,
          userMessage: userMessageContent,
          chatHistory,
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
        aiCharacter: string;
        memoriesUsed: number;
      };
      const data: AIChatResponse = await response.json();

      // 4. Dodaj odpowiedź AI do lokalnego stanu (dla AI nie zapisujemy do bazy)
      const aiMessage: AIMessage = {
        id: `ai-${Date.now()}`,
        content: data.response,
        timestamp: new Date(),
        role: "ai",
        memoriesUsed: data.memoriesUsed,
        isTyping: true, // oznacz jako pisaną
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

  return (
    <Flex
      direction="column"
      h="100%"
      bg="rgba(0, 0, 0, 0.5)"
      backdropFilter="blur(10px)"
    >
      {/* Wyświetlanie błędów */}
      {error && (
        <Box
          bg="rgba(239, 68, 68, 0.1)"
          border="1px solid"
          borderColor="rgba(239, 68, 68, 0.3)"
          color="rgb(252, 165, 165)"
          p={4}
          mx={4}
          mt={4}
          borderRadius="12px"
          backdropFilter="blur(10px)"
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
        <Flex justify="center" align="center" flex="1" bg="transparent">
          <VStack gap={4}>
            <Spinner size="xl" color="purple.400" />
            <Text color="rgba(255, 255, 255, 0.7)" fontSize="sm">
              Ładowanie rozmowy...
            </Text>
          </VStack>
        </Flex>
      ) : (
        <VStack
          flex="1"
          overflowY="auto"
          p={6}
          align="stretch"
          gap={4}
          bg="transparent"
          style={{ scrollBehavior: "smooth" }}
        >
          {messages.length === 0 ? (
            <Flex justify="center" align="center" h="100%">
              <VStack gap={6} textAlign="center" maxW="md">
                <VStack gap={3}>
                  <Heading
                    size="lg"
                    bgGradient="linear(to-r, white, gray.300)"
                    bgClip="text"
                    fontWeight="600"
                  >
                    Cześć! Jestem {aiCharName}
                  </Heading>
                </VStack>
              </VStack>
            </Flex>
          ) : (
            messages.map((message) => {
              const isUserMessage = message.role === "user";
              return (
                <Flex
                  key={message.id}
                  justify={isUserMessage ? "flex-end" : "flex-start"}
                  w="full"
                >
                  <HStack
                    maxW="80%"
                    align="start"
                    direction={isUserMessage ? "row-reverse" : "row"}
                    gap={3}
                  >
                    {/* Avatar */}
                    <Flex
                      align="center"
                      justify="center"
                      w={10}
                      h={10}
                      bg={isUserMessage ? "purple.600" : aiColor}
                      borderRadius="12px"
                      color="white"
                      fontSize={isUserMessage ? "sm" : "lg"}
                      flexShrink={0}
                      boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                    >
                      {isUserMessage ? <Icon as={HiOutlineUser} /> : aiAvatar}
                    </Flex>

                    <VStack
                      align={isUserMessage ? "end" : "start"}
                      gap={2}
                      maxW="100%"
                    >
                      {/* Message bubble */}
                      <Box
                        bg={
                          isUserMessage
                            ? "rgba(147, 51, 234, 0.9)"
                            : "rgba(55, 65, 81, 0.9)"
                        }
                        color="white"
                        px={4}
                        py={3}
                        borderRadius="18px"
                        borderBottomRightRadius={isUserMessage ? "6px" : "18px"}
                        borderBottomLeftRadius={isUserMessage ? "18px" : "6px"}
                        boxShadow="0 4px 20px rgba(0, 0, 0, 0.15)"
                        backdropFilter="blur(10px)"
                        border="1px solid"
                        borderColor="rgba(255, 255, 255, 0.1)"
                        position="relative"
                        overflow="hidden"
                        _before={
                          !isUserMessage
                            ? {
                                content: '""',
                                position: "absolute",
                                top: 0,
                                left: 0,
                                right: 0,
                                bottom: 0,
                                bgGradient:
                                  "linear(135deg, rgba(255,255,255,0.05), transparent)",
                                pointerEvents: "none",
                              }
                            : undefined
                        }
                      >
                        {!isUserMessage && message.isTyping ? (
                          <TypewriterText
                            text={message.content}
                            speed={5}
                            onComplete={() => {
                              // Oznacz wiadomość jako zakończoną
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
                            lineHeight="1.5"
                            wordBreak="break-word"
                            pr={!isUserMessage ? "40px" : "0"}
                            pl={isUserMessage ? "40px" : "0"}
                          >
                            {message.content}
                          </Text>
                        )}

                        {/* Copy button dla wiadomości AI i użytkownika */}
                        <Button
                          position="absolute"
                          top={2}
                          right={!isUserMessage ? 2 : "auto"}
                          left={isUserMessage ? 2 : "auto"}
                          size="xs"
                          variant="ghost"
                          color="rgba(255, 255, 255, 0.6)"
                          minW="auto"
                          h="auto"
                          p={1}
                          onClick={() =>
                            copyMessage(message.id, message.content)
                          }
                          _hover={{
                            color: "white",
                            bg: "rgba(255, 255, 255, 0.1)",
                          }}
                        >
                          <Icon
                            as={
                              copiedId === message.id
                                ? HiOutlineCheck
                                : HiOutlineClipboardDocument
                            }
                            boxSize={4.5}
                            color={
                              copiedId === message.id ? "green.300" : undefined
                            }
                          />
                        </Button>
                      </Box>
                    </VStack>
                  </HStack>
                </Flex>
              );
            })
          )}

          {/* Wskaźnik pisania */}
          {isSending && (
            <Flex justify="flex-start" w="full">
              <HStack align="start" gap={3}>
                <Flex
                  align="center"
                  justify="center"
                  w={10}
                  h={10}
                  bg={aiColor}
                  borderRadius="12px"
                  color="white"
                  fontSize="lg"
                  flexShrink={0}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                >
                  {aiAvatar}
                </Flex>
                <Box
                  bg="rgba(55, 65, 81, 0.9)"
                  color="white"
                  px={4}
                  py={3}
                  borderRadius="18px"
                  borderBottomLeftRadius="6px"
                  backdropFilter="blur(10px)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                >
                  <HStack gap={2}>
                    <Spinner size="xs" color="gray.300" />
                    <Text fontSize="sm" color="gray.300">
                      {aiCharName} pisze...
                    </Text>
                  </HStack>
                </Box>
              </HStack>
            </Flex>
          )}
          <div ref={messagesEndRef} />
        </VStack>
      )}

      {/* Formularz wysyłania wiadomości */}
      <Box
        p={6}
        bg="rgba(0, 0, 0, 0.8)"
        backdropFilter="blur(20px)"
        borderTop="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
      >
        <form onSubmit={handleSendMessage}>
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
              placeholder={`Napisz wiadomość do ${aiCharName}...`}
              disabled={isSending}
              size="lg"
              bg="rgba(255, 255, 255, 0.05)"
              border="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              borderRadius="16px"
              color="white"
              _placeholder={{
                color: "rgba(255, 255, 255, 0.4)",
              }}
              _hover={{
                borderColor: "rgba(255, 255, 255, 0.2)",
                bg: "rgba(255, 255, 255, 0.08)",
              }}
              _focus={{
                borderColor: "purple.400",
                boxShadow: "0 0 0 3px rgba(147, 51, 234, 0.1)",
                bg: "rgba(255, 255, 255, 0.08)",
              }}
              transition="all 0.2s ease"
            />
            <Button
              type="submit"
              size="lg"
              bgGradient="linear(135deg, purple.500, purple.600)"
              color="white"
              borderRadius="16px"
              px={6}
              disabled={!newMessage.trim() || isSending}
              loading={isSending}
              loadingText="Wysyłanie..."
              _hover={{
                bgGradient: "linear(135deg, purple.600, purple.700)",
                transform: "translateY(-1px)",
                boxShadow: "0 8px 25px rgba(147, 51, 234, 0.3)",
              }}
              _active={{
                transform: "translateY(0px)",
              }}
              transition="all 0.2s ease"
              boxShadow="0 4px 16px rgba(147, 51, 234, 0.2)"
            >
              <HStack gap={2}>
                <Icon as={HiOutlinePaperAirplane} boxSize={4} />
                <Text>Wyślij</Text>
              </HStack>
            </Button>
          </HStack>
        </form>
      </Box>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Flex>
  );
};

export default AIChatWindow;

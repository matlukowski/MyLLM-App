import React, { useState } from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Button,
  Icon,
  Badge,
  HStack,
} from "@chakra-ui/react";
import {
  HiArrowRightOnRectangle,
  HiOutlineSparkles,
  HiOutlinePlus,
  HiOutlineChatBubbleLeftRight,
  HiOutlineEllipsisVertical,
  HiOutlineCog6Tooth,
} from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Chat, getLLMModel } from "../../types/types";
import ApiKeysModal from "../ui/ApiKeysModal";

// Dummy data dla przykładowych czatów
const DUMMY_CHATS: Chat[] = [
  {
    id: "chat-1",
    title: "Pomoc z kodem React",
    lastMessage: "Dziękuję za pomoc z komponentami!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 30), // 30 minut temu
    messageCount: 12,
    modelId: "gpt-4-turbo",
    userId: "user-1",
  },
  {
    id: "chat-2",
    title: "Planowanie podróży",
    lastMessage: "Jakie są najlepsze miejsca w Krakowie?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 godziny temu
    messageCount: 8,
    modelId: "claude-3-5-sonnet",
    userId: "user-1",
  },
  {
    id: "chat-3",
    title: "Uczenie się TypeScript",
    lastMessage: "Jak działają generics w TypeScript?",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24), // 1 dzień temu
    messageCount: 25,
    modelId: "gpt-4",
    userId: "user-1",
  },
  {
    id: "chat-4",
    title: "Przepisy kulinarne",
    lastMessage: "Przepis na carbonarę wygląda świetnie!",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2), // 2 dni temu
    messageCount: 6,
    modelId: "claude-3-opus",
    userId: "user-1",
  },
  {
    id: "chat-5",
    title: "Analiza danych Python",
    lastMessage: "Pandas vs NumPy - różnice",
    lastMessageTime: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3), // 3 dni temu
    messageCount: 15,
    modelId: "gpt-4-turbo",
    userId: "user-1",
  },
];

interface SidebarContentProps {
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  onChatSelect?: () => void; // Callback wywoływany po wyborze czatu (dla mobile drawer)
  onNewChat?: () => void; // Callback wywoływany po kliknięciu "Nowa rozmowa"
  onCloseSidebar?: () => void; // Callback tylko dla zamykania sidebara na mobile
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  activeChatId,
  setActiveChatId,
  onChatSelect,
  onNewChat,
  onCloseSidebar,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleChatSelect = (chatId: string) => {
    setActiveChatId(chatId);
    onChatSelect?.(); // Wywołaj callback (zamknij drawer na mobile)
  };

  const handleNewChat = () => {
    setActiveChatId(null);
    onNewChat?.(); // Wywołaj callback
    onCloseSidebar?.(); // Zamknij drawer na mobile (bez wpływu na isNewChatMode)
  };

  // Funkcja do formatowania czasu
  const formatTime = (date: Date): string => {
    const now = new Date();
    const diffInHours = Math.floor(
      (now.getTime() - date.getTime()) / (1000 * 60 * 60)
    );

    if (diffInHours < 1) {
      const diffInMinutes = Math.floor(
        (now.getTime() - date.getTime()) / (1000 * 60)
      );
      return `${diffInMinutes} min temu`;
    } else if (diffInHours < 24) {
      return `${diffInHours} godz. temu`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays} dni temu`;
    }
  };

  return (
    <>
      <Flex
        direction="column"
        w="300px"
        h="100vh"
        bg="gray.900"
        color="white"
        position="relative"
      >
        {/* Header */}
        <Box p={4}>
          <Button
            onClick={handleNewChat}
            w="full"
            size="md"
            bg="transparent"
            border="1px solid"
            borderColor="gray.600"
            color="white"
            borderRadius="8px"
            _hover={{
              bg: "gray.800",
              borderColor: "gray.500",
            }}
            _active={{
              transform: "scale(0.98)",
            }}
            transition="all 0.2s ease"
            fontWeight="500"
          >
            <HStack gap={2}>
              <Icon as={HiOutlinePlus} boxSize={4} />
              <Text>Nowa rozmowa</Text>
            </HStack>
          </Button>
        </Box>

        {/* Lista czatów */}
        <VStack align="stretch" flex="1" overflowY="auto" px={2} gap={1}>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="gray.400"
            textTransform="uppercase"
            letterSpacing="wider"
            px={3}
            py={2}
          >
            Ostatnie rozmowy
          </Text>

          {DUMMY_CHATS.map((chat) => {
            const model = getLLMModel(chat.modelId);
            const isActive = chat.id === activeChatId;

            return (
              <Button
                key={chat.id}
                onClick={() => handleChatSelect(chat.id)}
                w="full"
                h="auto"
                p={3}
                bg={isActive ? "gray.800" : "transparent"}
                color="white"
                border="none"
                borderRadius="8px"
                justifyContent="flex-start"
                _hover={{
                  bg: isActive ? "gray.800" : "gray.800",
                }}
                _active={{
                  transform: "scale(0.98)",
                }}
                transition="all 0.2s ease"
                fontWeight="normal"
                textAlign="left"
                position="relative"
                role="group"
              >
                <HStack gap={3} w="full">
                  <Flex
                    align="center"
                    justify="center"
                    w={8}
                    h={8}
                    bg="gray.700"
                    borderRadius="6px"
                    fontSize="sm"
                    flexShrink={0}
                  >
                    <Icon
                      as={HiOutlineChatBubbleLeftRight}
                      boxSize={4}
                      color="gray.300"
                    />
                  </Flex>

                  <VStack align="start" gap={1} flex={1} minW={0}>
                    <HStack w="full" justify="space-between">
                      <Text
                        fontWeight="500"
                        color="white"
                        fontSize="sm"
                        overflow="hidden"
                        textOverflow="ellipsis"
                        whiteSpace="nowrap"
                        flex={1}
                      >
                        {chat.title}
                      </Text>
                      {isActive && (
                        <Box
                          w={2}
                          h={2}
                          bg="green.400"
                          borderRadius="full"
                          flexShrink={0}
                        />
                      )}
                    </HStack>

                    <Text
                      fontSize="xs"
                      color="gray.400"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                      w="full"
                    >
                      {chat.lastMessage}
                    </Text>

                    <HStack justify="space-between" w="full">
                      <Badge
                        size="xs"
                        colorScheme="blue"
                        variant="subtle"
                        fontSize="10px"
                        px={2}
                        py={0.5}
                      >
                        {model?.name || "Nieznany"}
                      </Badge>
                      <Text fontSize="10px" color="gray.500">
                        {formatTime(chat.lastMessageTime)}
                      </Text>
                    </HStack>
                  </VStack>
                </HStack>

                {/* Menu opcji (widoczne po hover) */}
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
                  opacity={0}
                  _groupHover={{ opacity: 1 }}
                  _hover={{
                    color: "gray.200",
                    bg: "gray.700",
                  }}
                  transition="opacity 0.2s"
                  onClick={(e) => {
                    e.stopPropagation();
                    // TODO: Implementacja menu opcji (usuń, zmień nazwę, etc.)
                  }}
                >
                  <Icon as={HiOutlineEllipsisVertical} boxSize={3} />
                </Button>
              </Button>
            );
          })}
        </VStack>

        {/* Footer z informacjami o użytkowniku */}
        <Box p={4} borderTop="1px solid" borderColor="gray.700">
          <VStack gap={3}>
            <HStack w="full" justify="space-between">
              <VStack align="start" gap={0} flex={1}>
                <Text fontSize="sm" fontWeight="500" color="white">
                  {user?.username}
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Zalogowany
                </Text>
              </VStack>

              <HStack gap={2}>
                <Button
                  onClick={() => setIsApiKeysModalOpen(true)}
                  size="sm"
                  bg="transparent"
                  color="gray.400"
                  border="none"
                  minW="auto"
                  h="auto"
                  p={2}
                  _hover={{
                    color: "white",
                    bg: "gray.800",
                  }}
                  _active={{
                    transform: "scale(0.95)",
                  }}
                  transition="all 0.2s ease"
                  title="Konfiguruj klucze API"
                >
                  <Icon as={HiOutlineCog6Tooth} boxSize={4} />
                </Button>

                <Button
                  onClick={handleLogout}
                  size="sm"
                  bg="transparent"
                  color="gray.400"
                  border="none"
                  minW="auto"
                  h="auto"
                  p={2}
                  _hover={{
                    color: "white",
                    bg: "gray.800",
                  }}
                  _active={{
                    transform: "scale(0.95)",
                  }}
                  transition="all 0.2s ease"
                  title="Wyloguj się"
                >
                  <Icon as={HiArrowRightOnRectangle} boxSize={4} />
                </Button>
              </HStack>
            </HStack>
          </VStack>
        </Box>
      </Flex>

      {/* Modal kluczy API */}
      <ApiKeysModal
        isOpen={isApiKeysModalOpen}
        onClose={() => setIsApiKeysModalOpen(false)}
      />
    </>
  );
};

export default SidebarContent;

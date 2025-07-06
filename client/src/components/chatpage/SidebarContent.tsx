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
  HiOutlineTrash,
} from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { Chat, getLLMModel } from "../../types/types";
import DeleteChatModal from "../ui/DeleteChatModal";
import { useEffect } from "react";
import { getChats, deleteChatById } from "../../../../server/src/api/chatApi";
import { toast } from "react-toastify";

interface SidebarContentProps {
  activeChatId: string | null;
  setActiveChatId: (chatId: string | null) => void;
  onChatSelect?: () => void; // Callback wywoływany po wyborze czatu (dla mobile drawer)
  onNewChat?: () => void; // Callback wywoływany po kliknięciu "Nowa rozmowa"
  onCloseSidebar?: () => void; // Callback tylko dla zamykania sidebara na mobile
  onApiKeysOpen?: () => void; // Callback do otwierania modalu kluczy API
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  activeChatId,
  setActiveChatId,
  onChatSelect,
  onNewChat,
  onCloseSidebar,
  onApiKeysOpen,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
  const [isDeletingChat, setIsDeletingChat] = useState(false);

  // Lista czatów z bazy danych
  const [chats, setChats] = useState<Chat[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(true);

  useEffect(() => {
    const loadChats = async () => {
      if (!user?.id) return;

      try {
        setIsLoadingChats(true);
        const fetchedChats = await getChats(user.id);

        // Konwertuj daty z stringów na obiekty Date
        const chatsWithDates = fetchedChats.map((chat: any) => ({
          ...chat,
          lastMessageTime: new Date(chat.lastMessageTime),
          createdAt: new Date(chat.createdAt),
          updatedAt: new Date(chat.updatedAt),
        }));

        setChats(chatsWithDates);
      } catch (error) {
        console.error("Błąd podczas pobierania czatów:", error);
      } finally {
        setIsLoadingChats(false);
      }
    };

    loadChats();
  }, [user?.id]);

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

  // Funkcja do odświeżania listy czatów (można wywołać po utworzeniu nowego czatu)
  const refreshChats = async () => {
    if (!user?.id) return;

    try {
      const fetchedChats = await getChats(user.id);
      const chatsWithDates = fetchedChats.map((chat: any) => ({
        ...chat,
        lastMessageTime: new Date(chat.lastMessageTime),
        createdAt: new Date(chat.createdAt),
        updatedAt: new Date(chat.updatedAt),
      }));
      setChats(chatsWithDates);
    } catch (error) {
      console.error("Błąd podczas odświeżania czatów:", error);
    }
  };

  // Funkcja do otwierania modalu usuwania czatu
  const handleDeleteChatClick = (chat: Chat, e: React.MouseEvent) => {
    e.stopPropagation();
    setChatToDelete(chat);
    setIsDeleteModalOpen(true);
  };

  // Funkcja do zamykania modalu usuwania
  const handleCloseDeleteModal = () => {
    setIsDeleteModalOpen(false);
    setChatToDelete(null);
  };

  // Funkcja do potwierdzenia usunięcia czatu
  const handleConfirmDelete = async () => {
    if (!chatToDelete || !user?.id) return;

    setIsDeletingChat(true);
    try {
      await deleteChatById(chatToDelete.id, user.id);

      // Usuń czat z lokalnej listy
      setChats(chats.filter((chat) => chat.id !== chatToDelete.id));

      // Jeśli usuwany czat jest aktywny, przejdź do nowego czatu
      if (activeChatId === chatToDelete.id) {
        setActiveChatId(null);
      }

      toast.success("Rozmowa została usunięta");
      handleCloseDeleteModal();
    } catch (error) {
      console.error("Błąd podczas usuwania czatu:", error);
      toast.error("Nie udało się usunąć rozmowy");
    } finally {
      setIsDeletingChat(false);
    }
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

          {isLoadingChats ? (
            <Flex justify="center" align="center" py={8}>
              <VStack gap={2}>
                <Text fontSize="xs" color="gray.500">
                  Ładowanie czatów...
                </Text>
              </VStack>
            </Flex>
          ) : chats.length === 0 ? (
            <Flex justify="center" align="center" py={8}>
              <VStack gap={2}>
                <Text fontSize="xs" color="gray.500">
                  Brak czatów
                </Text>
                <Text fontSize="xs" color="gray.400">
                  Rozpocznij nową rozmowę
                </Text>
              </VStack>
            </Flex>
          ) : (
            chats.map((chat) => {
              const model = getLLMModel(chat.modelId);
              const isActive = chat.id === activeChatId;

              return (
                <Box key={chat.id} position="relative" role="group" w="full">
                  <Button
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
                            pr={8} // Dodaj padding-right aby zrobić miejsce na przycisk usuwania
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
                              mr={8} // Przesuń zieloną kropkę w lewo aby nie zasłaniała przycisku
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
                  </Button>

                  {/* Przycisk usuwania (widoczny po hover) */}
                  <Button
                    position="absolute"
                    top={0}
                    right={0}
                    size="xs"
                    variant="solid"
                    bg="gray.700"
                    color="gray.300"
                    minW="auto"
                    h="auto"
                    p={1.5}
                    _groupHover={{ opacity: 1 }}
                    _hover={{
                      color: "red.400",
                      bg: "gray.600",
                      transform: "scale(1.05)",
                    }}
                    transition="all 0.2s ease"
                    onClick={(e) => handleDeleteChatClick(chat, e)}
                    title="Usuń rozmowę"
                    borderRadius="4px"
                    border="1px solid"
                    borderColor="gray.600"
                  >
                    <Icon as={HiOutlineTrash} boxSize={4} />
                  </Button>
                </Box>
              );
            })
          )}
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
                  onClick={onApiKeysOpen}
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

      {/* Modal usuwania czatu */}
      <DeleteChatModal
        isOpen={isDeleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        chatTitle={chatToDelete?.title || ""}
        isDeleting={isDeletingChat}
      />
    </>
  );
};

export default SidebarContent;

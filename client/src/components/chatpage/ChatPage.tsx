// src/components/ChatPage.tsx

import React, { useState, useEffect, useRef } from "react";
import { HiBars3, HiXMark } from "react-icons/hi2";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Icon,
  IconButton,
} from "@chakra-ui/react";
import AIChatWindow from "./AIChatWindow";
import SidebarContent, { SidebarContentRef } from "./SidebarContent";
import { HiOutlineChatBubbleLeftEllipsis } from "react-icons/hi2";

// --- Interfejs ---

interface ChatPageProps {
  onApiKeysOpen?: () => void;
}

// --- Komponent ---

const ChatPage: React.FC<ChatPageProps> = ({ onApiKeysOpen }) => {
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isNewChatMode, setIsNewChatMode] = useState(true); // Domyślnie true, aby pokazać ekran powitalny
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);

  // Ref do SidebarContent
  const sidebarRef = useRef<SidebarContentRef>(null);

  // Obsługa zmiany rozmiaru okna
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      const wasMobile = isMobile;
      setIsMobile(mobile);

      // Jeśli przeszliśmy z desktop na mobile - zamknij sidebar
      if (mobile && !wasMobile) {
        setIsSidebarOpen(false);
      }
      // Jeśli przeszliśmy z mobile na desktop - otwórz sidebar
      else if (!mobile && wasMobile) {
        setIsSidebarOpen(true);
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isMobile]);

  // Callback dla wybrania czatu lub usunięcia aktywnego czatu
  const handleChatSelect = (chatId: string | null) => {
    setActiveChatId(chatId);
    setIsNewChatMode(false); // Zawsze resetuj tryb nowego czatu po wyborze istniejącego

    // Zamknij sidebar tylko na mobile (szerokość < 768px)
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Callback tylko dla zamykania sidebara na mobile (bez wpływu na isNewChatMode)
  const handleCloseSidebar = () => {
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Callback dla tworzenia nowego czatu
  const handleNewChat = () => {
    setActiveChatId(null);
    setIsNewChatMode(true);
    // Zamknij sidebar na mobile
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  // Callback do odświeżania listy czatów po utworzeniu nowego
  const handleChatCreated = async (newChatId: string) => {
    setActiveChatId(newChatId);
    setIsNewChatMode(false); // Ustaw na false, bo czat już istnieje
    // Odśwież listę czatów w sidebarze
    if (sidebarRef.current) {
      await sidebarRef.current.refreshChats();
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Flex
      h="100vh"
      w="100vw"
      bg="gray.50"
      position="relative"
      overflow="hidden"
    >
      {/* Przycisk hamburgera dla mobile */}
      {isMobile && (
        <IconButton
          aria-label="Przełącz menu"
          onClick={toggleSidebar}
          position="absolute"
          top={4}
          left={4}
          zIndex={10}
          size="md"
          bg="white"
          color="gray.600"
          border="1px solid"
          borderColor="gray.200"
          borderRadius="8px"
          _hover={{
            bg: "gray.50",
            borderColor: "gray.300",
          }}
          _active={{
            transform: "scale(0.95)",
          }}
          transition="all 0.2s ease"
          boxShadow="sm"
        >
          {isSidebarOpen ? <HiXMark /> : <HiBars3 />}
        </IconButton>
      )}

      {/* Sidebar */}
      <Box
        position={isMobile ? "fixed" : "relative"}
        top={0}
        left={0}
        h="100vh"
        zIndex={isMobile ? 6 : 2}
        transform={isSidebarOpen ? "translateX(0)" : "translateX(-100%)"}
        transition="transform 0.3s ease"
        display={!isMobile || isSidebarOpen ? "block" : "none"}
      >
        <SidebarContent
          ref={sidebarRef}
          activeChatId={activeChatId}
          onChatSelect={handleChatSelect} // Przekaż handleChatSelect bezpośrednio
          onNewChat={handleNewChat}
          onCloseSidebar={handleCloseSidebar}
          onApiKeysOpen={onApiKeysOpen}
        />
      </Box>

      {/* Overlay dla mobile */}
      {isMobile && isSidebarOpen && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="blackAlpha.300"
          zIndex={5}
          onClick={toggleSidebar}
        />
      )}

      {/* Główne okno czatu */}
      <Flex
        w={isSidebarOpen && !isMobile ? "calc(100% - 300px)" : "100%"}
        direction="column"
        position="relative"
        zIndex={1}
        bg="white"
        borderLeft={isSidebarOpen && !isMobile ? "1px solid" : "none"}
        borderColor="gray.200"
        transition="all 0.3s ease"
      >
        {activeChatId || isNewChatMode ? (
          <AIChatWindow
            chatId={activeChatId}
            isNewChat={isNewChatMode || !activeChatId} // isNewChat jest true jeśli nie ma aktywnego chatId
            onChatCreated={handleChatCreated}
          />
        ) : (
          <Flex justify="center" align="center" h="100%" bg="white">
            <VStack gap={8} textAlign="center" maxW="md" px={8}>
              <Flex
                align="center"
                justify="center"
                w={16}
                h={16}
                bg="gray.100"
                borderRadius="full"
                border="1px solid"
                borderColor="gray.200"
              >
                <Icon
                  as={HiOutlineChatBubbleLeftEllipsis}
                  boxSize={8}
                  color="gray.400"
                />
              </Flex>

              <VStack gap={4}>
                <Heading size="lg" color="gray.800" fontWeight="600">
                  Wybierz rozmowę lub rozpocznij nową
                </Heading>
                <Text color="gray.600" lineHeight="1.6" fontSize="md">
                  {isMobile
                    ? "Dotknij ikonę menu w lewym górnym rogu, aby wybrać rozmowę lub rozpocząć nową."
                    : "Wybierz jedną z istniejących rozmów z panelu po lewej stronie lub kliknij 'Nowa rozmowa', aby rozpocząć nowy czat."}
                </Text>
              </VStack>

              <Box
                p={4}
                bg="blue.50"
                border="1px solid"
                borderColor="blue.200"
                borderRadius="12px"
              >
                <Text fontSize="sm" color="blue.700">
                  💡 Możesz wybierać różne modele AI dla każdej rozmowy
                </Text>
              </Box>
            </VStack>
          </Flex>
        )}
      </Flex>
    </Flex>
  );
};

export default ChatPage;

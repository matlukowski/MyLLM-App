// src/components/ChatPage.tsx

import React, { useState, useEffect } from "react";
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
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import AIChatWindow from "./AIChatWindow";
import SidebarContent from "./SidebarContent";
import { getAICharacterFrontend } from "../../config/aiCharacters";
import { HiOutlineChatBubbleLeftEllipsis } from "react-icons/hi2";

// --- Komponent ---

const ChatPage: React.FC = () => {
  const [activeAIChar, setActiveAIChar] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const navigate = useNavigate();

  // Sprawdź czy użytkownik jest zalogowany
  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
  }, [user, navigate]);

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

  // Callback dla zamknięcia sidebara po wybraniu asystenta na mobile
  const handleAICharSelect = () => {
    // Zamknij sidebar tylko na mobile (szerokość < 768px)
    if (isMobile) {
      setIsSidebarOpen(false);
    }
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  return (
    <Flex h="100vh" w="100vw" bg="black" position="relative" overflow="hidden">
      {/* Animated background */}
      <Box
        position="absolute"
        top="0"
        left="0"
        right="0"
        bottom="0"
        bgGradient="linear(135deg, gray.900 0%, black 30%, gray.800 70%, black 100%)"
        opacity={0.8}
        zIndex={0}
      />

      {/* Floating orbs */}
      <Box
        position="absolute"
        top="20%"
        left="5%"
        w="200px"
        h="200px"
        borderRadius="full"
        bgGradient="radial(circle, purple.600 0%, transparent 70%)"
        opacity={0.1}
        filter="blur(40px)"
        animation="float 8s ease-in-out infinite"
        zIndex={1}
      />
      <Box
        position="absolute"
        bottom="30%"
        right="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bgGradient="radial(circle, blue.500 0%, transparent 70%)"
        opacity={0.08}
        filter="blur(60px)"
        animation="float 12s ease-in-out infinite reverse"
        zIndex={1}
      />

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px) rotate(0deg); }
            25% { transform: translateY(-20px) translateX(10px) rotate(1deg); }
            50% { transform: translateY(0px) translateX(-10px) rotate(-1deg); }
            75% { transform: translateY(20px) translateX(5px) rotate(0.5deg); }
          }
        `}
      </style>

      {/* Przycisk hamburgera dla wszystkich urządzeń */}
      <IconButton
        aria-label="Przełącz menu"
        onClick={toggleSidebar}
        position="absolute"
        top={4}
        left={4}
        zIndex={10}
        size="lg"
        bg="rgba(0, 0, 0, 0.8)"
        color="white"
        border="1px solid"
        borderColor="rgba(255, 255, 255, 0.2)"
        borderRadius="12px"
        backdropFilter="blur(10px)"
        _hover={{
          bg: "rgba(0, 0, 0, 0.9)",
          borderColor: "rgba(255, 255, 255, 0.3)",
          transform: "scale(1.05)",
        }}
        _active={{
          transform: "scale(0.95)",
        }}
        transition="all 0.2s ease"
      >
        {isSidebarOpen ? <HiXMark /> : <HiBars3 />}
      </IconButton>

      {/* Sidebar - zawsze jako overlay, kontrolowany przyciskiem hamburgera */}
      <Box
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        zIndex={6}
        transform={isSidebarOpen ? "translateX(0)" : "translateX(-100%)"}
        transition="transform 0.3s ease"
      >
        <SidebarContent
          activeAIChar={activeAIChar}
          setActiveAIChar={setActiveAIChar}
          onAICharSelect={handleAICharSelect}
        />
      </Box>

      {/* Główne okno czatu - dostosowane do stanu sidebara */}
      <Flex
        w={isSidebarOpen && !isMobile ? "calc(100% - 320px)" : "100%"}
        direction="column"
        position="relative"
        zIndex={2}
        ml={isSidebarOpen && !isMobile ? "320px" : 0}
        transition="all 0.3s ease"
      >
        {activeAIChar ? (
          (() => {
            const aiChar = getAICharacterFrontend(activeAIChar);
            return aiChar ? (
              <AIChatWindow aiCharId={aiChar.id} aiCharName={aiChar.name} />
            ) : null;
          })()
        ) : (
          <Flex
            justify="center"
            align="center"
            h="100%"
            bg="rgba(0, 0, 0, 0.3)"
            backdropFilter="blur(10px)"
          >
            <VStack gap={6} textAlign="center" maxW="md" px={8}>
              <Flex
                align="center"
                justify="center"
                w={20}
                h={20}
                bgGradient="linear(135deg, purple.500, blue.500, purple.600)"
                borderRadius="20px"
                boxShadow="0 8px 32px rgba(147, 51, 234, 0.3)"
                position="relative"
                overflow="hidden"
              >
                <Icon
                  as={HiOutlineChatBubbleLeftEllipsis}
                  boxSize={10}
                  color="white"
                />
              </Flex>

              <VStack gap={3}>
                <Heading
                  size="lg"
                  bgGradient="linear(to-r, white, gray.300)"
                  bgClip="text"
                  fontWeight="700"
                >
                  Wybierz Asystenta AI
                </Heading>
                <Text
                  color="rgba(255, 255, 255, 0.7)"
                  lineHeight="1.6"
                  fontSize="md"
                >
                  Kliknij przycisk menu w lewym górnym rogu, aby wybrać jednego
                  z dostępnych asystentów AI i rozpocząć inteligentną rozmowę.
                  Każdy asystent ma unikalną osobowość i zaawansowaną pamięć
                  kontekstową.
                </Text>
              </VStack>

              <Box
                p={4}
                bg="rgba(255, 255, 255, 0.05)"
                border="1px solid"
                borderColor="rgba(255, 255, 255, 0.1)"
                borderRadius="12px"
                backdropFilter="blur(10px)"
              >
                <Text fontSize="sm" color="rgba(255, 255, 255, 0.6)">
                  💡 Każdy asystent został stworzony z zaawansowanymi
                  możliwościami AI i pamięta Twoje poprzednie rozmowy
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

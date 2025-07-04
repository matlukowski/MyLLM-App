import React from "react";
import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  Button,
  Icon,
  Badge,
} from "@chakra-ui/react";
import { HiArrowRightOnRectangle, HiOutlineSparkles } from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AI_CHARACTERS_FRONTEND } from "../../config/aiCharacters";

interface SidebarContentProps {
  activeAIChar: string | null;
  setActiveAIChar: (charId: string) => void;
  onAICharSelect?: () => void; // Callback wywoływany po wyborze asystenta (dla mobile drawer)
}

const SidebarContent: React.FC<SidebarContentProps> = ({
  activeAIChar,
  setActiveAIChar,
  onAICharSelect,
}) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const aiCharacters = AI_CHARACTERS_FRONTEND;

  const handleLogout = () => {
    logout();
    navigate("/auth");
  };

  const handleCharacterSelect = (charId: string) => {
    setActiveAIChar(charId);
    onAICharSelect?.(); // Wywołaj callback (zamknij drawer na mobile)
  };

  return (
    <>
      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
      <Flex
        direction="column"
        w="320px"
        h="100vh"
        bg="rgba(0, 0, 0, 0.6)"
        backdropFilter="blur(20px)"
        borderRight="1px solid"
        borderColor="rgba(255, 255, 255, 0.1)"
        position="relative"
      >
        {/* Header sidebara */}
        <Box
          pt={20}
          px={6}
          pb={6}
          borderBottom="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          bg="rgba(255, 255, 255, 0.02)"
        >
          {/* Logo i tytuł aplikacji */}
          <Flex justify="center" mb={4}>
            <Flex
              align="center"
              justify="center"
              w={12}
              h={12}
              bgGradient="linear(135deg, purple.500, blue.500)"
              borderRadius="16px"
              boxShadow="0 4px 16px rgba(147, 51, 234, 0.3)"
              position="relative"
              overflow="hidden"
              _before={{
                content: '""',
                position: "absolute",
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                bgGradient:
                  "linear(45deg, transparent, rgba(255,255,255,0.2), transparent)",
                animation: "shimmer 3s infinite",
              }}
            >
              <Icon
                as={HiOutlineSparkles}
                boxSize={6}
                color="white"
                zIndex={1}
              />
            </Flex>
          </Flex>

          {/* Tytuł aplikacji */}
          <VStack gap={1} mb={4}>
            <Heading
              size="lg"
              bgGradient="linear(to-r, white, gray.300)"
              bgClip="text"
              fontWeight="700"
              textAlign="center"
            >
              Chat AI
            </Heading>
            <Text
              fontSize="sm"
              color="rgba(255, 255, 255, 0.6)"
              textAlign="center"
            >
              Witaj, {user?.username}
            </Text>
          </VStack>

          <Button
            onClick={handleLogout}
            w="full"
            size="sm"
            bg="rgba(255, 255, 255, 0.05)"
            color="rgba(255, 255, 255, 0.8)"
            border="1px solid"
            borderColor="rgba(255, 255, 255, 0.1)"
            borderRadius="12px"
            _hover={{
              bg: "rgba(255, 255, 255, 0.1)",
              borderColor: "rgba(255, 255, 255, 0.2)",
              transform: "translateY(-1px)",
            }}
            _active={{
              transform: "translateY(0px)",
            }}
            transition="all 0.2s ease"
            fontWeight="500"
          >
            <Flex align="center" gap={2}>
              <Icon as={HiArrowRightOnRectangle} boxSize={4} />
              <Text>Wyloguj się</Text>
            </Flex>
          </Button>
        </Box>

        {/* Lista postaci AI */}
        <VStack align="stretch" flex="1" overflowY="auto" p={4} gap={3}>
          <Text
            fontSize="xs"
            fontWeight="600"
            color="rgba(255, 255, 255, 0.6)"
            textTransform="uppercase"
            letterSpacing="wider"
            px={2}
            mb={2}
          >
            Dostępne Asystenci AI
          </Text>

          {aiCharacters.map((char) => (
            <Box
              key={char.id}
              onClick={() => handleCharacterSelect(char.id)}
              p={4}
              cursor="pointer"
              bg={
                char.id === activeAIChar
                  ? "rgba(147, 51, 234, 0.15)"
                  : "rgba(255, 255, 255, 0.03)"
              }
              border="1px solid"
              borderColor={
                char.id === activeAIChar
                  ? "rgba(147, 51, 234, 0.3)"
                  : "rgba(255, 255, 255, 0.08)"
              }
              borderRadius="16px"
              position="relative"
              overflow="hidden"
              transition="all 0.3s cubic-bezier(0.4, 0, 0.2, 1)"
              _hover={{
                bg:
                  char.id === activeAIChar
                    ? "rgba(147, 51, 234, 0.2)"
                    : "rgba(255, 255, 255, 0.08)",
                borderColor:
                  char.id === activeAIChar
                    ? "rgba(147, 51, 234, 0.4)"
                    : "rgba(255, 255, 255, 0.15)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 25px rgba(0, 0, 0, 0.3)",
              }}
              _active={{
                transform: "translateY(0px)",
              }}
            >
              {/* Gradient overlay dla aktywnej karty */}
              {char.id === activeAIChar && (
                <Box
                  position="absolute"
                  top={0}
                  left={0}
                  right={0}
                  bottom={0}
                  bgGradient="linear(135deg, rgba(147, 51, 234, 0.1), transparent)"
                  borderRadius="16px"
                  zIndex={0}
                />
              )}

              <Flex align="start" gap={3} position="relative" zIndex={1}>
                <Flex
                  align="center"
                  justify="center"
                  w={12}
                  h={12}
                  bg={char.color.replace(".500", ".600")}
                  borderRadius="12px"
                  fontSize="xl"
                  flexShrink={0}
                  boxShadow="0 4px 12px rgba(0, 0, 0, 0.2)"
                >
                  {char.avatar}
                </Flex>

                <VStack align="start" gap={1} flex={1} minW={0}>
                  <Flex align="center" gap={2} w="full">
                    <Text
                      fontWeight="600"
                      color="white"
                      fontSize="sm"
                      lineHeight="1.2"
                      overflow="hidden"
                      textOverflow="ellipsis"
                      whiteSpace="nowrap"
                    >
                      {char.name}
                    </Text>
                    {char.id === activeAIChar && (
                      <Badge
                        size="sm"
                        colorScheme="purple"
                        borderRadius="6px"
                        fontSize="10px"
                        fontWeight="600"
                        px={2}
                        py={0.5}
                      >
                        Aktywny
                      </Badge>
                    )}
                  </Flex>

                  <Text
                    fontSize="xs"
                    color="rgba(255, 255, 255, 0.7)"
                    lineHeight="1.3"
                    overflow="hidden"
                    display="-webkit-box"
                    style={{
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: "vertical",
                    }}
                  >
                    {char.description}
                  </Text>
                </VStack>
              </Flex>
            </Box>
          ))}
        </VStack>
      </Flex>
    </>
  );
};

export default SidebarContent;

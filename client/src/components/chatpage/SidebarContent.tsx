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
  HStack,
} from "@chakra-ui/react";
import {
  HiArrowRightOnRectangle,
  HiOutlineSparkles,
  HiOutlinePlus,
} from "react-icons/hi2";
import { useAuth } from "../../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { AI_CHARACTERS_FRONTEND } from "../../config/aiCharacters";

interface SidebarContentProps {
  activeAIChar: string | null;
  setActiveAIChar: (charId: string | null) => void;
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

  const handleNewChat = () => {
    setActiveAIChar(null);
    onAICharSelect?.();
  };

  return (
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

      {/* Lista asystentów */}
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
          Asystenci
        </Text>

        {aiCharacters.map((char) => (
          <Button
            key={char.id}
            onClick={() => handleCharacterSelect(char.id)}
            w="full"
            h="auto"
            p={3}
            bg={char.id === activeAIChar ? "gray.800" : "transparent"}
            color="white"
            border="none"
            borderRadius="8px"
            justifyContent="flex-start"
            _hover={{
              bg: char.id === activeAIChar ? "gray.800" : "gray.800",
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
                bg={char.color.replace(".500", ".600")}
                borderRadius="6px"
                fontSize="sm"
                flexShrink={0}
              >
                {char.avatar}
              </Flex>

              <VStack align="start" gap={0} flex={1} minW={0}>
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
                    {char.name}
                  </Text>
                  {char.id === activeAIChar && (
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
                  {char.description}
                </Text>
              </VStack>
            </HStack>
          </Button>
        ))}
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
            >
              <Icon as={HiArrowRightOnRectangle} boxSize={4} />
            </Button>
          </HStack>
        </VStack>
      </Box>
    </Flex>
  );
};

export default SidebarContent;

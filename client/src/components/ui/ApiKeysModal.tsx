import React, { useState, useEffect } from "react";
import {
  Dialog,
  Portal,
  CloseButton,
  Box,
  VStack,
  HStack,
  Text,
  Input,
  Button,
  Badge,
  IconButton,
  Flex,
  Heading,
  Icon,
} from "@chakra-ui/react";
import {
  HiOutlineEye,
  HiOutlineEyeSlash,
  HiOutlineTrash,
} from "react-icons/hi2";
import { ApiKey } from "../../types/types";
import { toast } from "react-toastify";

interface ApiKeysModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const API_PROVIDERS = [
  {
    id: "openai",
    name: "OpenAI",
    description: "Klucz API dla modeli GPT-4, GPT-4.1, GPT-4 Turbo",
    placeholder: "sk-...",
    helpText: "Znajdź swój klucz API na platform.openai.com",
  },
  {
    id: "anthropic",
    name: "Anthropic",
    description: "Klucz API dla modeli Claude",
    placeholder: "sk-ant-...",
    helpText: "Znajdź swój klucz API na console.anthropic.com",
  },
  {
    id: "google",
    name: "Google",
    description: "Klucz API dla modeli Gemini",
    placeholder: "AIza...",
    helpText: "Znajdź swój klucz API na console.cloud.google.com",
  },
];

const ApiKeysModal: React.FC<ApiKeysModalProps> = ({ isOpen, onClose }) => {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [newKeys, setNewKeys] = useState<{ [key: string]: string }>({});
  const [showKeys, setShowKeys] = useState<{ [key: string]: boolean }>({});

  // Załaduj zapisane klucze API z localStorage
  useEffect(() => {
    const savedKeys = localStorage.getItem("apiKeys");
    if (savedKeys) {
      try {
        setApiKeys(JSON.parse(savedKeys));
      } catch (error) {
        console.error("Błąd podczas ładowania kluczy API:", error);
      }
    }
  }, []);

  // Zapisz klucze API do localStorage
  const saveApiKeys = (keys: ApiKey[]) => {
    localStorage.setItem("apiKeys", JSON.stringify(keys));
    setApiKeys(keys);
  };

  // Dodaj lub zaktualizuj klucz API
  const handleSaveKey = (providerId: string) => {
    const keyValue = newKeys[providerId]?.trim();
    if (!keyValue) {
      toast.error("Proszę wprowadzić klucz API");
      return;
    }

    const existingKeyIndex = apiKeys.findIndex(
      (key) => key.provider === providerId
    );

    let updatedKeys: ApiKey[];
    if (existingKeyIndex >= 0) {
      // Zaktualizuj istniejący klucz
      updatedKeys = apiKeys.map((key, index) =>
        index === existingKeyIndex
          ? { ...key, key: keyValue, isActive: true }
          : key
      );
    } else {
      // Dodaj nowy klucz
      const newKey: ApiKey = {
        id: `${providerId}-${Date.now()}`,
        provider: providerId,
        key: keyValue,
        isActive: true,
      };
      updatedKeys = [...apiKeys, newKey];
    }

    saveApiKeys(updatedKeys);
    setNewKeys({ ...newKeys, [providerId]: "" });

    toast.success("Klucz API został zapisany");
  };

  // Usuń klucz API
  const handleDeleteKey = (keyId: string) => {
    const updatedKeys = apiKeys.filter((key) => key.id !== keyId);
    saveApiKeys(updatedKeys);

    toast.info("Klucz API został usunięty");
  };

  // Przełącz widoczność klucza
  const toggleKeyVisibility = (keyId: string) => {
    setShowKeys({ ...showKeys, [keyId]: !showKeys[keyId] });
  };

  // Pobierz klucz dla dostawcy
  const getKeyForProvider = (providerId: string): ApiKey | undefined => {
    return apiKeys.find((key) => key.provider === providerId && key.isActive);
  };

  // Maskuj klucz API
  const maskApiKey = (key: string): string => {
    if (key.length <= 8) return key;
    return `${key.substring(0, 4)}...${key.substring(key.length - 4)}`;
  };

  return (
    <Dialog.Root
      open={isOpen}
      onOpenChange={(e) => !e.open && onClose()}
      size="xl"
    >
      <Portal>
        <Dialog.Backdrop />
        <Dialog.Positioner>
          <Dialog.Content maxW="1200px" maxH="80vh">
            <Dialog.Header>
              <Dialog.Title>
                <Heading size="lg" color="gray.800">
                  Klucze API
                </Heading>
              </Dialog.Title>
              <Dialog.CloseTrigger asChild>
                <CloseButton size="sm" />
              </Dialog.CloseTrigger>
            </Dialog.Header>

            <Dialog.Body overflowY="auto">
              <VStack gap={6} align="stretch">
                <Box
                  bg="blue.50"
                  border="1px solid"
                  borderColor="blue.200"
                  borderRadius="md"
                  p={4}
                >
                  <Text fontSize="sm" color="blue.700">
                    ℹ️ Klucze API są przechowywane lokalnie w Twojej
                    przeglądarce i nie są wysyłane na nasze serwery.
                  </Text>
                </Box>

                {API_PROVIDERS.map((provider, index) => {
                  const existingKey = getKeyForProvider(provider.id);
                  const keyId = existingKey?.id || "";

                  return (
                    <Box key={provider.id}>
                      <VStack align="stretch" gap={3}>
                        <HStack justify="space-between">
                          <VStack align="start" gap={1}>
                            <HStack gap={2}>
                              <Text fontWeight="600" fontSize="md">
                                {provider.name}
                              </Text>
                              {existingKey && (
                                <Badge colorScheme="green" size="sm">
                                  Skonfigurowany
                                </Badge>
                              )}
                            </HStack>
                            <Text fontSize="sm" color="gray.600">
                              {provider.description}
                            </Text>
                          </VStack>
                        </HStack>

                        {existingKey ? (
                          <HStack gap={2}>
                            <Input
                              value={
                                showKeys[keyId]
                                  ? existingKey.key
                                  : maskApiKey(existingKey.key)
                              }
                              readOnly
                              bg="gray.50"
                              fontSize="sm"
                              fontFamily="mono"
                            />
                            <IconButton
                              aria-label="Pokaż/ukryj klucz"
                              size="sm"
                              onClick={() => toggleKeyVisibility(keyId)}
                            >
                              <Icon
                                as={
                                  showKeys[keyId]
                                    ? HiOutlineEyeSlash
                                    : HiOutlineEye
                                }
                              />
                            </IconButton>
                            <IconButton
                              aria-label="Usuń klucz"
                              size="sm"
                              colorScheme="red"
                              variant="outline"
                              onClick={() => handleDeleteKey(keyId)}
                            >
                              <Icon as={HiOutlineTrash} />
                            </IconButton>
                          </HStack>
                        ) : (
                          <Box>
                            <Text fontSize="sm" fontWeight="600" mb={2}>
                              Klucz API
                            </Text>
                            <HStack gap={2}>
                              <Input
                                value={newKeys[provider.id] || ""}
                                onChange={(e) =>
                                  setNewKeys({
                                    ...newKeys,
                                    [provider.id]: e.target.value,
                                  })
                                }
                                placeholder={provider.placeholder}
                                type="text"
                                fontSize="sm"
                                fontFamily="mono"
                                color="gray.800"
                              />
                              <Button
                                onClick={() => handleSaveKey(provider.id)}
                                size="sm"
                                colorScheme="blue"
                                disabled={!newKeys[provider.id]?.trim()}
                              >
                                Zapisz
                              </Button>
                            </HStack>
                            <Text fontSize="xs" color="gray.500" mt={1}>
                              {provider.helpText}
                            </Text>
                          </Box>
                        )}
                      </VStack>
                      {index < API_PROVIDERS.length - 1 && (
                        <Box w="full" h="1px" bg="gray.200" mt={4} />
                      )}
                    </Box>
                  );
                })}
              </VStack>
            </Dialog.Body>

            <Dialog.Footer>
              <Button onClick={onClose}>Zamknij</Button>
            </Dialog.Footer>
          </Dialog.Content>
        </Dialog.Positioner>
      </Portal>
    </Dialog.Root>
  );
};

export default ApiKeysModal;

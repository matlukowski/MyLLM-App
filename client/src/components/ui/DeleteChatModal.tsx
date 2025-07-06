import React from "react";
import {
  Box,
  Button,
  Text,
  VStack,
  HStack,
  Icon,
  IconButton,
  Flex,
  Heading,
} from "@chakra-ui/react";
import { HiOutlineExclamationTriangle, HiOutlineXMark } from "react-icons/hi2";

interface DeleteChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  chatTitle: string;
  isDeleting: boolean;
}

const DeleteChatModal: React.FC<DeleteChatModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  chatTitle,
  isDeleting,
}) => {
  if (!isOpen) return null;

  return (
    <Box
      position="fixed"
      top={0}
      left={0}
      right={0}
      bottom={0}
      bg="rgba(0, 0, 0, 0.5)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex={1000}
      p={4}
    >
      <Box
        bg="white"
        borderRadius="16px"
        boxShadow="xl"
        maxW="500px"
        w="full"
        position="relative"
      >
        {/* Header */}
        <Flex
          justify="space-between"
          align="center"
          p={6}
          borderBottom="1px solid"
          borderColor="gray.200"
        >
          <HStack gap={3}>
            <Icon
              as={HiOutlineExclamationTriangle}
              color="red.500"
              boxSize={6}
            />
            <Heading size="md" color="gray.800">
              Usuń rozmowę
            </Heading>
          </HStack>
          <IconButton
            aria-label="Zamknij"
            size="sm"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            <Icon as={HiOutlineXMark} />
          </IconButton>
        </Flex>

        {/* Body */}
        <Box p={6}>
          <VStack gap={4} align="start">
            <Text color="gray.700">Czy na pewno chcesz usunąć tę rozmowę?</Text>
            <Text fontWeight="600" color="gray.800">
              "{chatTitle}"
            </Text>
            <Text fontSize="sm" color="gray.600">
              Ta akcja jest nieodwracalna. Wszystkie wiadomości z tej rozmowy
              zostaną trwale usunięte.
            </Text>
          </VStack>
        </Box>

        {/* Footer */}
        <Flex
          justify="flex-end"
          gap={3}
          p={6}
          borderTop="1px solid"
          borderColor="gray.200"
        >
          <Button variant="ghost" onClick={onClose} disabled={isDeleting}>
            Anuluj
          </Button>
          <Button
            colorScheme="red"
            onClick={onConfirm}
            loading={isDeleting}
            loadingText="Usuwanie..."
          >
            Usuń rozmowę
          </Button>
        </Flex>
      </Box>
    </Box>
  );
};

export default DeleteChatModal;

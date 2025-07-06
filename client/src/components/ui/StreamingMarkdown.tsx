import React from "react";
import { Box, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import MarkdownRenderer from "./MarkdownRenderer";

// Animacja migającego kursora
const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

interface StreamingMarkdownProps {
  content: string;
  isStreaming: boolean;
}

const StreamingMarkdown: React.FC<StreamingMarkdownProps> = ({
  content,
  isStreaming,
}) => {
  return (
    <Box position="relative">
      {/* Renderuj zawartość markdown */}
      <MarkdownRenderer
        content={content}
        fontSize="sm"
        lineHeight="1.6"
        color="gray.800"
      />

      {/* Pokaż migający kursor jeśli streamowanie jest aktywne */}
      {isStreaming && (
        <Text
          as="span"
          color="gray.400"
          animation={`${blinkAnimation} 1s infinite`}
          fontWeight="normal"
          ml={content ? 1 : 0}
        >
          |
        </Text>
      )}
    </Box>
  );
};

export default StreamingMarkdown;

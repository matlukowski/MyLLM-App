import React, { useState, useEffect } from "react";
import { Box, Text } from "@chakra-ui/react";
import { keyframes } from "@emotion/react";
import MarkdownRenderer from "./MarkdownRenderer";

// Animacja migającego kursora
const blinkAnimation = keyframes`
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
`;

interface TypewriterMarkdownProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

const TypewriterMarkdown: React.FC<TypewriterMarkdownProps> = ({
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
    <Box position="relative">
      <MarkdownRenderer content={displayedText} />
      {!isComplete && (
        <Text
          as="span"
          color="gray.400"
          animation={`${blinkAnimation} 1s infinite`}
          fontWeight="normal"
          position="absolute"
          right={0}
          bottom={0}
        >
          |
        </Text>
      )}
    </Box>
  );
};

export default TypewriterMarkdown;

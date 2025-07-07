import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import {
  Box,
  Code,
  Text,
  Heading,
  Link,
  chakra,
  Button,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { FiCopy, FiCheck } from "react-icons/fi";
import "highlight.js/styles/github-dark.css";

interface MarkdownRendererProps {
  content: string;
  fontSize?: string;
  lineHeight?: string;
  color?: string;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  fontSize = "sm",
  lineHeight = "1.6",
  color = "gray.800",
}) => {
  return (
    <Box fontSize={fontSize} lineHeight={lineHeight} color={color}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        remarkRehypeOptions={{ allowDangerousHtml: true }}
        components={{
          // Paragraphs
          p: ({ children }) => (
            <Text mb={3} whiteSpace="pre-wrap" wordBreak="break-word">
              {children}
            </Text>
          ),

          // Headings
          h1: ({ children }) => (
            <Heading as="h1" size="xl" mt={4} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),
          h2: ({ children }) => (
            <Heading as="h2" size="lg" mt={4} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),
          h3: ({ children }) => (
            <Heading as="h3" size="md" mt={3} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),
          h4: ({ children }) => (
            <Heading as="h4" size="sm" mt={3} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),
          h5: ({ children }) => (
            <Heading as="h5" size="xs" mt={3} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),
          h6: ({ children }) => (
            <Heading as="h6" size="xs" mt={3} mb={2} fontWeight="600">
              {children}
            </Heading>
          ),

          // Lists
          ul: ({ children }) => (
            <chakra.ul pl={6} mb={3} css={{ listStyleType: "disc" }}>
              {children}
            </chakra.ul>
          ),
          ol: ({ children }) => (
            <chakra.ol pl={6} mb={3} css={{ listStyleType: "decimal" }}>
              {children}
            </chakra.ol>
          ),
          li: ({ children }) => <chakra.li mb={1}>{children}</chakra.li>,

          // Code blocks and inline code
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)(?::(.*?))?/.exec(className || "");
            const isInline = !match;
            const [hasCopied, setHasCopied] = useState(false);

            const lang = match?.[1] || "";
            const filename = match?.[2] || "";
            const codeText = String(children).replace(/\n$/, "");

            const handleCopy = () => {
              navigator.clipboard.writeText(codeText).then(() => {
                setHasCopied(true);
                setTimeout(() => setHasCopied(false), 2000);
              });
            };

            if (isInline) {
              return (
                <Code
                  fontWeight="semibold"
                  bg="transparent"
                  p={0}
                  color="inherit"
                  {...props}
                >
                  {children}
                </Code>
              );
            }

            return (
              <Box position="relative" mb={4}>
                {filename && (
                  <Box
                    bg="gray.700"
                    color="gray.200"
                    px={4}
                    py={2}
                    borderTopRadius="md"
                    fontSize="sm"
                    fontFamily="mono"
                  >
                    {filename}
                  </Box>
                )}
                <Button
                  size="sm"
                  position="absolute"
                  top={filename ? "calc(2.5rem + 8px)" : "8px"}
                  right="8px"
                  onClick={handleCopy}
                  zIndex={1}
                  variant="ghost"
                  colorScheme="gray"
                  aria-label="Copy code"
                >
                  <HStack gap={2}>
                    <Icon as={hasCopied ? FiCheck : FiCopy} />
                    <Text>{hasCopied ? "Skopiowano" : "Kopiuj"}</Text>
                  </HStack>
                </Button>
                <Box
                  as="pre"
                  p={4}
                  overflow="auto"
                  fontSize="sm"
                  fontFamily="monospace"
                  border="1px solid"
                  borderColor="gray.200"
                  bg="gray.800"
                  color="white"
                  borderBottomRadius="md"
                  borderTopRadius={filename ? "none" : "md"}
                  {...props}
                >
                  <code className={`language-${lang}`}>{children}</code>
                </Box>
              </Box>
            );
          },

          // Blockquotes
          blockquote: ({ children }) => (
            <Box
              borderLeft="4px solid"
              borderColor="gray.300"
              pl={4}
              py={2}
              mb={3}
              fontStyle="italic"
              color="gray.600"
              bg="gray.50"
            >
              {children}
            </Box>
          ),

          // Tables
          table: ({ children }) => (
            <chakra.table
              w="full"
              borderCollapse="collapse"
              mb={3}
              border="1px solid"
              borderColor="gray.200"
            >
              {children}
            </chakra.table>
          ),
          thead: ({ children }) => (
            <chakra.thead bg="gray.50">{children}</chakra.thead>
          ),
          tbody: ({ children }) => <chakra.tbody>{children}</chakra.tbody>,
          tr: ({ children }) => <chakra.tr>{children}</chakra.tr>,
          th: ({ children }) => (
            <chakra.th
              border="1px solid"
              borderColor="gray.200"
              p={2}
              textAlign="left"
              fontWeight="600"
            >
              {children}
            </chakra.th>
          ),
          td: ({ children }) => (
            <chakra.td border="1px solid" borderColor="gray.200" p={2}>
              {children}
            </chakra.td>
          ),

          // Links
          a: ({ children, href }) => (
            <Link
              href={href}
              color="blue.500"
              textDecoration="underline"
              _hover={{ color: "blue.600" }}
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </Link>
          ),

          // Horizontal rule
          hr: () => (
            <chakra.hr
              border="none"
              borderTop="1px solid"
              borderColor="gray.200"
              my={4}
            />
          ),

          // Strong and emphasis
          strong: ({ children }) => (
            <Text as="strong" fontWeight="600">
              {children}
            </Text>
          ),
          em: ({ children }) => (
            <Text as="em" fontStyle="italic">
              {children}
            </Text>
          ),

          // Collapsible sections - Details and Summary
          details: ({ children }) => (
            <chakra.details
              border="1px solid"
              borderColor="gray.200"
              borderRadius="md"
              mb={3}
              p={0}
            >
              {children}
            </chakra.details>
          ),
          summary: ({ children }) => (
            <chakra.summary
              py={3}
              px={4}
              cursor="pointer"
              fontWeight="500"
              _hover={{ bg: "gray.50" }}
              css={{
                "&::-webkit-details-marker": {
                  display: "none",
                },
              }}
            >
              <Box
                display="flex"
                alignItems="center"
                justifyContent="space-between"
              >
                <Box flex="1" textAlign="left">
                  {children}
                </Box>
                <chakra.span
                  css={{
                    transform: "rotate(0deg)",
                    transition: "transform 0.2s",
                    "details[open] &": {
                      transform: "rotate(90deg)",
                    },
                  }}
                >
                  ▶
                </chakra.span>
              </Box>
            </chakra.summary>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
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
  Badge,
  VStack,
} from "@chakra-ui/react";
import {
  FiCopy,
  FiCheck,
  FiCode,
  FiExternalLink,
  FiInfo,
  FiAlertCircle,
  FiCheckCircle,
} from "react-icons/fi";
import "highlight.js/styles/github-dark.css";
import "katex/dist/katex.min.css";

interface MarkdownRendererProps {
  content: string;
  fontSize?: string;
  lineHeight?: string;
  color?: string;
  isStreaming?: boolean;
}

const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({
  content,
  fontSize = "sm",
  lineHeight = "1.7",
  color,
  isStreaming = false,
}) => {
  const [copiedBlocks, setCopiedBlocks] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Wyczyść skopiowane bloki po 3 sekundach
    const timer = setTimeout(() => {
      setCopiedBlocks(new Set());
    }, 3000);
    return () => clearTimeout(timer);
  }, [copiedBlocks]);

  const handleCopy = (text: string, blockId: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedBlocks((prev) => new Set(prev).add(blockId));
    });
  };

  const renderAlert = (
    type: "info" | "warning" | "error" | "success",
    children: any
  ) => {
    const alertStyles = {
      info: { bg: "blue.50", borderColor: "blue.300", icon: FiInfo },
      warning: {
        bg: "orange.50",
        borderColor: "orange.300",
        icon: FiAlertCircle,
      },
      error: { bg: "red.50", borderColor: "red.300", icon: FiAlertCircle },
      success: {
        bg: "green.50",
        borderColor: "green.300",
        icon: FiCheckCircle,
      },
    };

    const style = alertStyles[type];

    return (
      <Box
        bg={style.bg}
        borderLeft="4px solid"
        borderColor={style.borderColor}
        p={4}
        borderRadius="md"
        mb={4}
        display="flex"
        alignItems="flex-start"
        gap={3}
      >
        <Icon as={style.icon} color={style.borderColor} mt={1} />
        <Box flex="1">{children}</Box>
      </Box>
    );
  };

  return (
    <Box
      fontSize={fontSize}
      lineHeight={lineHeight}
      color={color || "gray.800"}
      position="relative"
    >
      {isStreaming && (
        <Box
          position="absolute"
          bottom={0}
          right={0}
          w="2px"
          h="1.2em"
          borderRight="2px solid"
          borderColor="blue.500"
          animation="blink 1s infinite"
          css={{
            "@keyframes blink": {
              "0%, 50%": { borderColor: "transparent" },
              "51%, 100%": { borderColor: "currentColor" },
            },
          }}
        />
      )}

      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeHighlight, rehypeKatex]}
        remarkRehypeOptions={{ allowDangerousHtml: true }}
        components={{
          // Paragraphs z lepszym spacingiem
          p: ({ children }) => {
            const text = String(children);

            // Obsługa alertów
            if (text.startsWith("[!NOTE]") || text.startsWith("[!INFO]")) {
              return renderAlert(
                "info",
                text.replace(/^\[!(NOTE|INFO)\]\s*/, "")
              );
            }
            if (
              text.startsWith("[!WARNING]") ||
              text.startsWith("[!CAUTION]")
            ) {
              return renderAlert(
                "warning",
                text.replace(/^\[!(WARNING|CAUTION)\]\s*/, "")
              );
            }
            if (
              text.startsWith("[!IMPORTANT]") ||
              text.startsWith("[!ERROR]")
            ) {
              return renderAlert(
                "error",
                text.replace(/^\[!(IMPORTANT|ERROR)\]\s*/, "")
              );
            }
            if (text.startsWith("[!TIP]") || text.startsWith("[!SUCCESS]")) {
              return renderAlert(
                "success",
                text.replace(/^\[!(TIP|SUCCESS)\]\s*/, "")
              );
            }

            return (
              <Text
                mb={4}
                whiteSpace="pre-wrap"
                wordBreak="break-word"
                textAlign="justify"
              >
                {children}
              </Text>
            );
          },

          // Headings z lepszym designem
          h1: ({ children }) => (
            <VStack align="start" gap={2} mt={6} mb={4}>
              <Heading as="h1" size="2xl" fontWeight="700" color="blue.600">
                {children}
              </Heading>
              <Box w="full" h="2px" bg="gray.200" />
            </VStack>
          ),
          h2: ({ children }) => (
            <VStack align="start" gap={2} mt={6} mb={3}>
              <Heading
                as="h2"
                size="xl"
                fontWeight="600"
                position="relative"
                pl={4}
                _before={{
                  content: '""',
                  position: "absolute",
                  left: "0",
                  top: "50%",
                  transform: "translateY(-50%)",
                  width: "4px",
                  height: "24px",
                  bg: "blue.500",
                  borderRadius: "2px",
                }}
              >
                {children}
              </Heading>
            </VStack>
          ),
          h3: ({ children }) => (
            <Heading
              as="h3"
              size="lg"
              mt={5}
              mb={3}
              fontWeight="600"
              color="gray.700"
              borderBottom="2px solid"
              borderColor="gray.200"
              pb={1}
            >
              {children}
            </Heading>
          ),
          h4: ({ children }) => (
            <Heading
              as="h4"
              size="md"
              mt={4}
              mb={2}
              fontWeight="600"
              color="gray.600"
            >
              {children}
            </Heading>
          ),
          h5: ({ children }) => (
            <Heading
              as="h5"
              size="sm"
              mt={4}
              mb={2}
              fontWeight="600"
              color="gray.600"
            >
              {children}
            </Heading>
          ),
          h6: ({ children }) => (
            <Heading
              as="h6"
              size="xs"
              mt={4}
              mb={2}
              fontWeight="600"
              color="gray.600"
            >
              {children}
            </Heading>
          ),

          // Lists z lepszym designem
          ul: ({ children }) => (
            <chakra.ul
              pl={6}
              mb={4}
              css={{
                listStyleType: "none",
                "& > li": {
                  position: "relative",
                  "&::before": {
                    content: '"•"',
                    color: "#3182ce",
                    fontWeight: "bold",
                    position: "absolute",
                    left: "-1.2em",
                    fontSize: "1.2em",
                  },
                },
              }}
            >
              {children}
            </chakra.ul>
          ),
          ol: ({ children }) => (
            <chakra.ol
              pl={6}
              mb={4}
              css={{
                listStyleType: "none",
                counterReset: "item",
                "& > li": {
                  position: "relative",
                  counterIncrement: "item",
                  "&::before": {
                    content: 'counter(item) "."',
                    color: "#3182ce",
                    fontWeight: "600",
                    position: "absolute",
                    left: "-1.8em",
                    minWidth: "1.5em",
                    textAlign: "right",
                  },
                },
              }}
            >
              {children}
            </chakra.ol>
          ),
          li: ({ children }) => (
            <chakra.li mb={2} lineHeight="1.6">
              {children}
            </chakra.li>
          ),

          // Code blocks z ulepszonym designem
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)(?::(.*?))?/.exec(className || "");
            const isInline = !match;
            const lang = match?.[1] || "";
            const filename = match?.[2] || "";
            const codeText = String(children).replace(/\n$/, "");
            const blockId = `${lang}-${codeText.slice(0, 20)}`;
            const hasCopied = copiedBlocks.has(blockId);

            if (isInline) {
              return (
                <Code
                  fontWeight="600"
                  bg="gray.100"
                  px={2}
                  py={1}
                  borderRadius="md"
                  fontSize="0.9em"
                  color="blue.600"
                  border="1px solid"
                  borderColor="gray.200"
                  {...props}
                >
                  {children}
                </Code>
              );
            }

            return (
              <Box position="relative" mb={6}>
                {/* Header z nazwą języka i filename */}
                <HStack
                  bg="gray.700"
                  color="gray.200"
                  px={4}
                  py={3}
                  borderTopRadius="lg"
                  justify="space-between"
                  fontSize="sm"
                >
                  <HStack>
                    <Icon as={FiCode} />
                    {lang && (
                      <Badge colorScheme="blue" variant="solid" fontSize="xs">
                        {lang.toUpperCase()}
                      </Badge>
                    )}
                    {filename && (
                      <Text fontFamily="mono" color="gray.300">
                        {filename}
                      </Text>
                    )}
                  </HStack>

                  <Button
                    size="xs"
                    onClick={() => handleCopy(codeText, blockId)}
                    variant="ghost"
                    colorScheme="gray"
                    _hover={{ bg: "gray.600" }}
                  >
                    <HStack gap={1}>
                      <Icon as={hasCopied ? FiCheck : FiCopy} />
                      <Text>{hasCopied ? "Skopiowano!" : "Kopiuj"}</Text>
                    </HStack>
                  </Button>
                </HStack>

                <Box
                  as="pre"
                  p={4}
                  overflow="auto"
                  fontSize="sm"
                  fontFamily="'Fira Code', 'Cascadia Code', Consolas, monospace"
                  bg="gray.800"
                  color="white"
                  borderBottomRadius="lg"
                  border="1px solid"
                  borderColor="gray.200"
                  borderTop="none"
                  maxH="500px"
                  position="relative"
                  {...props}
                >
                  <code className={`language-${lang}`}>{children}</code>
                </Box>
              </Box>
            );
          },

          // Blockquotes z lepszym designem
          blockquote: ({ children }) => (
            <Box
              borderLeft="4px solid"
              borderColor="blue.300"
              bg="blue.50"
              pl={6}
              pr={4}
              py={4}
              mb={4}
              borderRadius="md"
              position="relative"
              _before={{
                content: '"❝"',
                position: "absolute",
                top: "8px",
                left: "12px",
                fontSize: "24px",
                color: "blue.300",
                opacity: 0.6,
              }}
            >
              <Box ml={4}>{children}</Box>
            </Box>
          ),

          // Tables z lepszym designem
          table: ({ children }) => (
            <Box overflowX="auto" mb={6}>
              <chakra.table
                w="full"
                borderCollapse="separate"
                borderSpacing="0"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="lg"
                boxShadow="sm"
              >
                {children}
              </chakra.table>
            </Box>
          ),
          thead: ({ children }) => (
            <chakra.thead bg="gray.50">{children}</chakra.thead>
          ),
          tbody: ({ children }) => <chakra.tbody>{children}</chakra.tbody>,
          tr: ({ children, ...props }) => (
            <chakra.tr
              _hover={{ bg: "gray.50" }}
              transition="background-color 0.2s"
              {...props}
            >
              {children}
            </chakra.tr>
          ),
          th: ({ children }) => (
            <chakra.th
              border="1px solid"
              borderColor="gray.200"
              p={3}
              textAlign="left"
              fontWeight="700"
              fontSize="sm"
              textTransform="uppercase"
              letterSpacing="wide"
              color="gray.600"
            >
              {children}
            </chakra.th>
          ),
          td: ({ children }) => (
            <chakra.td
              border="1px solid"
              borderColor="gray.200"
              p={3}
              fontSize="sm"
            >
              {children}
            </chakra.td>
          ),

          // Links z lepszym designem
          a: ({ children, href }) => (
            <Link
              href={href}
              color="blue.500"
              textDecoration="none"
              borderBottom="1px solid transparent"
              _hover={{
                color: "blue.600",
                borderBottomColor: "blue.600",
                textDecoration: "none",
              }}
              target="_blank"
              rel="noopener noreferrer"
              display="inline-flex"
              alignItems="center"
              gap={1}
            >
              {children}
              <Icon as={FiExternalLink} boxSize="12px" />
            </Link>
          ),

          // Horizontal rule
          hr: () => (
            <Box
              as="hr"
              my={8}
              border="none"
              borderTop="2px solid"
              borderColor="gray.200"
              opacity={0.6}
            />
          ),

          // Strong i emphasis z lepszymi stylami
          strong: ({ children }) => (
            <Text as="strong" fontWeight="700" color="gray.900">
              {children}
            </Text>
          ),
          em: ({ children }) => (
            <Text as="em" fontStyle="italic" color="gray.700">
              {children}
            </Text>
          ),

          // Collapsible sections z animacjami
          details: ({ children }) => (
            <chakra.details
              border="1px solid"
              borderColor="gray.200"
              borderRadius="lg"
              mb={4}
              p={0}
              overflow="hidden"
              boxShadow="sm"
              transition="all 0.2s"
              _hover={{ boxShadow: "md" }}
            >
              {children}
            </chakra.details>
          ),
          summary: ({ children }) => (
            <chakra.summary
              py={4}
              px={6}
              cursor="pointer"
              fontWeight="600"
              bg="gray.50"
              _hover={{ bg: "gray.100" }}
              transition="background-color 0.2s"
              css={{
                "&::-webkit-details-marker": {
                  display: "none",
                },
              }}
            >
              <HStack justify="space-between">
                <Text flex="1" textAlign="left">
                  {children}
                </Text>
                <chakra.span
                  fontSize="18px"
                  transition="transform 0.3s ease"
                  css={{
                    "details[open] &": {
                      transform: "rotate(90deg)",
                    },
                  }}
                >
                  ▶
                </chakra.span>
              </HStack>
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

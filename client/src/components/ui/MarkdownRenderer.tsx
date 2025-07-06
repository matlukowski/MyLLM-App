import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import { Box, Code, Text, Heading } from "@chakra-ui/react";
import "highlight.js/styles/github.css";

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
    <Box
      fontSize={fontSize}
      lineHeight={lineHeight}
      color={color}
      css={{
        // Stylowanie dla różnych elementów Markdown
        "& p": {
          marginBottom: "0.75rem",
          "&:last-child": {
            marginBottom: 0,
          },
        },
        "& h1, & h2, & h3, & h4, & h5, & h6": {
          fontWeight: "600",
          marginTop: "1rem",
          marginBottom: "0.5rem",
          "&:first-child": {
            marginTop: 0,
          },
        },
        "& h1": {
          fontSize: "1.25rem",
        },
        "& h2": {
          fontSize: "1.125rem",
        },
        "& h3": {
          fontSize: "1rem",
        },
        "& ul, & ol": {
          paddingLeft: "1.5rem",
          marginBottom: "0.75rem",
        },
        "& li": {
          marginBottom: "0.25rem",
        },
        "& blockquote": {
          borderLeft: "4px solid #e2e8f0",
          paddingLeft: "1rem",
          marginLeft: "0",
          marginRight: "0",
          marginBottom: "0.75rem",
          fontStyle: "italic",
          color: "#718096",
        },
        "& code": {
          backgroundColor: "#f7fafc",
          padding: "0.125rem 0.25rem",
          borderRadius: "0.25rem",
          fontSize: "0.875em",
          fontFamily: "monospace",
          color: "#e53e3e",
        },
        "& pre": {
          backgroundColor: "#f7fafc",
          padding: "1rem",
          borderRadius: "0.5rem",
          overflow: "auto",
          marginBottom: "0.75rem",
          border: "1px solid #e2e8f0",
        },
        "& pre code": {
          backgroundColor: "transparent",
          padding: 0,
          color: "inherit",
          fontSize: "0.875rem",
        },
        "& table": {
          width: "100%",
          borderCollapse: "collapse",
          marginBottom: "0.75rem",
        },
        "& th, & td": {
          border: "1px solid #e2e8f0",
          padding: "0.5rem",
          textAlign: "left",
        },
        "& th": {
          backgroundColor: "#f7fafc",
          fontWeight: "600",
        },
        "& a": {
          color: "#3182ce",
          textDecoration: "underline",
          "&:hover": {
            color: "#2c5282",
          },
        },
        "& strong": {
          fontWeight: "600",
        },
        "& em": {
          fontStyle: "italic",
        },
        "& hr": {
          border: "none",
          borderTop: "1px solid #e2e8f0",
          margin: "1rem 0",
        },
      }}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight]}
        components={{
          // Niestandardowe komponenty dla lepszego stylowania
          p: ({ children }) => (
            <Text as="p" whiteSpace="pre-wrap" wordBreak="break-word">
              {children}
            </Text>
          ),
          code: ({ children, className, ...props }) => {
            const match = /language-(\w+)/.exec(className || "");
            const isInline = !match;

            if (isInline) {
              return (
                <Code
                  colorScheme="red"
                  fontSize="0.875em"
                  px={1}
                  py={0.5}
                  borderRadius="sm"
                  {...props}
                >
                  {children}
                </Code>
              );
            }
            return (
              <Box
                as="pre"
                bg="gray.50"
                p={4}
                borderRadius="md"
                overflow="auto"
                border="1px solid"
                borderColor="gray.200"
                fontSize="sm"
                fontFamily="monospace"
                {...props}
              >
                <code className={className}>{children}</code>
              </Box>
            );
          },
          h1: ({ children }) => (
            <Heading as="h1" size="lg" mt={4} mb={2}>
              {children}
            </Heading>
          ),
          h2: ({ children }) => (
            <Heading as="h2" size="md" mt={4} mb={2}>
              {children}
            </Heading>
          ),
          h3: ({ children }) => (
            <Heading as="h3" size="sm" mt={3} mb={2}>
              {children}
            </Heading>
          ),
          ul: ({ children }) => (
            <Box as="ul" pl={6} mb={3}>
              {children}
            </Box>
          ),
          ol: ({ children }) => (
            <Box as="ol" pl={6} mb={3}>
              {children}
            </Box>
          ),
          li: ({ children }) => (
            <Box as="li" mb={1}>
              {children}
            </Box>
          ),
          blockquote: ({ children }) => (
            <Box
              borderLeft="4px solid"
              borderColor="gray.300"
              pl={4}
              py={2}
              mb={3}
              fontStyle="italic"
              color="gray.600"
            >
              {children}
            </Box>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </Box>
  );
};

export default MarkdownRenderer;

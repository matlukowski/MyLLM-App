import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import App from "./App.tsx";
import "./index.css";
import { ColorModeProvider } from "@/components/ui/color-mode";
import { HashRouter } from "react-router-dom";

function initializeApp() {
  const rootElement = document.getElementById("root");
  if (!rootElement) {
    throw new Error("Root element not found");
  }

  createRoot(rootElement).render(
    <StrictMode>
      <HashRouter>
        <ChakraProvider value={defaultSystem}>
          <ColorModeProvider>
            <App />
          </ColorModeProvider>
        </ChakraProvider>
      </HashRouter>
    </StrictMode>
  );
}

// Wait for DOM to be ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

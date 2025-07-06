import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { Box, Spinner, Flex } from "@chakra-ui/react";
import { useState } from "react";
import AuthPage from "./components/pages/AuthPage/AuthPage";
import ChatPage from "./components/chatpage/ChatPage";
import ApiKeysModal from "./components/ui/ApiKeysModal";
import { AuthProvider, useAuth } from "./contexts/AuthContext";

// Komponent do ochrony tras
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg="gray.50">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return user ? <>{children}</> : <Navigate to="/auth" replace />;
};

// Komponent dla tras publicznych (gdy użytkownik jest już zalogowany)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Flex justify="center" align="center" h="100vh" bg="gray.50">
        <Spinner size="xl" color="blue.500" />
      </Flex>
    );
  }

  return user ? <Navigate to="/chat" replace /> : <>{children}</>;
};

function AppContent() {
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  const handleApiKeysOpen = () => {
    setIsApiKeysModalOpen(true);
  };

  const handleApiKeysClose = () => {
    setIsApiKeysModalOpen(false);
  };

  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <AuthPage />
            </PublicRoute>
          }
        />
        <Route
          path="/chat"
          element={
            <ProtectedRoute>
              <ChatPage onApiKeysOpen={handleApiKeysOpen} />
            </ProtectedRoute>
          }
        />
      </Routes>

      {/* Modal kluczy API */}
      <ApiKeysModal isOpen={isApiKeysModalOpen} onClose={handleApiKeysClose} />
    </>
  );
}

function App() {
  return (
    <ChakraProvider value={defaultSystem}>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
      <ToastContainer
        position="top-center"
        autoClose={2000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="dark"
      />
    </ChakraProvider>
  );
}

export default App;

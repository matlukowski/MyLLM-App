import { ChakraProvider, defaultSystem } from "@chakra-ui/react";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { Routes, Route, Navigate } from "react-router-dom";
import { useState } from "react";
import ChatPage from "./components/chatpage/ChatPage";
import ApiKeysModal from "./components/ui/ApiKeysModal";

function App() {
  const [isApiKeysModalOpen, setIsApiKeysModalOpen] = useState(false);

  const handleApiKeysOpen = () => {
    setIsApiKeysModalOpen(true);
  };

  const handleApiKeysClose = () => {
    setIsApiKeysModalOpen(false);
  };

  return (
    <ChakraProvider value={defaultSystem}>
      <Routes>
        <Route path="/" element={<Navigate to="/chat" replace />} />
        <Route
          path="/chat"
          element={<ChatPage onApiKeysOpen={handleApiKeysOpen} />}
        />
        <Route path="*" element={<Navigate to="/chat" replace />} />
      </Routes>

      {/* Modal kluczy API */}
      <ApiKeysModal isOpen={isApiKeysModalOpen} onClose={handleApiKeysClose} />
      
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

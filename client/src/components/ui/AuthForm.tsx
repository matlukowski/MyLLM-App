import {
  Box,
  VStack,
  Input,
  Button,
  Flex,
  Text,
  Heading,
  Icon,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineLockClosed,
} from "react-icons/hi2";
import { toast } from "react-toastify";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [inputs, setInputs] = useState({
    username: "",
    password: "",
    confirmPassword: "",
  });

  const handleAuth = async () => {
    if (isLogin) {
      // Logowanie
      if (!inputs.username || !inputs.password) {
        toast.error("Proszę wypełnić wszystkie pola");
        return;
      }

      setIsLoading(true);
      const success = await login(inputs.username, inputs.password);
      setIsLoading(false);

      if (success) {
        toast.success("Pomyślnie zalogowano");
        navigate("/chat");
      } else {
        toast.error("Nieprawidłowa nazwa użytkownika lub hasło");
      }
    } else {
      // Rejestracja - walidacja
      if (!inputs.username || !inputs.password || !inputs.confirmPassword) {
        toast.error("Proszę wypełnić wszystkie pola");
        return;
      }

      if (inputs.password !== inputs.confirmPassword) {
        toast.error("Hasła nie są identyczne");
        return;
      }

      toast.info("Rejestracja nie jest jeszcze zaimplementowana");
    }
  };

  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bgGradient="linear(135deg, gray.900 0%, black 50%, gray.800 100%)"
      position="relative"
      overflow="hidden"
    >
      {/* Animated background elements */}
      <Box
        position="absolute"
        top="10%"
        left="10%"
        w="300px"
        h="300px"
        borderRadius="full"
        bgGradient="radial(circle, purple.600 0%, transparent 70%)"
        opacity={0.15}
        filter="blur(60px)"
        animation="float 6s ease-in-out infinite"
      />
      <Box
        position="absolute"
        bottom="10%"
        right="15%"
        w="400px"
        h="400px"
        borderRadius="full"
        bgGradient="radial(circle, blue.500 0%, transparent 70%)"
        opacity={0.1}
        filter="blur(80px)"
        animation="float 8s ease-in-out infinite reverse"
      />

      <style>
        {`
          @keyframes float {
            0%, 100% { transform: translateY(0px) translateX(0px); }
            33% { transform: translateY(-20px) translateX(10px); }
            66% { transform: translateY(10px) translateX(-10px); }
          }
        `}
      </style>

      <Box maxW="440px" w="full" mx={4} position="relative">
        {/* Glassmorphism container */}
        <Box
          bg="rgba(255, 255, 255, 0.05)"
          backdropFilter="blur(20px)"
          borderRadius="24px"
          border="1px solid"
          borderColor="rgba(255, 255, 255, 0.1)"
          p={10}
          boxShadow="0 25px 50px -12px rgba(0, 0, 0, 0.8)"
          transition="all 0.3s ease"
          _hover={{
            transform: "translateY(-2px)",
            boxShadow: "0 32px 64px -12px rgba(0, 0, 0, 0.9)",
          }}
        >
          <VStack gap={8}>
            {/* Logo and header */}
            <VStack gap={4}>
              <Flex
                align="center"
                justify="center"
                w={20}
                h={20}
                bgGradient="linear(135deg, purple.500, blue.500, purple.600)"
                borderRadius="20px"
                boxShadow="0 8px 32px rgba(147, 51, 234, 0.3)"
                position="relative"
                overflow="hidden"
                _before={{
                  content: '""',
                  position: "absolute",
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  bgGradient:
                    "linear(45deg, transparent, rgba(255,255,255,0.1), transparent)",
                  animation: "shimmer 2s infinite",
                }}
              >
                <Icon
                  as={HiOutlineSparkles}
                  boxSize={10}
                  color="white"
                  zIndex={1}
                />
              </Flex>

              <VStack gap={2}>
                <Heading
                  size="xl"
                  bgGradient="linear(to-r, white, gray.300)"
                  bgClip="text"
                  textAlign="center"
                  fontWeight="700"
                  letterSpacing="-0.02em"
                >
                  Chat AI
                </Heading>
                <Text
                  color="rgba(255, 255, 255, 0.7)"
                  textAlign="center"
                  fontSize="md"
                  fontWeight="400"
                >
                  {isLogin
                    ? "Witaj ponownie"
                    : "Dołącz do przyszłości konwersacji"}
                </Text>
              </VStack>
            </VStack>

            {/* Form */}
            <VStack gap={6} w="full">
              <Box w="full">
                <Text
                  color="rgba(255, 255, 255, 0.8)"
                  fontSize="sm"
                  fontWeight="600"
                  mb={3}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Icon as={HiOutlineUser} boxSize={4} />
                  Nazwa użytkownika
                </Text>
                <Input
                  type="text"
                  size="lg"
                  h="56px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="16px"
                  color="white"
                  fontSize="16px"
                  _placeholder={{
                    color: "rgba(255, 255, 255, 0.4)",
                    fontSize: "16px",
                  }}
                  _hover={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    bg: "rgba(255, 255, 255, 0.08)",
                  }}
                  _focus={{
                    borderColor: "purple.400",
                    boxShadow: "0 0 0 3px rgba(147, 51, 234, 0.1)",
                    bg: "rgba(255, 255, 255, 0.08)",
                  }}
                  transition="all 0.2s ease"
                  value={inputs.username}
                  onChange={(e) =>
                    setInputs({ ...inputs, username: e.target.value })
                  }
                  placeholder="Wpisz swoją nazwę użytkownika"
                />
              </Box>

              <Box w="full">
                <Text
                  color="rgba(255, 255, 255, 0.8)"
                  fontSize="sm"
                  fontWeight="600"
                  mb={3}
                  display="flex"
                  alignItems="center"
                  gap={2}
                >
                  <Icon as={HiOutlineLockClosed} boxSize={4} />
                  Hasło
                </Text>
                <Input
                  type="password"
                  size="lg"
                  h="56px"
                  bg="rgba(255, 255, 255, 0.05)"
                  border="1px solid"
                  borderColor="rgba(255, 255, 255, 0.1)"
                  borderRadius="16px"
                  color="white"
                  fontSize="16px"
                  _placeholder={{
                    color: "rgba(255, 255, 255, 0.4)",
                    fontSize: "16px",
                  }}
                  _hover={{
                    borderColor: "rgba(255, 255, 255, 0.2)",
                    bg: "rgba(255, 255, 255, 0.08)",
                  }}
                  _focus={{
                    borderColor: "purple.400",
                    boxShadow: "0 0 0 3px rgba(147, 51, 234, 0.1)",
                    bg: "rgba(255, 255, 255, 0.08)",
                  }}
                  transition="all 0.2s ease"
                  value={inputs.password}
                  onChange={(e) =>
                    setInputs({ ...inputs, password: e.target.value })
                  }
                  placeholder="Wpisz swoje hasło"
                />
              </Box>

              {!isLogin && (
                <Box w="full">
                  <Text
                    color="rgba(255, 255, 255, 0.8)"
                    fontSize="sm"
                    fontWeight="600"
                    mb={3}
                    display="flex"
                    alignItems="center"
                    gap={2}
                  >
                    <Icon as={HiOutlineLockClosed} boxSize={4} />
                    Potwierdź hasło
                  </Text>
                  <Input
                    type="password"
                    size="lg"
                    h="56px"
                    bg="rgba(255, 255, 255, 0.05)"
                    border="1px solid"
                    borderColor="rgba(255, 255, 255, 0.1)"
                    borderRadius="16px"
                    color="white"
                    fontSize="16px"
                    _placeholder={{
                      color: "rgba(255, 255, 255, 0.4)",
                      fontSize: "16px",
                    }}
                    _hover={{
                      borderColor: "rgba(255, 255, 255, 0.2)",
                      bg: "rgba(255, 255, 255, 0.08)",
                    }}
                    _focus={{
                      borderColor: "purple.400",
                      boxShadow: "0 0 0 3px rgba(147, 51, 234, 0.1)",
                      bg: "rgba(255, 255, 255, 0.08)",
                    }}
                    transition="all 0.2s ease"
                    value={inputs.confirmPassword}
                    onChange={(e) =>
                      setInputs({ ...inputs, confirmPassword: e.target.value })
                    }
                    placeholder="Potwierdź swoje hasło"
                  />
                </Box>
              )}

              <Button
                w="full"
                h="56px"
                fontSize="16px"
                fontWeight="600"
                bgGradient="linear(135deg, purple.500, blue.500)"
                color="white"
                borderRadius="16px"
                border="none"
                onClick={handleAuth}
                loading={isLoading}
                loadingText={isLogin ? "Logowanie..." : "Rejestracja..."}
                _hover={{
                  bgGradient: "linear(135deg, purple.600, blue.600)",
                  transform: "translateY(-1px)",
                  boxShadow: "0 12px 24px rgba(147, 51, 234, 0.3)",
                }}
                _active={{
                  transform: "translateY(0px)",
                }}
                transition="all 0.2s ease"
                boxShadow="0 8px 16px rgba(147, 51, 234, 0.2)"
              >
                {isLogin ? "Zaloguj się" : "Utwórz konto"}
              </Button>
            </VStack>

            {/* Toggle between login/register */}
            <Box
              textAlign="center"
              pt={2}
              borderTop="1px solid"
              borderColor="rgba(255, 255, 255, 0.1)"
              w="full"
            >
              <Text color="rgba(255, 255, 255, 0.6)" fontSize="sm" mb={3}>
                {isLogin ? "Nie masz jeszcze konta?" : "Masz już konto?"}
              </Text>
              <Button
                variant="ghost"
                size="sm"
                color="purple.300"
                fontWeight="600"
                onClick={() => setIsLogin(!isLogin)}
                _hover={{
                  color: "purple.200",
                  bg: "rgba(147, 51, 234, 0.1)",
                }}
                borderRadius="12px"
                transition="all 0.2s ease"
              >
                {isLogin ? "Zarejestruj się" : "Zaloguj się"}
              </Button>
            </Box>
          </VStack>
        </Box>
      </Box>

      <style>
        {`
          @keyframes shimmer {
            0% { transform: translateX(-100%); }
            100% { transform: translateX(100%); }
          }
        `}
      </style>
    </Flex>
  );
};

export default AuthForm;

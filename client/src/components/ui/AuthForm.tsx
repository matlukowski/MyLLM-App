import {
  Box,
  VStack,
  Input,
  Button,
  Flex,
  Text,
  Heading,
  Icon,
  HStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import {
  HiOutlineSparkles,
  HiOutlineUser,
  HiOutlineLockClosed,
  HiOutlineChatBubbleLeftEllipsis,
} from "react-icons/hi2";
import { toast } from "react-toastify";

const AuthForm = () => {
  const [isLogin, setIsLogin] = useState(true);
  const navigate = useNavigate();
  const { login, register } = useAuth();
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

      if (inputs.password.length < 6) {
        toast.error("Hasło musi mieć co najmniej 6 znaków");
        return;
      }

      setIsLoading(true);
      const result = await register(inputs.username, inputs.password);
      setIsLoading(false);

      if (result.success) {
        toast.success("Konto zostało utworzone pomyślnie!");
        navigate("/chat");
      } else {
        toast.error(result.error || "Wystąpił błąd podczas rejestracji");
      }
    }
  };

  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" p={4}>
      <Box maxW="400px" w="full">
        <VStack gap={8}>
          {/* Logo i nagłówek */}
          <VStack gap={4} textAlign="center">
            <Flex
              align="center"
              justify="center"
              w={16}
              h={16}
              bg="blue.500"
              borderRadius="full"
              boxShadow="lg"
            >
              <Icon
                as={HiOutlineChatBubbleLeftEllipsis}
                boxSize={8}
                color="white"
              />
            </Flex>

            <VStack gap={2}>
              <Heading size="xl" color="gray.800" fontWeight="700">
                Chat AI
              </Heading>
              <Text color="gray.600" fontSize="lg">
                {isLogin ? "Witaj ponownie" : "Utwórz nowe konto"}
              </Text>
            </VStack>
          </VStack>

          {/* Formularz */}
          <Box
            w="full"
            bg="white"
            borderRadius="16px"
            boxShadow="xl"
            border="1px solid"
            borderColor="gray.200"
            p={8}
          >
            <VStack gap={6}>
              {/* Przełącznik Login/Register */}
              <HStack w="full" bg="gray.100" borderRadius="12px" p={1} gap={0}>
                <Button
                  flex={1}
                  size="md"
                  bg={isLogin ? "white" : "transparent"}
                  color={isLogin ? "gray.800" : "gray.600"}
                  border="none"
                  borderRadius="8px"
                  boxShadow={isLogin ? "sm" : "none"}
                  fontWeight={isLogin ? "600" : "500"}
                  onClick={() => setIsLogin(true)}
                  _hover={{
                    bg: isLogin ? "white" : "gray.200",
                  }}
                  transition="all 0.2s ease"
                >
                  Logowanie
                </Button>
                <Button
                  flex={1}
                  size="md"
                  bg={!isLogin ? "white" : "transparent"}
                  color={!isLogin ? "gray.800" : "gray.600"}
                  border="none"
                  borderRadius="8px"
                  boxShadow={!isLogin ? "sm" : "none"}
                  fontWeight={!isLogin ? "600" : "500"}
                  onClick={() => setIsLogin(false)}
                  _hover={{
                    bg: !isLogin ? "white" : "gray.200",
                  }}
                  transition="all 0.2s ease"
                >
                  Rejestracja
                </Button>
              </HStack>

              {/* Pola formularza */}
              <VStack gap={4} w="full">
                <Box w="full">
                  <Text color="gray.700" fontSize="sm" fontWeight="600" mb={2}>
                    Nazwa użytkownika
                  </Text>
                  <Input
                    type="text"
                    size="lg"
                    bg="white"
                    border="2px solid"
                    borderColor="gray.200"
                    borderRadius="12px"
                    color="gray.800"
                    fontSize="16px"
                    _placeholder={{
                      color: "gray.500",
                    }}
                    _hover={{
                      borderColor: "gray.300",
                    }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
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
                  <Text color="gray.700" fontSize="sm" fontWeight="600" mb={2}>
                    Hasło
                  </Text>
                  <Input
                    type="password"
                    size="lg"
                    bg="white"
                    border="2px solid"
                    borderColor="gray.200"
                    borderRadius="12px"
                    color="gray.800"
                    fontSize="16px"
                    _placeholder={{
                      color: "gray.500",
                    }}
                    _hover={{
                      borderColor: "gray.300",
                    }}
                    _focus={{
                      borderColor: "blue.500",
                      boxShadow: "0 0 0 1px #3182ce",
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
                      color="gray.700"
                      fontSize="sm"
                      fontWeight="600"
                      mb={2}
                    >
                      Potwierdź hasło
                    </Text>
                    <Input
                      type="password"
                      size="lg"
                      bg="white"
                      border="2px solid"
                      borderColor="gray.200"
                      borderRadius="12px"
                      color="gray.800"
                      fontSize="16px"
                      _placeholder={{
                        color: "gray.500",
                      }}
                      _hover={{
                        borderColor: "gray.300",
                      }}
                      _focus={{
                        borderColor: "blue.500",
                        boxShadow: "0 0 0 1px #3182ce",
                      }}
                      transition="all 0.2s ease"
                      value={inputs.confirmPassword}
                      onChange={(e) =>
                        setInputs({
                          ...inputs,
                          confirmPassword: e.target.value,
                        })
                      }
                      placeholder="Potwierdź swoje hasło"
                    />
                  </Box>
                )}
              </VStack>

              {/* Przycisk submit */}
              <Button
                w="full"
                size="lg"
                bg="blue.500"
                color="white"
                borderRadius="12px"
                fontWeight="600"
                onClick={handleAuth}
                loading={isLoading}
                loadingText={isLogin ? "Logowanie..." : "Rejestracja..."}
                _hover={{
                  bg: "blue.600",
                  transform: "translateY(-1px)",
                  boxShadow: "lg",
                }}
                _active={{
                  transform: "translateY(0px)",
                }}
                transition="all 0.2s ease"
                boxShadow="md"
              >
                {isLogin ? "Zaloguj się" : "Utwórz konto"}
              </Button>
            </VStack>
          </Box>

          {/* Dodatkowe informacje */}
          <Box
            textAlign="center"
            p={4}
            bg="blue.50"
            borderRadius="12px"
            border="1px solid"
            borderColor="blue.200"
            w="full"
          >
            <Text fontSize="sm" color="blue.700" fontWeight="500">
              💡 Każdy asystent AI ma unikalną osobowość i specjalizację
            </Text>
          </Box>
        </VStack>
      </Box>
    </Flex>
  );
};

export default AuthForm;

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Sprawdź czy użytkownik jest już zalogowany (z localStorage)
  useEffect(() => {
    const savedUser = localStorage.getItem("currentUser");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Błąd podczas parsowania danych użytkownika:", error);
        localStorage.removeItem("currentUser");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (
    username: string,
    password: string
  ): Promise<boolean> => {
    try {
      console.log("🔐 Frontend: Próba logowania", { username, password });

      // Dla uproszczenia - sprawdzamy czy użytkownik istnieje w bazie
      // W prawdziwej aplikacji tutaj byłaby weryfikacja hasła
      const response = await fetch(`http://localhost:3001/api/users/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      console.log("📡 Frontend: Odpowiedź serwera", {
        status: response.status,
        statusText: response.statusText,
      });

      if (response.ok) {
        const userData = await response.json();
        console.log("✅ Frontend: Logowanie udane", userData);
        setUser(userData);
        localStorage.setItem("currentUser", JSON.stringify(userData));
        return true;
      } else {
        const errorData = await response.json();
        console.log("❌ Frontend: Błąd logowania", errorData);
        return false;
      }
    } catch (error) {
      console.error("💥 Frontend: Błąd podczas logowania:", error);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("currentUser");
  };

  const value = {
    user,
    login,
    logout,
    isLoading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

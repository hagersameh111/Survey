import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { getCurrentUser } from "../api/auth";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(Boolean(localStorage.getItem("token")));
  const requestId = useRef(0);

  const refreshUser = useCallback(async () => {
    const token = localStorage.getItem("token");
    const currentRequest = ++requestId.current;
    if (!token) {
      setUser(null);
      setIsLoading(false);
      return null;
    }

    setIsLoading(true);
    try {
      const currentUser = await getCurrentUser();
      if (currentRequest === requestId.current) setUser(currentUser);
      return currentUser;
    } catch (error) {
      if (currentRequest === requestId.current) {
        localStorage.removeItem("token");
        setUser(null);
      }
      throw error;
    } finally {
      if (currentRequest === requestId.current) setIsLoading(false);
    }
  }, []);

  const authenticate = useCallback((token, authenticatedUser) => {
    requestId.current += 1;
    localStorage.setItem("token", token);
    setUser(authenticatedUser);
    setIsLoading(false);
  }, []);

  const logout = useCallback(() => {
    requestId.current += 1;
    localStorage.removeItem("token");
    setUser(null);
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!localStorage.getItem("token")) return undefined;
    const timer = window.setTimeout(() => refreshUser().catch(() => {}), 0);
    return () => window.clearTimeout(timer);
  }, [refreshUser]);

  return (
    <AuthContext.Provider value={{ user, isLoading, refreshUser, authenticate, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
};

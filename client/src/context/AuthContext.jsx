import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import api from "../utils/axios";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);

  const checkAuth = useCallback(async () => {
    try {
      const { data } = await api.get("/api/auth/check");

      if (data.success && data.user?.role === "admin") {
        setAdmin(data.user);
      } else {
        setAdmin(null);
      }
    } catch {
      setAdmin(null);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  const login = async ({ email, password }) => {
    const { data } = await api.post("/api/auth/login", {
      email,
      password,
    });

    if (!data.success) {
      throw new Error(data.message || "Login failed.");
    }

    setAdmin(data.user);

    return data;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } finally {
      setAdmin(null);
    }
  };

  const value = useMemo(
    () => ({
      admin,
      setAdmin,
      authLoading,
      isAuthenticated: Boolean(admin),
      login,
      logout,
      checkAuth,
    }),
    [admin, authLoading, checkAuth]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider.");
  }

  return context;
};
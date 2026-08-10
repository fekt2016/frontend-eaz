"use client";

import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data?.user || null);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchMe(); }, [fetchMe]);

  const login = async (email, password) => {
    try {
      const res = await api.post("/auth/login", { email, password });
      // 2FA required — don't set user yet
      if (res.data?.requiresTwoFactor) return res;
      setUser(res.data?.user || null);
      return res;
    } catch (err) {
      // Attach requiresVerification flag so login page can redirect
      if (err.message?.toLowerCase().includes('verify')) {
        const error = new Error(err.message);
        error.requiresVerification = true;
        throw error;
      }
      throw err;
    }
  };

  const register = async (name, email, phone, password) => {
    const res = await api.post("/auth/register", { name, email, phone, password });
    // Don't set user yet — account needs verification first
    return res.data;
  };

  const logout = async () => {
    await api.post("/auth/logout", {}).catch(() => {});
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, setUser, loading, login, register, logout, refetch: fetchMe }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { loginAdminApi } from '../services/auth.api';

type AdminUser = {
  id: string;
  name: string;
  email: string;
};

type AuthContextType = {
  token: string | null;
  admin: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [token, setToken] = useState<string | null>(null);
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const login = async (email: string, password: string) => {
    const res = await loginAdminApi(email, password);
    setToken(res.data.data.token);
    setAdmin(res.data.data.user);
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
  };

  return <AuthContext.Provider value={{ token, admin, login, logout }}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
};


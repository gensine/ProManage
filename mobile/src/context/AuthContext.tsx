import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { tokenStorage } from '../storage/tokenStorage';
import { apiClient, setOnUnauthorizedCallback } from '../api/client';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  register: (fullName: string, email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    // Register 401 interceptor callback to wipe token on expiration
    setOnUnauthorizedCallback(async () => {
      setUser(null);
      setToken(null);
      await tokenStorage.deleteToken().catch(() => {});
    });

    const initAuth = async () => {
      try {
        const savedToken = await tokenStorage.getToken();
        const savedUser = await tokenStorage.getUser();
        if (savedToken && savedUser) {
          setToken(savedToken);
          setUser(savedUser);
          // Async background verification with timeout
          apiClient.get('/auth/me', { timeout: 3000 })
            .then((res) => {
              if (res.data?.user) {
                setUser(res.data.user);
                tokenStorage.saveUser(res.data.user).catch(() => {});
              }
            })
            .catch(() => {
              // Token invalid
              setUser(null);
              setToken(null);
              tokenStorage.deleteToken().catch(() => {});
            });
        }
      } catch (e) {
        console.warn('initAuth error:', e);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiClient.post('/auth/login', { email, password });
    const { user: userData, token: jwtToken } = res.data;
    setUser(userData);
    setToken(jwtToken);
    await tokenStorage.saveToken(jwtToken);
    await tokenStorage.saveUser(userData);
  };

  const register = async (fullName: string, email: string, password: string) => {
    const res = await apiClient.post('/auth/register', { fullName, email, password });
    const { user: userData, token: jwtToken } = res.data;
    setUser(userData);
    setToken(jwtToken);
    await tokenStorage.saveToken(jwtToken);
    await tokenStorage.saveUser(userData);
  };

  const logout = async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch {}
    setUser(null);
    setToken(null);
    await tokenStorage.deleteToken().catch(() => {});
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

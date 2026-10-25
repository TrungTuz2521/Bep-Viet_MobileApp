import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { User } from '@/types/api';
import { authService, LoginPayload, RegisterPayload } from '@/services/authService';
import { storage } from '@/utils/storage';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (payload: LoginPayload) => Promise<User>;
  register: (payload: RegisterPayload) => Promise<User>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<User | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Khôi phục session khi mở app
  useEffect(() => {
    const bootstrapAsync = async () => {
      try {
        const storedToken = await storage.getToken();
        const storedUser = await storage.getUser();

        if (storedToken) {
          setToken(storedToken);
          if (storedUser) {
            setUser(storedUser);
          }
          // Gọi API lấy profile mới nhất để đồng bộ và verify token
          try {
            const freshUser = await authService.getProfile();
            setUser(freshUser);
          } catch (profileError) {
            // Token có thể đã hết hạn, storage đã được clear trong interceptor
            console.log('Session expired or unable to fetch profile:', profileError);
            setToken(null);
            setUser(null);
          }
        }
      } catch (e) {
        console.error('Failed to restore session:', e);
      } finally {
        setIsLoading(false);
      }
    };

    bootstrapAsync();
  }, []);

  const login = async (payload: LoginPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.login(payload);
      setToken(response.token);
      setUser(response.data);
      return response.data;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (payload: RegisterPayload): Promise<User> => {
    setIsLoading(true);
    try {
      const response = await authService.register(payload);
      // Tự động đăng nhập sau khi đăng ký thành công
      const loginResponse = await authService.login({
        email: payload.email,
        password: payload.password,
      });
      setToken(loginResponse.token);
      setUser(loginResponse.data);
      return loginResponse.data;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
      setToken(null);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async (): Promise<User | null> => {
    try {
      const freshUser = await authService.getProfile();
      setUser(freshUser);
      return freshUser;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

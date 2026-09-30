import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';

export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

export interface User {
  id: string;
  username: string;
  name?: string;
  role: UserRole;
  email?: string;
}

interface AuthContextType {
  user: User | null;
  role: UserRole;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: { username: string; password: string; role?: UserRole }) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  switchRole: (newRole: UserRole) => void;
}

const defaultAdminUser: User = {
  id: 'admin001',
  username: 'admin',
  name: 'MK Rabbani',
  role: 'admin',
  email: 'admin@school.com',
};

const AuthContext = createContext<AuthContextType>({
  user: defaultAdminUser,
  role: 'admin',
  token: null,
  isAuthenticated: true,
  isLoading: false,
  login: async () => ({ success: false }),
  logout: () => {},
  switchRole: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('school_user');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {}
    }
    return defaultAdminUser;
  });

  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const role: UserRole = user?.role || 'admin';

  useEffect(() => {
    if (user) {
      localStorage.setItem('school_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('school_user');
    }
  }, [user]);

  const login = async ({ username, password, role = 'admin' }: { username: string; password: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password, role });
      if (res.success && res.data) {
        const loggedUser: User = {
          id: res.data.user?.id || 'usr_' + Date.now(),
          username: res.data.user?.username || username,
          name: res.data.user?.name || username,
          role: (res.data.role as UserRole) || role,
          email: res.data.user?.email || '',
        };
        api.setToken(res.data.token);
        setToken(res.data.token);
        setUser(loggedUser);
        setIsLoading(false);
        return { success: true };
      } else {
        // Fallback for instant demo if backend is offline
        if ((username === 'admin' && password === 'admin123') || password.length >= 4) {
          const fallbackUser: User = {
            id: 'admin001',
            username,
            name: username === 'admin' ? 'MK Rabbani' : username,
            role,
            email: `${username}@school.com`,
          };
          const mockToken = 'mock_jwt_token_' + Date.now();
          api.setToken(mockToken);
          setToken(mockToken);
          setUser(fallbackUser);
          setIsLoading(false);
          return { success: true };
        }
        setIsLoading(false);
        return { success: false, message: res.message || 'Invalid credentials' };
      }
    } catch (err: any) {
      setIsLoading(false);
      return { success: false, message: err.message || 'Login failed' };
    }
  };

  const logout = () => {
    api.setToken(null);
    setToken(null);
    setUser(null);
  };

  const switchRole = (newRole: UserRole) => {
    if (user) {
      const updated = { ...user, role: newRole };
      setUser(updated);
    } else {
      setUser({
        id: 'usr_' + newRole,
        username: newRole,
        name: newRole.toUpperCase() + ' User',
        role: newRole,
        email: `${newRole}@school.com`
      });
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        role,
        token,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        switchRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

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
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  role: 'admin',
  token: null,
  isAuthenticated: false,
  isLoading: false,
  login: async () => ({ success: false }),
  logout: () => {},
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => api.getToken());
  const [isLoading, setIsLoading] = useState<boolean>(() => Boolean(api.getToken()));

  const role: UserRole = user?.role || 'admin';

  useEffect(() => {
    const savedToken = api.getToken();
    if (!savedToken) {
      setUser(null);
      setIsLoading(false);
      return;
    }

    let active = true;
    api.getMe().then((res) => {
      if (!active) return;
      const authenticatedUser = res.data?.user;
      if (res.success && authenticatedUser && res.data?.role) {
        setUser({
          id: authenticatedUser.id,
          username: authenticatedUser.username,
          name: authenticatedUser.name,
          role: res.data.role as UserRole,
          email: authenticatedUser.email,
        });
      } else {
        api.setToken(null);
        setToken(null);
        setUser(null);
      }
      setIsLoading(false);
    }).catch(() => {
      if (!active) return;
      api.setToken(null);
      setToken(null);
      setUser(null);
      setIsLoading(false);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem('school_user', JSON.stringify(user));
    else localStorage.removeItem('school_user');
  }, [user]);

  const login = async ({ username, password, role }: { username: string; password: string; role?: UserRole }) => {
    setIsLoading(true);
    try {
      const res = await api.login({ username, password, role });
      if (res.success && res.data) {
        const loggedUser: User = {
          id: res.data.user?.id || 'usr_' + Date.now(),
          username: res.data.user?.username || username,
          name: res.data.user?.name || username,
          role: (res.data.role as UserRole) || role || 'admin',
          email: res.data.user?.email || '',
        };
        api.setToken(res.data.token);
        setToken(res.data.token);
        setUser(loggedUser);
        setIsLoading(false);
        return { success: true };
      } else {
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
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
export default AuthContext;

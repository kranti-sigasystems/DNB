import { useState, useEffect, useCallback } from 'react';
import { 
  getStoredSession, 
  persistSession, 
  clearSession, 
  subscribeToSessionChanges,
  AuthSession,
  User
} from '@/utils/auth';

interface UseAuthReturn {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (session: any, options?: { remember?: boolean }) => void;
  logout: () => void;
  updateUser: (updater: User | ((prevUser: User) => User)) => void;
}

export default function useAuth(): UseAuthReturn {
  const [session, setSession] = useState<AuthSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const storedSession = getStoredSession();
    setSession(storedSession);
    setIsLoading(false);
  }, []);

  // Subscribe to session changes
  useEffect(() => {
    const unsubscribe = subscribeToSessionChanges((newSession) => {
      setSession(newSession);
    });

    return unsubscribe;
  }, []);

  const login = useCallback((sessionData: any, options: { remember?: boolean } = {}) => {
    const newSession = persistSession(sessionData, options);
    setSession(newSession);
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setSession(null);
  }, []);

  const updateUser = useCallback((updater: User | ((prevUser: User) => User)) => {
    if (!session?.user) return;

    const nextUser = typeof updater === 'function' ? updater(session.user) : updater;
    
    const nextSession: AuthSession = {
      ...session,
      user: nextUser,
    };

    persistSession(nextSession, { remember: session.remember });
    setSession(nextSession);
  }, [session]);

  return {
    user: session?.user || null,
    isAuthenticated: !!session?.user,
    isLoading,
    login,
    logout,
    updateUser,
  };
}
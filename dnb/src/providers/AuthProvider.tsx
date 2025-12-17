import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import {
  clearSession,
  getStoredSession,
  persistSession,
  subscribeToSessionChanges,
} from '@/utils/auth';

/* ----------------------------- Types ----------------------------- */

export interface User {
  [key: string]: unknown;
}

export interface AuthSession {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  remember: boolean;
}

interface SetSessionOptions {
  remember?: boolean;
}

interface AuthContextValue {
  user: User | null;
  accessToken: string | null;
  refreshToken: string | null;
  remember: boolean;
  isAuthenticated: boolean;
  loading: boolean;
  login: (session: AuthSession, options?: SetSessionOptions) => void;
  logout: () => void;
  setSession: (session: AuthSession | null, options?: SetSessionOptions) => void;
  updateUser: (updater: User | ((prevUser: User) => User)) => void;
}

interface AuthProviderProps {
  children: ReactNode;
}

/* --------------------------- Context ---------------------------- */

const AuthContext = createContext<AuthContextValue>({
  user: null,
  accessToken: null,
  refreshToken: null,
  remember: true,
  isAuthenticated: false,
  loading: true,
  login: () => {},
  logout: () => {},
  setSession: () => {},
  updateUser: () => {},
});

/* -------------------------- Provider ---------------------------- */

export function AuthProvider({ children }: AuthProviderProps) {
  const [session, setSessionState] = useState<AuthSession | null>(() => getStoredSession());
  const [initialised, setInitialised] = useState<boolean>(Boolean(session));
  const initializingRef = useRef<boolean>(false);

  /* ----------------------- Init Session ------------------------ */

  useEffect(() => {
    if (initialised || initializingRef.current) return;

    initializingRef.current = true;
    const existing = getStoredSession();
    setSessionState(existing);
    setInitialised(true);
  }, [initialised]);

  /* ------------------ Cross-tab Sync --------------------------- */

  useEffect(() => {
    const unsubscribe = subscribeToSessionChanges((nextSession: AuthSession | null) => {
      setSessionState(nextSession);
    });

    return unsubscribe;
  }, []);

  /* ---------------------- Actions ------------------------------ */

  const setSession = useCallback(
    (nextSession: AuthSession | null, options: SetSessionOptions = {}) => {
      const persisted = persistSession(nextSession, options);
      setSessionState(persisted);
    },
    []
  );

  const login = useCallback(
    (nextSession: AuthSession, options: SetSessionOptions = {}) => {
      setSession(nextSession, options);
    },
    [setSession]
  );

  const logout = useCallback(() => {
    clearSession();
    setSessionState(null);
  }, []);

  const updateUser = useCallback((updater: User | ((prevUser: User) => User)) => {
    setSessionState((prev) => {
      if (!prev || !prev.user) return prev;

      const nextUser = typeof updater === 'function' ? updater(prev.user) : updater;

      if (!nextUser) return prev;

      const nextSession: AuthSession = {
        ...prev,
        user: nextUser,
      };

      persistSession(nextSession, { remember: prev.remember });
      return nextSession;
    });
  }, []);

  /* ---------------------- Memo Value --------------------------- */

  const value: AuthContextValue = useMemo(
    () => ({
      user: session?.user ?? null,
      accessToken: session?.accessToken ?? null,
      refreshToken: session?.refreshToken ?? null,
      remember: session?.remember ?? true,
      isAuthenticated: Boolean(session?.accessToken && session?.user),
      loading: !initialised,
      login,
      logout,
      setSession,
      updateUser,
    }),
    [session, initialised, login, logout, setSession, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/* ---------------------------- Hook ------------------------------ */

export const useAuthContext = (): AuthContextValue => {
  return useContext(AuthContext);
};

import Cookies from 'js-cookie';

/* ----------------------------- Constants ----------------------------- */

const AUTH_EVENT_KEY = 'dnb:auth:change';
const AUTH_STORAGE_KEY = 'dnb_auth_session';
const ACCESS_TOKEN_KEY = 'authToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user';

const isBrowser: boolean = typeof window !== 'undefined';

/* ------------------------------- Types ------------------------------- */

export interface User {
  [key: string]: unknown;
}

export interface AuthSession {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  remember: boolean;
  updatedAt: number;
}

interface PersistOptions {
  remember?: boolean;
}

type SessionUpdater = User | ((prevUser: User) => User);

/* ----------------------------- Helpers ------------------------------ */

const parseJSON = <T>(value: string | null, fallback: T | null = null): T | null => {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch (error) {
    console.error('Failed to parse JSON value:', error);
    return fallback;
  }
};

const normaliseSession = (
  session: Partial<AuthSession & { token?: string; tokenPayload?: any; data?: any }> | null = {}
): AuthSession | null => {
  if (!session) return null;

  const { accessToken = null, refreshToken = null, user = null, remember } = session;

  if (!accessToken || !user) {
    return null;
  }

  return {
    accessToken,
    refreshToken,
    user,
    remember: remember ?? true,
    updatedAt: Date.now(),
  };
};

const syncStorage = (storage: Storage | null, session: AuthSession | null): void => {
  if (!storage) return;

  if (!session) {
    storage.removeItem(AUTH_STORAGE_KEY);
    storage.removeItem(ACCESS_TOKEN_KEY);
    storage.removeItem(REFRESH_TOKEN_KEY);
    storage.removeItem(USER_KEY);
    return;
  }

  try {
    storage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));

    session.accessToken
      ? storage.setItem(ACCESS_TOKEN_KEY, session.accessToken)
      : storage.removeItem(ACCESS_TOKEN_KEY);

    session.refreshToken
      ? storage.setItem(REFRESH_TOKEN_KEY, session.refreshToken)
      : storage.removeItem(REFRESH_TOKEN_KEY);

    session.user
      ? storage.setItem(USER_KEY, JSON.stringify(session.user))
      : storage.removeItem(USER_KEY);
  } catch (error) {
    console.error('Failed to synchronise auth storage:', error);
  }
};

const emitSessionChange = (session: AuthSession | null): void => {
  if (!isBrowser) return;

  window.dispatchEvent(
    new CustomEvent<AuthSession | null>(AUTH_EVENT_KEY, {
      detail: session,
    })
  );
};

/* ------------------------------ API -------------------------------- */

export const getUserFromCookie = (): User | null => {
  const userCookie = Cookies.get('userInfo');
  if (!userCookie) return null;

  try {
    return JSON.parse(userCookie) as User;
  } catch (err) {
    console.error('Failed to parse user cookie:', err);
    return null;
  }
};

export const getStoredSession = (): AuthSession | null => {
  if (!isBrowser) return null;

  const sessionValue =
    sessionStorage.getItem(AUTH_STORAGE_KEY) || localStorage.getItem(AUTH_STORAGE_KEY);

  const parsed = parseJSON<AuthSession>(sessionValue);
  const normalised = normaliseSession(parsed);

  if (normalised && !sessionStorage.getItem(AUTH_STORAGE_KEY)) {
    syncStorage(sessionStorage, normalised);
  }

  return normalised;
};

export const getSession = (): User | null => {
  const session = getStoredSession();
  return session?.user ?? null;
};

export const getAccessToken = (): string | null => {
  const session = getStoredSession();
  return session?.accessToken ?? null;
};

export const getRefreshToken = (): string | null => {
  const session = getStoredSession();
  return session?.refreshToken ?? null;
};

export const persistSession = (session: any, options: PersistOptions = {}): AuthSession | null => {
  if (!isBrowser) return null;

  if (!session) {
    clearSession();
    return null;
  }

  const normalised = normaliseSession({
    accessToken: session.accessToken ?? session.token ?? session.tokenPayload?.accessToken ?? null,

    refreshToken: session.refreshToken ?? session?.data?.refreshToken ?? null,

    user: session.user ?? session.tokenPayload ?? session.data?.tokenPayload ?? null,

    remember:
      options.remember ??
      session.remember ??
      (session?.data?.remember !== undefined ? session.data.remember : undefined),
  });

  if (!normalised) {
    clearSession();
    return null;
  }

  syncStorage(sessionStorage, normalised);

  if (normalised.remember) {
    syncStorage(localStorage, normalised);
  } else {
    syncStorage(localStorage, null);
  }

  emitSessionChange(normalised);
  return normalised;
};

export const clearSession = (): void => {
  if (!isBrowser) return;

  syncStorage(sessionStorage, null);
  syncStorage(localStorage, null);
  emitSessionChange(null);
};

export const subscribeToSessionChanges = (
  callback: (session: AuthSession | null) => void
): (() => void) => {
  if (!isBrowser || typeof callback !== 'function') return () => {};

  const handleCustomEvent = (event: Event) => {
    const customEvent = event as CustomEvent<AuthSession | null>;
    callback(customEvent.detail ?? getStoredSession());
  };

  const handleStorageEvent = (event: StorageEvent) => {
    if (
      [AUTH_STORAGE_KEY, ACCESS_TOKEN_KEY, REFRESH_TOKEN_KEY, USER_KEY].includes(event.key ?? '')
    ) {
      callback(getStoredSession());
    }
  };

  window.addEventListener(AUTH_EVENT_KEY, handleCustomEvent);
  window.addEventListener('storage', handleStorageEvent);

  return () => {
    window.removeEventListener(AUTH_EVENT_KEY, handleCustomEvent);
    window.removeEventListener('storage', handleStorageEvent);
  };
};

export const updateStoredUser = (updater: SessionUpdater): User | null => {
  if (!isBrowser) return null;

  const current = getStoredSession();
  if (!current || !current.user) return null;

  const nextUser = typeof updater === 'function' ? updater(current.user) : updater;

  const nextSession: AuthSession = {
    ...current,
    user: nextUser,
  };

  persistSession(nextSession, { remember: current.remember });
  return nextUser;
};

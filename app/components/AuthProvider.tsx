'use client';

import {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useState,
} from 'react';

export type AuthUser = {
    id: string;
    name: string;
    email: string;
    role: string;
    plan: string;
    restaurantName: string;
    cloudSyncEnabled: boolean;
};

type AuthStatus = 'loading' | 'authenticated' | 'unauthenticated';

type LoginResult = {
    success: boolean;
    message?: string;
};

type AuthContextValue = {
    user: AuthUser | null;
    status: AuthStatus;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<LoginResult>;
    logout: () => Promise<void>;
    refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

async function fetchCurrentUser(): Promise<AuthUser | null> {
    try {
        const response = await fetch('/api/auth/me', {
            method: 'GET',
            cache: 'no-store',
        });

        if (!response.ok) {
            return null;
        }

        const data = await response.json();
        return data?.user || null;
    } catch {
        return null;
    }
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [status, setStatus] = useState<AuthStatus>('loading');

    const refresh = useCallback(async () => {
        setStatus('loading');
        const currentUser = await fetchCurrentUser();

        if (currentUser) {
            setUser(currentUser);
            setStatus('authenticated');
            return;
        }

        setUser(null);
        setStatus('unauthenticated');
    }, []);

    useEffect(() => {
        void refresh();
    }, [refresh]);

    const login = useCallback(async (email: string, password: string): Promise<LoginResult> => {
        try {
            const response = await fetch('/api/auth/login', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ email, password }),
            });

            const data = await response.json().catch(() => ({}));

            if (!response.ok) {
                setStatus('unauthenticated');
                return {
                    success: false,
                    message: data?.message || 'No se pudo iniciar sesión',
                };
            }

            if (data?.user) {
                setUser(data.user);
                setStatus('authenticated');
                return { success: true };
            }

            await refresh();
            return { success: true };
        } catch {
            setStatus('unauthenticated');
            return {
                success: false,
                message: 'Error de red al iniciar sesión',
            };
        }
    }, [refresh]);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/auth/logout', {
                method: 'POST',
            });
        } finally {
            setUser(null);
            setStatus('unauthenticated');
        }
    }, []);

    const value = useMemo<AuthContextValue>(() => ({
        user,
        status,
        isAuthenticated: status === 'authenticated' && Boolean(user),
        login,
        logout,
        refresh,
    }), [login, logout, refresh, status, user]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);

    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }

    return context;
}

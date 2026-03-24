import { useState, useEffect, useCallback } from "react";
import { authApi, type AuthUser } from "@/lib/api";

const TOKEN_KEY = 'portfolio_auth_token';
const USER_KEY = 'portfolio_auth_user';

export interface Session {
  user: AuthUser;
  token: string;
}

const getStoredAuth = (): { token: string | null; user: AuthUser | null } => {
  try {
    const token = localStorage.getItem(TOKEN_KEY);
    const userStr = localStorage.getItem(USER_KEY);
    const user = userStr ? JSON.parse(userStr) : null;
    return { token, user };
  } catch {
    return { token: null, user: null };
  }
};

const storeAuth = (token: string, user: AuthUser) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

const clearAuth = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  const verifyToken = useCallback(async (_token: string): Promise<AuthUser | null> => {
    try {
      return await authApi.getMe();
    } catch {
      return null;
    }
  }, []);

  useEffect(() => {
    const initAuth = async () => {
      const { token, user } = getStoredAuth();
      
      if (token && user) {
        const verifiedUser = await verifyToken(token);
        if (verifiedUser) {
          setSession({ user: verifiedUser, token });
        } else {
          clearAuth();
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [verifyToken]);

  const signIn = useCallback(async (email: string, password: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const response = await authApi.login(email, password);
      const user: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      };
      storeAuth(response.access_token, user);
      setSession({ user, token: response.access_token });
      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error instanceof Error ? error.message : "Login failed" };
    }
  }, []);

  const signUp = useCallback(async (email: string, password: string, name?: string): Promise<{ error: string | null }> => {
    setLoading(true);
    try {
      const response = await authApi.register(email, password, name);
      const user: AuthUser = {
        id: response.user.id,
        email: response.user.email,
        name: response.user.name,
      };
      storeAuth(response.access_token, user);
      setSession({ user, token: response.access_token });
      setLoading(false);
      return { error: null };
    } catch (error) {
      setLoading(false);
      return { error: error instanceof Error ? error.message : "Registration failed" };
    }
  }, []);

  const signOut = useCallback(async () => {
    clearAuth();
    setSession(null);
  }, []);

  return { session, loading, signIn, signUp, signOut };
}

// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import type { Session, User, UseAuthReturn } from "../types/types";

// This is a custom mock implementation that simulates authentication without external libraries
export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Check localStorage for existing session
    try {
      const savedSession = localStorage.getItem("portfolio_session");
      if (savedSession) {
        setSession(JSON.parse(savedSession) as Session);
      }
    } catch (error) {
      console.error("Failed to parse session from localStorage", error);
      localStorage.removeItem("portfolio_session"); // Clear corrupted data
    }
    setLoading(false);
  }, []);

  const signUp = async (
    email: string,
    password: string,
    name: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
  }> => {
    setLoading(true);

    // Simulate network request
    return new Promise((resolve) => {
      setTimeout(() => {
        // Basic validation (example)
        if (!email || !password || !name) {
          setLoading(false);
          resolve({
            user: null,
            session: null,
            error: "Email, password, and name are required.",
          });
          return;
        }
        const mockUser: User = {
          id: "user_" + Math.random().toString(36).substr(2, 9),
          email,
          name,
        };
        const mockSession: Session = {
          user: mockUser,
          token: "mock_token_" + Date.now(),
        };

        try {
          localStorage.setItem(
            "portfolio_session",
            JSON.stringify(mockSession)
          );
          setSession(mockSession);
          setLoading(false);
          resolve({ user: mockUser, session: mockSession, error: null });
        } catch (error) {
          console.error("Failed to save session to localStorage", error);
          setLoading(false);
          resolve({
            user: null,
            session: null,
            error: "Failed to save session.",
          });
        }
      }, 1000);
    });
  };

  const signIn = async (
    email: string,
    password: string
  ): Promise<{
    user: User | null;
    session: Session | null;
    error: string | null;
  }> => {
    setLoading(true);

    // Simulate network request
    return new Promise((resolve) => {
      setTimeout(() => {
        // Demo credentials for testing
        if (email === "demo@example.com" && password === "password") {
          const mockUser: User = { id: "user_demo", email, name: "Demo User" };
          const mockSession: Session = {
            user: mockUser,
            token: "mock_token_" + Date.now(),
          };

          try {
            localStorage.setItem(
              "portfolio_session",
              JSON.stringify(mockSession)
            );
            setSession(mockSession);
            setLoading(false);
            resolve({ user: mockUser, session: mockSession, error: null });
          } catch (error) {
            console.error("Failed to save session to localStorage", error);
            setLoading(false);
            resolve({
              user: null,
              session: null,
              error: "Failed to save session.",
            });
          }
        } else {
          setLoading(false);
          resolve({
            user: null,
            session: null,
            error: "Invalid login credentials",
          });
        }
      }, 1000);
    });
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      localStorage.removeItem("portfolio_session");
      setSession(null);
      return { error: null };
    } catch (error) {
      console.error("Failed to remove session from localStorage", error);
      return { error: "Failed to sign out properly." };
    }
  };

  return {
    session,
    loading,
    signUp,
    signIn,
    signOut,
  };
};

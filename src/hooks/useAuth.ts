// src/hooks/useAuth.ts
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import type { Session, User, UseAuthReturn } from "../types/types";

// Initialize Supabase client - removing Vite references
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn(
    "Supabase credentials not found. Auth functionality will not work correctly."
  );
}

const supabase = createClient(supabaseUrl || "", supabaseKey || "");

// Custom hook for authentication using Supabase
export const useAuth = (): UseAuthReturn => {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    // Get current session on mount and set up listener for auth changes
    const getInitialSession = async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error) {
          console.error("Error fetching session:", error.message);
          return;
        }

        if (data.session) {
          // Map Supabase session to our app's Session type
          const appSession: Session = {
            user: {
              id: data.session.user.id,
              email: data.session.user.email || "",
              name: data.session.user.user_metadata.name || "",
            },
            token: data.session.access_token,
          };
          setSession(appSession);
        }
      } catch (error) {
        console.error("Failed to get initial session", error);
      } finally {
        setLoading(false);
      }
    };

    getInitialSession();

    // Set up auth state change listener
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, supabaseSession) => {
        if (supabaseSession) {
          // Map Supabase session to our app's Session type
          const appSession: Session = {
            user: {
              id: supabaseSession.user.id,
              email: supabaseSession.user.email || "",
              name: supabaseSession.user.user_metadata.name || "",
            },
            token: supabaseSession.access_token,
          };
          setSession(appSession);
        } else {
          setSession(null);
        }
        setLoading(false);
      }
    );

    // Clean up subscription
    return () => {
      authListener.subscription.unsubscribe();
    };
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

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { name },
        },
      });

      if (error) {
        setLoading(false);
        return { user: null, session: null, error: error.message };
      }

      if (data.session) {
        // Map Supabase user and session to our app's types
        const appUser: User = {
          id: data.user?.id,
          email: data.user?.email || "",
          name: data.user?.user_metadata.name || "",
        };

        const appSession: Session = {
          user: appUser,
          token: data.session.access_token,
        };

        setSession(appSession);
        setLoading(false);
        return { user: appUser, session: appSession, error: null };
      } else {
        // User might need to confirm email based on Supabase settings
        setLoading(false);
        return {
          user: null,
          session: null,
          error: "Please check your email to confirm your registration.",
        };
      }
    } catch (error) {
      console.error("Failed during signup process", error);
      setLoading(false);
      return {
        user: null,
        session: null,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
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

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        setLoading(false);
        return { user: null, session: null, error: error.message };
      }

      // Map Supabase user and session to our app's types
      const appUser: User = {
        id: data.user.id,
        email: data.user.email || "",
        name: data.user.user_metadata.name || "",
      };

      const appSession: Session = {
        user: appUser,
        token: data.session.access_token,
      };

      setSession(appSession);
      setLoading(false);
      return { user: appUser, session: appSession, error: null };
    } catch (error) {
      console.error("Failed during signin process", error);
      setLoading(false);
      return {
        user: null,
        session: null,
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      };
    }
  };

  const signOut = async (): Promise<{ error: string | null }> => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      setSession(null);
      return { error: null };
    } catch (error) {
      console.error("Failed to sign out", error);
      return {
        error:
          error instanceof Error
            ? error.message
            : "Failed to sign out properly.",
      };
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

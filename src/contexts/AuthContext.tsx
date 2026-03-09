import { type Session, type User } from '@supabase/supabase-js';
import { createContext, type ReactNode, useContext, useEffect, useState } from 'react';

import { supabase } from '../lib/supabaseClient';

/**
 * Shape of the value exposed by `AuthContext`.
 */
type AuthContextType = {
  /** The active Supabase session, or `null` while the initial auth check is in progress. */
  session: Session | null;
  /** The currently authenticated user (anonymous or permanent), or `null` before the first session resolves. */
  user: User | null;
  /** `true` if the current user is anonymous (no email/password credentials attached). */
  isAnonymous: boolean;
  /** `true` if the current user has a permanent account with email/password credentials. */
  isPermanent: boolean;
  /** `true` while the initial authentication state is being determined on mount. */
  authLoading: boolean;
  /**
   * Signs out the current user. The `onAuthStateChange` listener will automatically
   * create a new anonymous session immediately after sign-out.
   */
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Provides application-wide authentication state and helpers to the component tree.
 *
 * On mount, subscribes to Supabase auth state changes. If no session is present,
 * automatically calls `signInAnonymously` so the app always has an active user.
 * On unmount, unsubscribes from the auth listener to prevent memory leaks.
 *
 * Side Effects:
 * - Subscribes to `supabase.auth.onAuthStateChange` for the component's lifetime.
 * - May call `supabase.auth.signInAnonymously()` if no existing session is detected.
 */
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthLoading(true);

    // Handles initial session check and subsequent updates
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      // If there is no session, create a new anonymous one
      if (!currentSession) {
        const {
          data: { session: anonSession },
          error,
        } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error('Error creating anonymous user:', error);
          setAuthLoading(false);
          return;
        }
        setSession(anonSession);
      } else {
        setSession(currentSession);
      }
      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);

  // Signs out current user and replaces them with a new anonymous user
  // This ensures that the app always has a valid session.
  const signOut = async () => {
    setAuthLoading(true);

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Error signing out:', error);
      setAuthLoading(false);
    }
  };

  const user = session?.user ?? null;
  const isAnonymous = user?.is_anonymous ?? true;
  const isPermanent = !!user && !isAnonymous;

  const value = {
    session,
    user,
    isAnonymous,
    isPermanent,
    authLoading,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook for easy context consumption
/**
 * Returns the current authentication state and helpers from `AuthContext`.
 * Must be called inside a component that is a descendant of `AuthProvider`.
 *
 * @throws {Error} If called outside of an `AuthProvider` tree.
 */
// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

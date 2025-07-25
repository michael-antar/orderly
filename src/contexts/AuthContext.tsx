import { createContext, useState, useEffect, useContext, type ReactNode } from 'react';
import { type Session, type User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabaseClient';

// Define the shape of the context value
type AuthContextType = {
  session: Session | null;
  user: User | null;
  isAnonymous: boolean;
  isPermanent: boolean;
  authLoading: boolean;
  signOut: () => Promise<void>;
};

// Create the context with a default value
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Define the provider component  
export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthLoading(true);

    // Handles initial session check and subsequent updates
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, currentSession) => {
      // If there is no session, create a new anonymous one
      if (!currentSession) {
        const { data: { session: anonSession }, error } = await supabase.auth.signInAnonymously();
        if (error) {
          console.error("Error creating anonymous user:", error);
          setAuthLoading(false);
          return;
        }
        setSession(anonSession);
      }
      else {
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
    setAuthLoading(true)

    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error("Error signing out:", error);
      setAuthLoading(false);
    }
  }

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
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
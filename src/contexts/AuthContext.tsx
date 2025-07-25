import { createContext, useState, useEffect, useContext, useRef, type ReactNode } from 'react';
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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const initialized = useRef(false);

  useEffect(() => {
    // To prevent running twice in StrictMode
    if (initialized.current) {
      return;
    }
    initialized.current = true;

    // Initial check for session on page load
    const initializeSession = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();

      if (currentSession) {
        setSession(currentSession);
        setUser(currentSession.user ?? null);
      }
      else {
        // If no session, sign in anonymously
        const { data: { session: anonSession } } = await supabase.auth.signInAnonymously();
        setSession(anonSession);
        setUser(anonSession?.user ?? null);
      }
      setAuthLoading(false)
    };

    initializeSession();

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user?? null);
      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, []);
  
  const signOut = async () => {
    setAuthLoading(true)

    try {
      // Sign out current user
      await supabase.auth.signOut();

      // Sign in a new anonymous user
      const { data: { session: anonSession }, error } = await supabase.auth.signInAnonymously();

      if (error) {
        console.error("Error creating new anonymous user after sign out:", error);
      }
      else {
        setSession(anonSession);
        setUser(anonSession?.user ?? null);
      }
    }
    catch (e) {
      console.error("An unexpected error occurred during sign out:", e);
    }
    finally {
      setAuthLoading(false);
    }
  };

  const value = {
    session,
    user,
    isAnonymous: user?.is_anonymous?? true,
    isPermanent:!!user &&!user.is_anonymous,
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
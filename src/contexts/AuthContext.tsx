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
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);

  useEffect(() => {
    setAuthLoading(true);

    // Get the initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user?? null);

      // If no session, sign in anonymously
      if (!session) {
        supabase.auth.signInAnonymously().then(({ data: { session: anonSession } }) => {
          setSession(anonSession);
          setUser(anonSession?.user?? null);
          setAuthLoading(false);
        });
      } else {
        setAuthLoading(false);
      }
    });

    // Listen for auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user?? null);
      setAuthLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  },);
  
  const signOut = async () => {
    await supabase.auth.signOut();
    // After sign-out, the onAuthStateChange listener will trigger an anonymous sign-in
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
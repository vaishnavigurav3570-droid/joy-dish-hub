import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

type AppRole = 'owner' | 'worker' | 'user';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  role: AppRole;
  isGuest: boolean;
  loading: boolean;
  setGuestMode: (v: boolean) => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<AppRole>('user');
  const [isGuest, setIsGuest] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        setIsGuest(false);
        // Fetch role after auth state change
        setTimeout(() => fetchRole(session.user.id), 0);
      } else {
        setRole('user');
      }
      setLoading(false);
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        fetchRole(session.user.id);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const fetchRole = async (userId: string) => {
    const { data } = await (supabase as any).from('user_roles').select('role').eq('user_id', userId).maybeSingle();
    if (data?.role) {
      setRole(data.role as AppRole);
    } else {
      setRole('user');
    }
  };

  const signOut = async () => {
    await supabase.auth.signOut();
    setRole('user');
    setIsGuest(false);
  };

  const setGuestMode = (v: boolean) => {
    setIsGuest(v);
    setLoading(false);
  };

  return (
    <AuthContext.Provider value={{ user, session, role, isGuest, loading, setGuestMode, signOut }}>
      {children}
    </AuthContext.Provider>
  );
};

import { createContext, useContext, useEffect, useState, useCallback, useMemo, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User, Session } from "@supabase/supabase-js";

interface AuthContextType {
  user: User | null;
  session: Session | null;
  isAdmin: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  isAdmin: false,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  // Cache admin check to avoid redundant queries
  const adminCheckCache = useState<Record<string, boolean>>(() => ({}))[0];

  const checkAdminRole = useCallback(async (userId: string) => {
    if (userId in adminCheckCache) {
      setIsAdmin(adminCheckCache[userId]);
      return;
    }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    const result = !!data;
    adminCheckCache[userId] = result;
    setIsAdmin(result);
  }, [adminCheckCache]);

  useEffect(() => {
    let initialized = false;

    // Get initial session first
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (initialized) return; // onAuthStateChange already fired
      initialized = true;
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        await checkAdminRole(s.user.id);
      }
      setLoading(false);
    });

    // Listen for subsequent changes only
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (!initialized) {
          initialized = true; // Let getSession handle the first one
        }
        setSession(s);
        setUser(s?.user ?? null);
        if (s?.user) {
          await checkAdminRole(s.user.id);
        } else {
          setIsAdmin(false);
        }
        setLoading(false);
      }
    );

    return () => subscription.unsubscribe();
  }, [checkAdminRole]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setIsAdmin(false);
  }, []);

  const value = useMemo(() => ({
    user, session, isAdmin, loading, signOut,
  }), [user, session, isAdmin, loading, signOut]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

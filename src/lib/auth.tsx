import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface AuthCtx {
  user: User | null;
  session: Session | null;
  profile: any | null;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  session: null,
  profile: null,
  loading: true,
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string) => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", userId).single();
    setProfile(data);
  };

  const refreshProfile = async () => {
    if (session?.user.id) {
      await fetchProfile(session.user.id);
    }
  };

  useEffect(() => {
    // Fail-safe: Force loading to false after 2 seconds no matter what
    const timer = setTimeout(() => setLoading(false), 2000);

    // Only run auth logic in the browser
    if (typeof window === 'undefined') {
      setLoading(false);
      return;
    }

    if (!supabase?.auth) {
      setLoading(false);
      return;
    }

    let sub: any;
    try {
      const result = supabase.auth.onAuthStateChange(async (_e, s) => {
        setSession(s);
        if (s?.user) {
          try { await fetchProfile(s.user.id); } catch {}
        } else {
          setProfile(null);
        }
        setLoading(false);
      });
      sub = result?.data;
    } catch {
      setLoading(false);
    }

    supabase.auth.getSession()
      .then(async ({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          try { await fetchProfile(data.session.user.id); } catch {}
        }
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
      });

    return () => {
      clearTimeout(timer);
      try { sub?.subscription?.unsubscribe(); } catch {}
    };
  }, []);

  return (
    <Ctx.Provider
      value={{
        user: session?.user ?? null,
        session,
        profile,
        loading,
        refreshProfile,
        signOut: async () => {
          await supabase.auth.signOut();
          window.location.href = "/";
        },
      }}
    >
      {children}
    </Ctx.Provider>
  );
}

export const useAuth = () => useContext(Ctx);

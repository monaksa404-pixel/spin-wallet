import { useEffect, useState } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { isBootstrapAdminEmail } from "@/lib/admin-bootstrap";

type Role = "admin" | "user" | null;

async function resolveRole(u: User | null): Promise<Role> {
  if (!u) return null;
  if (isBootstrapAdminEmail(u.email)) return "admin";
  const { data } = await supabase.from("user_roles").select("role").eq("user_id", u.id);
  const adminInDb = (data ?? []).some((r) => r.role === "admin");
  return adminInDb ? "admin" : "user";
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<Role>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession(s);
      setUser(s?.user ?? null);
      void (async () => {
        const r = await resolveRole(s?.user ?? null);
        setRole(r);
        setLoading(false);
      })();
    });

    supabase.auth.getSession().then(({ data: { session: s } }) => {
      setSession(s);
      setUser(s?.user ?? null);
      void (async () => {
        const r = await resolveRole(s?.user ?? null);
        setRole(r);
        setLoading(false);
      })();
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return { session, user, role, loading, signOut, isAdmin: role === "admin" };
}

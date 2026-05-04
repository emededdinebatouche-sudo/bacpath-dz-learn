import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { AppContext, useAppState } from "@/lib/state";
import AdminDashboard from "@/components/admin/AdminDashboard";

export default function AdminPage() {
  const state = useAppState();
  const navigate = useNavigate();

  useEffect(() => {
    if (state.loading) return;
    if (!state.session) {
      navigate("/auth", { replace: true });
      return;
    }
    const email = state.session.user.email;
    if (email !== "batoucheimad0@gmail.com") {
      navigate("/", { replace: true });
    }
  }, [state.loading, state.session, navigate]);

  if (state.loading || !state.session) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="h-10 w-10 rounded-full border-4 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  // Provide a minimal user object so AdminDashboard can render even if profile/role row missing
  const ctxValue = {
    ...state,
    user: state.user ?? {
      id: state.session.user.id,
      email: state.session.user.email ?? "",
      name: state.session.user.email?.split("@")[0] ?? "Admin",
      role: "admin" as const,
      points: 0,
      level: 1,
      streak: 0,
      stream: null,
    },
  };

  return (
    <AppContext.Provider value={ctxValue as any}>
      <AdminDashboard />
    </AppContext.Provider>
  );
}

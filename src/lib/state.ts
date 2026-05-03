import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupaUser, Session } from "@supabase/supabase-js";

export type Subject = "math" | "physics" | "chemistry" | "history";

export const SUBJECT_META: Record<Subject, { label: string; emoji: string; color: string }> = {
  math: { label: "الرياضيات", emoji: "📐", color: "from-blue-500 to-indigo-600" },
  physics: { label: "الفيزياء", emoji: "⚛️", color: "from-violet-500 to-purple-600" },
  chemistry: { label: "الكيمياء", emoji: "🧪", color: "from-emerald-500 to-teal-600" },
  history: { label: "التاريخ والجغرافيا", emoji: "🌍", color: "from-amber-500 to-orange-600" },
};

export type Role = "student" | "teacher";

export type AppUser = {
  id: string;
  name: string;
  email: string;
  role: Role;
  points: number;
  level: number;
  streak: number;
  stream?: string | null;
};

export type Task = {
  id: string;
  title: string;
  subject: Subject;
  duration: number;
  points: number;
  done: boolean;
};

type AppState = ReturnType<typeof useAppState>;

export const AppContext = createContext<AppState | null>(null);

export const useApp = () => {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error("AppContext missing");
  return ctx;
};

async function loadAppUser(supaUser: SupaUser): Promise<AppUser | null> {
  const [{ data: profile }, { data: roleRow }] = await Promise.all([
    supabase.from("profiles").select("full_name, points, level, streak, stream").eq("id", supaUser.id).maybeSingle(),
    supabase.from("user_roles").select("role").eq("user_id", supaUser.id).maybeSingle(),
  ]);
  if (!roleRow) return null;
  return {
    id: supaUser.id,
    email: supaUser.email ?? "",
    name: profile?.full_name || supaUser.email?.split("@")[0] || "مستخدم",
    role: roleRow.role as Role,
    points: profile?.points ?? 0,
    level: profile?.level ?? 1,
    streak: profile?.streak ?? 0,
    stream: profile?.stream ?? null,
  };
}

export function useAppState() {
  const [user, setUser] = useState<AppUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);

  const loadTasks = useCallback(async (uid: string) => {
    const { data } = await supabase
      .from("tasks" as any)
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: true });
    if (data) setTasks(data as any);
  }, []);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        const uid = sess.user.id;
        setTimeout(() => {
          loadAppUser(sess.user).then(u => { setUser(u); setLoading(false); });
          loadTasks(uid);
        }, 0);
      } else {
        setUser(null);
        setTasks([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadAppUser(sess.user).then(u => { setUser(u); setLoading(false); });
        loadTasks(sess.user.id);
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [loadTasks]);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setTasks([]);
  };

  const completeTask = async (id: string, awardedPoints?: number) => {
    const task = tasks.find(t => t.id === id);
    if (!task || task.done || !user) return;
    const award = awardedPoints ?? task.points;
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    const newPoints = user.points + award;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    setUser({ ...user, points: newPoints, level: newLevel });
    await Promise.all([
      supabase.from("tasks" as any).update({ done: true }).eq("id", id),
      supabase.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", user.id),
    ]);
  };

  const addTask = async (input: { title: string; subject: Subject; duration: number; points: number }) => {
    if (!user) return;
    const { data, error } = await supabase
      .from("tasks" as any)
      .insert({ ...input, user_id: user.id, done: false })
      .select()
      .single();
    if (!error && data) setTasks(prev => [...prev, data as any]);
  };

  const deleteTask = async (id: string) => {
    setTasks(prev => prev.filter(t => t.id !== id));
    await supabase.from("tasks" as any).delete().eq("id", id);
  };

  const addPoints = async (pts: number) => {
    if (!user) return;
    const newPoints = user.points + pts;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    setUser({ ...user, points: newPoints, level: newLevel });
    await supabase.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", user.id);
  };

  return { user, session, loading, tasks, logout, completeTask, addTask, deleteTask, addPoints };
}

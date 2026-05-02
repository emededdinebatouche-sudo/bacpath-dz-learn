import { createContext, useContext, useState, useEffect } from "react";
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

const initialTasks: Task[] = [
  { id: "t1", title: "حل 10 تمارين في النهايات والاتصال", subject: "math", duration: 45, points: 50, done: false },
  { id: "t2", title: "مراجعة درس الحقل المغناطيسي", subject: "physics", duration: 30, points: 40, done: false },
  { id: "t3", title: "تحضير ملخص: الحرب الباردة", subject: "history", duration: 25, points: 30, done: true },
  { id: "t4", title: "حفظ المعادلات الكيميائية الرئيسية", subject: "chemistry", duration: 20, points: 25, done: false },
];

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
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      setSession(sess);
      if (sess?.user) {
        setTimeout(() => {
          loadAppUser(sess.user).then(u => { setUser(u); setLoading(false); });
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data: { session: sess } }) => {
      setSession(sess);
      if (sess?.user) {
        loadAppUser(sess.user).then(u => { setUser(u); setLoading(false); });
      } else {
        setLoading(false);
      }
    });

    return () => sub.subscription.unsubscribe();
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
  };

  const completeTask = async (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    const task = tasks.find(t => t.id === id);
    if (task && !task.done && user) {
      const newPoints = user.points + task.points;
      const newLevel = Math.floor(newPoints / 1000) + 1;
      setUser({ ...user, points: newPoints, level: newLevel });
      await supabase.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", user.id);
    }
  };

  const addPoints = async (pts: number) => {
    if (!user) return;
    const newPoints = user.points + pts;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    setUser({ ...user, points: newPoints, level: newLevel });
    await supabase.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", user.id);
  };

  return { user, session, loading, tasks, logout, completeTask, addPoints };
}

import { createContext, useContext, useState, useEffect } from "react";

export type Subject = "math" | "physics" | "chemistry" | "history";

export const SUBJECT_META: Record<Subject, { label: string; emoji: string; color: string }> = {
  math: { label: "الرياضيات", emoji: "📐", color: "from-blue-500 to-indigo-600" },
  physics: { label: "الفيزياء", emoji: "⚛️", color: "from-violet-500 to-purple-600" },
  chemistry: { label: "الكيمياء", emoji: "🧪", color: "from-emerald-500 to-teal-600" },
  history: { label: "التاريخ والجغرافيا", emoji: "🌍", color: "from-amber-500 to-orange-600" },
};

export type User = {
  name: string;
  email: string;
  role: "student" | "teacher";
  points: number;
  level: number;
  streak: number;
  avatar?: string;
};

export type Task = {
  id: string;
  title: string;
  subject: Subject;
  duration: number; // minutes
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

export function useAppState() {
  const [user, setUser] = useState<User | null>(null);
  const [tasks, setTasks] = useState<Task[]>(initialTasks);

  useEffect(() => {
    const saved = localStorage.getItem("bacpath_user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  useEffect(() => {
    if (user) localStorage.setItem("bacpath_user", JSON.stringify(user));
  }, [user]);

  const login = (role: "student" | "teacher", name?: string, email?: string) => {
    setUser({
      name: name || (role === "teacher" ? "الأستاذ كريم بن عيسى" : "أمين الجزائري"),
      email: email || (role === "teacher" ? "teacher@bacpath.dz" : "student@bacpath.dz"),
      role,
      points: role === "student" ? 1280 : 0,
      level: role === "student" ? 2 : 0,
      streak: role === "student" ? 7 : 0,
    });
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("bacpath_user");
  };

  const completeTask = (id: string) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: true } : t));
    const task = tasks.find(t => t.id === id);
    if (task && !task.done && user) {
      const newPoints = user.points + task.points;
      const newLevel = Math.floor(newPoints / 1000) + 1;
      setUser({ ...user, points: newPoints, level: newLevel });
    }
  };

  const addPoints = (pts: number) => {
    if (!user) return;
    const newPoints = user.points + pts;
    const newLevel = Math.floor(newPoints / 1000) + 1;
    setUser({ ...user, points: newPoints, level: newLevel });
  };

  return { user, tasks, login, logout, completeTask, addPoints };
}

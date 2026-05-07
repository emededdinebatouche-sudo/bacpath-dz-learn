import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, LogOut, Users, BookOpen, Compass, Video, Shield, Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import ExerciseManager from "@/components/exercises/ExerciseManager";
import LiveSessionsManager from "@/components/live/LiveSessionsManager";

type Profile = {
  id: string;
  full_name: string;
  points: number;
  level: number;
  streak: number;
  stream: string | null;
  teacher_subject: string | null;
};

type RoleRow = { user_id: string; role: "student" | "teacher" | "admin" };

type TaskRow = { id: string; user_id: string; title: string; done: boolean; points: number };

type Tab = "overview" | "students" | "teachers" | "exercises" | "guide" | "sessions";

export default function AdminDashboard() {
  const { user, logout } = useApp();
  const [tab, setTab] = useState<Tab>("overview");
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [roles, setRoles] = useState<RoleRow[]>([]);
  const [tasks, setTasks] = useState<TaskRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: p }, { data: r }, { data: t }] = await Promise.all([
        supabase.from("profiles").select("id, full_name, points, level, streak, stream, teacher_subject"),
        supabase.from("user_roles").select("user_id, role"),
        supabase.from("tasks" as any).select("id, user_id, title, done, points"),
      ]);
      setProfiles((p as any) || []);
      setRoles((r as any) || []);
      setTasks((t as any) || []);
      setLoading(false);
    })();
  }, []);

  const roleOf = (uid: string) => roles.find(r => r.user_id === uid)?.role ?? "student";
  const students = profiles.filter(p => roleOf(p.id) === "student");
  const teachers = profiles.filter(p => roleOf(p.id) === "teacher");
  const tasksByUser = (uid: string) => tasks.filter(t => t.user_id === uid);

  const NAV: { id: Tab; label: string; icon: any }[] = [
    { id: "overview", label: "نظرة عامة", icon: Shield },
    { id: "students", label: "الطلاب", icon: Users },
    { id: "teachers", label: "الأساتذة", icon: GraduationCap },
    { id: "exercises", label: "التمارين", icon: BookOpen },
    { id: "guide", label: "دليلي", icon: Compass },
    { id: "sessions", label: "الحصص المباشرة", icon: Video },
  ];

  return (
    <div className="min-h-screen bg-background flex">
      <aside className="hidden lg:flex flex-col w-64 bg-card border-l border-border p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
            <Shield className="h-6 w-6 text-white" />
          </div>
          <div>
            <div className="font-display text-lg font-extrabold text-gradient">لوحة الأدمن</div>
            <div className="text-[10px] text-muted-foreground">BacPath Admin</div>
          </div>
        </div>
        <nav className="space-y-1 flex-1">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth",
                tab === item.id
                  ? "bg-gradient-primary text-white shadow-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
        </nav>
        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white font-bold">
                {user?.name.slice(0, 2)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user?.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full mt-2 justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile tabs */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center gap-2 px-4 py-3">
          <Shield className="h-5 w-5 text-primary" />
          <span className="font-display text-lg font-extrabold text-gradient">لوحة الأدمن</span>
          <Button variant="ghost" size="sm" onClick={logout} className="mr-auto gap-1">
            <LogOut className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex gap-1 overflow-x-auto px-2 pb-2">
          {NAV.map(item => (
            <button
              key={item.id}
              onClick={() => setTab(item.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap",
                tab === item.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <main className="flex-1 min-w-0 pt-28 lg:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto space-y-6">
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : tab === "overview" ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <StatCard label="الطلاب" value={students.length} />
              <StatCard label="الأساتذة" value={teachers.length} />
              <StatCard label="إجمالي المهام" value={tasks.length} />
              <StatCard label="مهام مكتملة" value={tasks.filter(t => t.done).length} />
            </div>
          ) : tab === "students" ? (
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-extrabold">الطلاب وتقدمهم</h2>
              {students.length === 0 && <p className="text-muted-foreground">لا يوجد طلاب بعد.</p>}
              {students.map(s => {
                const ts = tasksByUser(s.id);
                const done = ts.filter(t => t.done).length;
                return (
                  <Card key={s.id} className="p-4 flex items-center gap-4">
                    <Avatar><AvatarFallback className="bg-gradient-primary text-white">{s.full_name.slice(0,2) || "ط"}</AvatarFallback></Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="font-bold truncate">{s.full_name || "بدون اسم"}</div>
                      <div className="text-xs text-muted-foreground">شعبة: {s.stream || "—"} • مستوى {s.level}</div>
                    </div>
                    <div className="text-left">
                      <div className="text-sm font-bold text-primary">{s.points} نقطة</div>
                      <div className="text-xs text-muted-foreground">{done}/{ts.length} مهمة</div>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : tab === "teachers" ? (
            <div className="space-y-3">
              <h2 className="text-2xl font-display font-extrabold">الأساتذة</h2>
              {teachers.length === 0 && <p className="text-muted-foreground">لا يوجد أساتذة بعد.</p>}
              {teachers.map(t => (
                <TeacherRow key={t.id} teacher={t} onSaved={(subj) => setProfiles(prev => prev.map(p => p.id === t.id ? { ...p, teacher_subject: subj } : p))} />
              ))}
            </div>
          ) : tab === "exercises" ? (
            <ExerciseManager />
          ) : tab === "sessions" ? (
            <LiveSessionsManager />
          ) : (
            <Card className="p-8 text-center space-y-2">
              <h2 className="text-xl font-display font-extrabold">قريباً</h2>
              <p className="text-muted-foreground text-sm">إدارة هذا القسم ستضاف لاحقاً.</p>
            </Card>
          )}
        </div>
      </main>
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <Card className="p-5">
      <div className="text-sm text-muted-foreground">{label}</div>
      <div className="text-3xl font-extrabold text-gradient mt-1">{value}</div>
    </Card>
  );
}

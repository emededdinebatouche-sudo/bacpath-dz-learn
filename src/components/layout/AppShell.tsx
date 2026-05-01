import { ReactNode, useState } from "react";
import { useApp } from "@/lib/state";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { GraduationCap, LayoutDashboard, ListTodo, BookOpen, Video, Trophy, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV = [
  { id: "dashboard", label: "الرئيسية", icon: LayoutDashboard },
  { id: "plan", label: "خطة اليوم", icon: ListTodo },
  { id: "exercises", label: "التمارين", icon: BookOpen },
  { id: "live", label: "الدروس المباشرة", icon: Video },
  { id: "achievements", label: "الإنجازات", icon: Trophy },
];

interface Props {
  children: ReactNode;
  currentPage: string;
  onNavigate: (p: string) => void;
}

export default function AppShell({ children, currentPage, onNavigate }: Props) {
  const { user, logout } = useApp();
  const [mobileOpen, setMobileOpen] = useState(false);
  if (!user) return null;

  const initials = user.name.split(" ").slice(0, 2).map(n => n[0]).join("");

  const handleNav = (id: string) => { onNavigate(id); setMobileOpen(false); };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Sidebar — desktop */}
      <aside className="hidden lg:flex flex-col w-64 bg-card border-l border-border p-4 sticky top-0 h-screen">
        <div className="flex items-center gap-2 px-2 py-3 mb-6">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-gradient">BacPath</span>
        </div>

        <nav className="space-y-1 flex-1">
          {user.role === "student" && NAV.map(item => (
            <button
              key={item.id}
              onClick={() => handleNav(item.id)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth",
                currentPage === item.id
                  ? "bg-gradient-primary text-white shadow-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="h-5 w-5" />
              {item.label}
            </button>
          ))}
          {user.role === "teacher" && (
            <div className="px-3 py-2 text-sm text-muted-foreground">لوحة الأستاذ</div>
          )}
        </nav>

        <div className="border-t border-border pt-4 mt-4">
          <div className="flex items-center gap-3 px-2 py-2 rounded-xl">
            <Avatar className="h-10 w-10 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white font-bold">{initials}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-bold truncate">{user.name}</div>
              <div className="text-xs text-muted-foreground truncate">{user.email}</div>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="w-full mt-2 justify-start gap-2 text-muted-foreground">
            <LogOut className="h-4 w-4" /> تسجيل الخروج
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <div className="lg:hidden fixed top-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-gradient-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-white" />
            </div>
            <span className="font-display text-xl font-extrabold text-gradient">BacPath</span>
          </div>
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(o => !o)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
        {mobileOpen && (
          <div className="border-t border-border p-3 space-y-1 animate-fade-in bg-card">
            {user.role === "student" && NAV.map(item => (
              <button
                key={item.id}
                onClick={() => handleNav(item.id)}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold transition-smooth",
                  currentPage === item.id ? "bg-gradient-primary text-white" : "text-muted-foreground hover:bg-muted"
                )}
              >
                <item.icon className="h-5 w-5" /> {item.label}
              </button>
            ))}
            <Button variant="ghost" onClick={logout} className="w-full justify-start gap-2 text-muted-foreground">
              <LogOut className="h-4 w-4" /> تسجيل الخروج
            </Button>
          </div>
        )}
      </div>

      <main className="flex-1 min-w-0 pt-16 lg:pt-0">
        <div className="p-4 md:p-8 max-w-6xl mx-auto">{children}</div>
      </main>

      {/* Mobile bottom nav */}
      {user.role === "student" && (
        <nav className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-card/95 backdrop-blur border-t border-border">
          <div className="grid grid-cols-5 gap-1 px-2 py-2">
            {NAV.map(item => (
              <button
                key={item.id}
                onClick={() => onNavigate(item.id)}
                className={cn(
                  "flex flex-col items-center gap-1 py-1.5 rounded-lg transition-smooth",
                  currentPage === item.id ? "text-primary" : "text-muted-foreground"
                )}
              >
                <item.icon className="h-5 w-5" />
                <span className="text-[10px] font-semibold">{item.label}</span>
              </button>
            ))}
          </div>
        </nav>
      )}
    </div>
  );
}

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { useApp, SUBJECT_META, Subject } from "@/lib/state";
import { Flame, Trophy, Zap, ChevronLeft, ListTodo, BookOpen, Video } from "lucide-react";

interface Props { onNavigate: (p: string) => void; }

export default function StudentDashboard({ onNavigate }: Props) {
  const { user, tasks } = useApp();
  if (!user) return null;

  const pointsInLevel = user.points % 1000;
  const doneToday = tasks.filter(t => t.done).length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      {/* Greeting hero */}
      <Card className="relative overflow-hidden p-6 md:p-8 bg-gradient-hero text-white border-0 shadow-elevated">
        <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="absolute -bottom-12 -right-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
        <div className="relative">
          <p className="text-white/80 text-sm font-semibold mb-1">أهلاً بعودتك 👋</p>
          <h1 className="font-display text-3xl md:text-4xl font-extrabold mb-1">{user.name}</h1>
          <p className="text-white/80 text-sm md:text-base mb-5">واصل التقدم — أنت على الطريق الصحيح نحو البكالوريا!</p>

          <div className="flex flex-wrap gap-3">
            <Button onClick={() => onNavigate("plan")} className="bg-white text-primary hover:bg-white/90 font-bold gap-2">
              <ListTodo className="h-4 w-4" /> ابدأ مهام اليوم
            </Button>
            <Button onClick={() => onNavigate("exercises")} variant="outline" className="bg-white/10 border-white/30 text-white hover:bg-white/20 gap-2">
              <BookOpen className="h-4 w-4" /> تمارين
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-5">
        <StatCard icon={Zap} label="النقاط" value={user.points.toLocaleString("ar-DZ")} gradient="from-blue-500 to-indigo-600" />
        <StatCard icon={Trophy} label="المستوى" value={`${user.level}`} gradient="from-violet-500 to-purple-600" />
        <StatCard icon={Flame} label="أيام متتالية" value={`${user.streak}`} gradient="from-orange-500 to-rose-600" />
      </div>

      {/* Level progress */}
      <Card className="p-5 md:p-6 bg-gradient-card border-border/60">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h3 className="font-display font-bold text-lg">المستوى {user.level}</h3>
            <p className="text-sm text-muted-foreground">{1000 - pointsInLevel} نقطة للوصول للمستوى التالي</p>
          </div>
          <div className="h-14 w-14 rounded-2xl bg-gradient-primary flex items-center justify-center text-white font-display font-extrabold text-xl shadow-primary">
            {user.level}
          </div>
        </div>
        <Progress value={(pointsInLevel / 1000) * 100} className="h-3" />
        <div className="flex justify-between text-xs text-muted-foreground mt-2 font-semibold">
          <span>{pointsInLevel} / 1000</span>
          <span>المستوى {user.level + 1} 🎯</span>
        </div>
      </Card>

      {/* Today's progress */}
      <Card className="p-5 md:p-6 bg-gradient-card border-border/60">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-lg">مهام اليوم</h3>
          <button onClick={() => onNavigate("plan")} className="text-sm text-primary font-bold hover:underline flex items-center gap-1">
            عرض الكل <ChevronLeft className="h-4 w-4" />
          </button>
        </div>
        <div className="flex items-center gap-4 mb-4">
          <div className="text-3xl font-display font-extrabold text-gradient">{doneToday}/{tasks.length}</div>
          <div className="flex-1">
            <Progress value={(doneToday / tasks.length) * 100} className="h-2.5" />
            <p className="text-xs text-muted-foreground mt-1.5 font-semibold">مهام مكتملة اليوم</p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {(Object.keys(SUBJECT_META) as Subject[]).map(s => {
            const m = SUBJECT_META[s];
            const subjectTasks = tasks.filter(t => t.subject === s);
            return (
              <div key={s} className="rounded-xl bg-muted/60 p-3 text-center">
                <div className="text-2xl mb-1">{m.emoji}</div>
                <div className="text-xs font-bold">{m.label}</div>
                <div className="text-[11px] text-muted-foreground">{subjectTasks.filter(t => t.done).length}/{subjectTasks.length}</div>
              </div>
            );
          })}
        </div>
      </Card>

      {/* Live now */}
      <Card className="p-5 md:p-6 border-border/60 relative overflow-hidden">
        <div className="absolute top-4 left-4 flex items-center gap-1.5 bg-destructive/10 text-destructive px-2.5 py-1 rounded-full text-xs font-bold">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" /> مباشر الآن
        </div>
        <div className="flex items-start gap-4">
          <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-rose-500 to-orange-500 flex items-center justify-center shadow-md flex-shrink-0">
            <Video className="h-7 w-7 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-display font-bold text-lg mb-1">حصة الرياضيات: المعادلات التفاضلية</h3>
            <p className="text-sm text-muted-foreground mb-3">مع الأستاذ سامي بوزيد · 1.2K طالب يشاهدون</p>
            <Button onClick={() => onNavigate("live")} size="sm" className="bg-gradient-primary hover:opacity-95">
              انضم الآن
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: string; gradient: string }) {
  return (
    <Card className="p-4 md:p-5 bg-gradient-card border-border/60 card-hover">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="font-display text-2xl md:text-3xl font-extrabold">{value}</div>
      <div className="text-xs md:text-sm text-muted-foreground font-semibold">{label}</div>
    </Card>
  );
}

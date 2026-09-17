import { useEffect, useMemo, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/state";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Flame, Star, Award, Target, Crown, Zap, BookOpen, Users } from "lucide-react";
import { cn } from "@/lib/utils";

type Stats = { points: number; level: number; streak: number; doneTasks: number };

type BadgeDef = {
  icon: any;
  title: string;
  desc: string;
  criteria: string;
  tip: string;
  gradient: string;
  goal: number;
  unit: string;
  value: (s: Stats) => number;
};

const BADGES: BadgeDef[] = [
  {
    icon: Flame, title: "سلسلة الأسبوع", desc: "المواظبة سبعة أيام متتالية.",
    criteria: "ادرس 7 أيام متتالية", tip: "أنجز مهمة واحدة على الأقل كل يوم حتى لا تنقطع السلسلة.",
    gradient: "from-orange-500 to-rose-600", goal: 7, unit: "يوم", value: s => s.streak,
  },
  {
    icon: Star, title: "نجم البداية", desc: "أنجز أولى مهامك في المنصة.",
    criteria: "أكمل 10 مهام", tip: "قسّم مراجعتك إلى مهام قصيرة (20 دقيقة) لتتقدم بسرعة.",
    gradient: "from-amber-400 to-yellow-500", goal: 10, unit: "مهمة", value: s => s.doneTasks,
  },
  {
    icon: Award, title: "جامع النقاط", desc: "اجمع 500 نقطة من المهام والتمارين.",
    criteria: "اجمع 500 نقطة", tip: "أنهِ المهام قبل انتهاء الوقت لتحصل على 20% نقاط إضافية.",
    gradient: "from-blue-500 to-indigo-600", goal: 500, unit: "نقطة", value: s => s.points,
  },
  {
    icon: BookOpen, title: "مثابر", desc: "أنجز 25 مهمة دراسية.",
    criteria: "أكمل 25 مهمة", tip: "خطّط ليوم غد من الليلة السابقة في صفحة خطة اليوم.",
    gradient: "from-emerald-500 to-teal-600", goal: 25, unit: "مهمة", value: s => s.doneTasks,
  },
  {
    icon: Target, title: "المستوى الخامس", desc: "ارتقِ إلى المستوى 5.",
    criteria: "وصول للمستوى 5", tip: "كل 1000 نقطة ترفعك مستوى كاملاً.",
    gradient: "from-violet-500 to-purple-600", goal: 5, unit: "مستوى", value: s => s.level,
  },
  {
    icon: Zap, title: "طاقة عالية", desc: "اجمع 2000 نقطة.",
    criteria: "اجمع 2000 نقطة", tip: "التمارين الصعبة تمنح 60 نقطة دفعة واحدة.",
    gradient: "from-pink-500 to-rose-600", goal: 2000, unit: "نقطة", value: s => s.points,
  },
  {
    icon: Crown, title: "ملك البكالوريا", desc: "ارتقِ إلى المستوى 10.",
    criteria: "وصول للمستوى 10", tip: "واظب يوميًا؛ المستوى 10 يعني 9000 نقطة.",
    gradient: "from-yellow-400 to-amber-600", goal: 10, unit: "مستوى", value: s => s.level,
  },
  {
    icon: Trophy, title: "أسطورة", desc: "30 يومًا متتاليًا من الدراسة.",
    criteria: "سلسلة 30 يوم", tip: "حتى 15 دقيقة يوميًا تكفي للحفاظ على السلسلة.",
    gradient: "from-fuchsia-500 to-purple-700", goal: 30, unit: "يوم", value: s => s.streak,
  },
];

export default function Achievements() {
  const { user } = useApp();
  const [stats, setStats] = useState<Stats>({ points: 0, level: 1, streak: 0, doneTasks: 0 });
  const [standing, setStanding] = useState<{ percentile: number; total: number } | null>(null);
  const [selected, setSelected] = useState<BadgeDef | null>(null);
  const [celebrate, setCelebrate] = useState<string | null>(null);
  const prevUnlocked = useRef<Set<string> | null>(null);

  const refresh = async () => {
    if (!user) return;
    const [{ data: profile }, { count }] = await Promise.all([
      supabase.from("profiles").select("points, level, streak").eq("id", user.id).maybeSingle(),
      supabase.from("tasks").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("done", true),
    ]);
    setStats({
      points: profile?.points ?? user.points,
      level: profile?.level ?? user.level,
      streak: profile?.streak ?? user.streak,
      doneTasks: count ?? 0,
    });
    const { data: st } = await supabase.rpc("my_points_standing");
    const row = Array.isArray(st) ? st[0] : st;
    if (row) setStanding({ percentile: row.percentile ?? 0, total: row.total_students ?? 0 });
  };

  useEffect(() => {
    refresh();
    if (!user) return;
    const ch = supabase
      .channel("achievements-live")
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles", filter: `id=eq.${user.id}` }, refresh)
      .on("postgres_changes", { event: "*", schema: "public", table: "tasks", filter: `user_id=eq.${user.id}` }, refresh)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const unlocked = useMemo(() => BADGES.filter(b => b.value(stats) >= b.goal), [stats]);

  useEffect(() => {
    const names = new Set(unlocked.map(b => b.title));
    if (prevUnlocked.current) {
      const fresh = [...names].find(n => !prevUnlocked.current!.has(n));
      if (fresh) {
        setCelebrate(fresh);
        setTimeout(() => setCelebrate(null), 4000);
      }
    }
    prevUnlocked.current = names;
  }, [unlocked]);

  if (!user) return null;

  const pointsInLevel = stats.points % 1000;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Trophy className="h-6 w-6 text-primary-foreground" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">الإنجازات والشارات</h1>
          <p className="text-sm text-muted-foreground">{unlocked.length} من {BADGES.length} شارة مفتوحة</p>
        </div>
      </div>

      {celebrate && (
        <Card className="p-4 bg-gradient-primary text-primary-foreground border-0 shadow-elevated animate-scale-in flex items-center gap-3">
          <Trophy className="h-6 w-6 animate-float" />
          <div>
            <div className="font-display font-extrabold">🎉 مبروك! فتحت شارة جديدة</div>
            <div className="text-sm opacity-90">{celebrate}</div>
          </div>
        </Card>
      )}

      <Card className="p-6 bg-gradient-hero text-primary-foreground border-0 shadow-elevated relative overflow-hidden">
        <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-primary-foreground/10 blur-2xl" />
        <div className="relative grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{stats.points}</div>
            <div className="text-xs opacity-80 font-semibold mt-1">نقطة</div>
          </div>
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{stats.level}</div>
            <div className="text-xs opacity-80 font-semibold mt-1">مستوى</div>
          </div>
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{unlocked.length}</div>
            <div className="text-xs opacity-80 font-semibold mt-1">شارة</div>
          </div>
        </div>
        <div className="relative mt-5">
          <Progress value={(pointsInLevel / 1000) * 100} className="h-2.5 bg-primary-foreground/20" />
          <div className="flex justify-between text-[11px] font-semibold mt-1.5 opacity-90">
            <span>{pointsInLevel} / 1000</span>
            <span>المستوى {stats.level + 1} 🎯</span>
          </div>
        </div>
      </Card>

      {standing && standing.total > 0 && (
        <Card className="p-4 bg-gradient-card border-border/60 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center">
            <Users className="h-5 w-5 text-primary-foreground" />
          </div>
          <p className="text-sm font-semibold">
            أنت ضمن أفضل {Math.max(1, 100 - standing.percentile)}% من الطلاب
            <span className="text-muted-foreground font-normal"> (من {standing.total} طالب)</span>
          </p>
        </Card>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BADGES.map((b, i) => {
          const val = Math.min(b.value(stats), b.goal);
          const isUnlocked = val >= b.goal;
          return (
            <Card
              key={i}
              onClick={() => setSelected(b)}
              className={cn(
                "p-5 text-center transition-smooth border-border/60 cursor-pointer card-hover",
                isUnlocked ? "bg-gradient-card" : "opacity-60 grayscale hover:opacity-90"
              )}
            >
              <div className={cn(
                "h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-md",
                isUnlocked ? `bg-gradient-to-br ${b.gradient}` : "bg-muted"
              )}>
                <b.icon className={cn("h-8 w-8", isUnlocked ? "text-primary-foreground" : "text-muted-foreground")} />
              </div>
              <h3 className="font-display font-bold text-sm mb-1">{b.title}</h3>
              <p className="text-[11px] text-muted-foreground leading-snug mb-2">{b.criteria}</p>
              <Progress value={(val / b.goal) * 100} className="h-1.5" />
              <p className="text-[11px] text-muted-foreground mt-1.5 font-semibold">{val}/{b.goal} {b.unit}</p>
              {isUnlocked && <Badge className="mt-2 bg-success/15 text-success hover:bg-success/20 border-0 text-[10px] font-bold">✓ مفتوحة</Badge>}
            </Card>
          );
        })}
      </div>

      <Dialog open={!!selected} onOpenChange={(o) => !o && setSelected(null)}>
        <DialogContent className="max-w-md" dir="rtl">
          {selected && (
            <>
              <DialogHeader>
                <div className={cn("h-16 w-16 rounded-2xl mx-auto mb-2 flex items-center justify-center shadow-md bg-gradient-to-br", selected.gradient)}>
                  <selected.icon className="h-8 w-8 text-primary-foreground" />
                </div>
                <DialogTitle className="text-center font-display">{selected.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-right">
                <p className="text-sm text-muted-foreground">{selected.desc}</p>
                <div className="rounded-xl bg-muted/60 p-3">
                  <p className="text-xs font-bold mb-1">شرط الفتح</p>
                  <p className="text-sm">{selected.criteria}</p>
                </div>
                <div>
                  <div className="flex justify-between text-xs font-semibold mb-1.5">
                    <span>تقدمك</span>
                    <span>{Math.min(selected.value(stats), selected.goal)}/{selected.goal} {selected.unit}</span>
                  </div>
                  <Progress value={(Math.min(selected.value(stats), selected.goal) / selected.goal) * 100} className="h-2.5" />
                </div>
                <div className="rounded-xl bg-primary/10 p-3">
                  <p className="text-xs font-bold mb-1 text-primary">💡 نصيحة</p>
                  <p className="text-sm">{selected.tip}</p>
                </div>
                {selected.value(stats) >= selected.goal && (
                  <Badge className="bg-success/15 text-success border-0 font-bold">✓ شارة مفتوحة</Badge>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

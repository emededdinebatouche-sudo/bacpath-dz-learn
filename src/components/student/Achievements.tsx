import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useApp } from "@/lib/state";
import { Trophy, Flame, Star, Award, Target, Crown, Zap, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const BADGES = [
  { icon: Flame, title: "سلسلة الأسبوع", desc: "ادرس 7 أيام متتالية", unlocked: true, gradient: "from-orange-500 to-rose-600" },
  { icon: Star, title: "نجم البداية", desc: "أكمل أول 10 تمارين", unlocked: true, gradient: "from-amber-400 to-yellow-500" },
  { icon: Award, title: "متفوق الرياضيات", desc: "اجمع 500 نقطة في الرياضيات", unlocked: true, gradient: "from-blue-500 to-indigo-600" },
  { icon: BookOpen, title: "قارئ نهم", desc: "احضر 5 دروس مباشرة", unlocked: true, gradient: "from-emerald-500 to-teal-600" },
  { icon: Target, title: "مصوّب دقيق", desc: "احصل على 100% في تمرين", unlocked: false, gradient: "from-violet-500 to-purple-600" },
  { icon: Zap, title: "طاقة عالية", desc: "اجمع 2000 نقطة", unlocked: false, gradient: "from-pink-500 to-rose-600" },
  { icon: Crown, title: "ملك البكالوريا", desc: "وصول للمستوى 10", unlocked: false, gradient: "from-yellow-400 to-amber-600" },
  { icon: Trophy, title: "أسطورة", desc: "30 يوم متتالي من الدراسة", unlocked: false, gradient: "from-fuchsia-500 to-purple-700" },
];

export default function Achievements() {
  const { user } = useApp();
  if (!user) return null;
  const unlocked = BADGES.filter(b => b.unlocked).length;

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Trophy className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">الإنجازات والشارات</h1>
          <p className="text-sm text-muted-foreground">{unlocked} من {BADGES.length} شارة مفتوحة</p>
        </div>
      </div>

      <Card className="p-6 bg-gradient-hero text-white border-0 shadow-elevated relative overflow-hidden">
        <div className="absolute -top-8 -left-8 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
        <div className="relative grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{user.points}</div>
            <div className="text-xs text-white/80 font-semibold mt-1">نقطة</div>
          </div>
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{user.level}</div>
            <div className="text-xs text-white/80 font-semibold mt-1">مستوى</div>
          </div>
          <div>
            <div className="font-display text-3xl md:text-4xl font-extrabold">{unlocked}</div>
            <div className="text-xs text-white/80 font-semibold mt-1">شارة</div>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {BADGES.map((b, i) => (
          <Card key={i} className={cn(
            "p-5 text-center transition-smooth border-border/60",
            b.unlocked ? "card-hover bg-gradient-card" : "opacity-60 grayscale"
          )}>
            <div className={cn(
              "h-16 w-16 rounded-2xl mx-auto mb-3 flex items-center justify-center shadow-md",
              b.unlocked ? `bg-gradient-to-br ${b.gradient}` : "bg-muted"
            )}>
              <b.icon className={cn("h-8 w-8", b.unlocked ? "text-white" : "text-muted-foreground")} />
            </div>
            <h3 className="font-display font-bold text-sm mb-1">{b.title}</h3>
            <p className="text-[11px] text-muted-foreground leading-snug">{b.desc}</p>
            {b.unlocked && <Badge className="mt-2 bg-success/15 text-success hover:bg-success/20 border-0 text-[10px] font-bold">✓ مفتوحة</Badge>}
          </Card>
        ))}
      </div>
    </div>
  );
}

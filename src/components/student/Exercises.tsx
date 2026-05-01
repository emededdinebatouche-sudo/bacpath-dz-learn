import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, SUBJECT_META, Subject } from "@/lib/state";
import { BookOpen, Zap, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Exercise = { id: string; title: string; subject: Subject; difficulty: "سهل" | "متوسط" | "صعب"; questions: number; points: number; };

const EXERCISES: Exercise[] = [
  { id: "e1", title: "النهايات والاتصال — تمارين شاملة", subject: "math", difficulty: "متوسط", questions: 12, points: 60 },
  { id: "e2", title: "الاشتقاق وتطبيقاته", subject: "math", difficulty: "صعب", questions: 8, points: 80 },
  { id: "e3", title: "حساب المثلثات", subject: "math", difficulty: "سهل", questions: 15, points: 40 },
  { id: "e4", title: "الحقل المغناطيسي", subject: "physics", difficulty: "متوسط", questions: 10, points: 55 },
  { id: "e5", title: "الموجات الميكانيكية", subject: "physics", difficulty: "صعب", questions: 8, points: 75 },
  { id: "e6", title: "التفاعلات الكيميائية", subject: "chemistry", difficulty: "متوسط", questions: 10, points: 50 },
  { id: "e7", title: "الكيمياء العضوية — الأساسيات", subject: "chemistry", difficulty: "سهل", questions: 12, points: 35 },
  { id: "e8", title: "الحرب العالمية الثانية", subject: "history", difficulty: "متوسط", questions: 14, points: 45 },
  { id: "e9", title: "الثورة الجزائرية: المراحل الكبرى", subject: "history", difficulty: "صعب", questions: 16, points: 70 },
];

const DIFF_COLORS: Record<Exercise["difficulty"], string> = {
  "سهل": "bg-success/15 text-success border-success/30",
  "متوسط": "bg-warning/15 text-warning border-warning/30",
  "صعب": "bg-destructive/15 text-destructive border-destructive/30",
};

export default function Exercises() {
  const { addPoints } = useApp();
  const [filter, setFilter] = useState<Subject | "all">("all");
  const filtered = filter === "all" ? EXERCISES : EXERCISES.filter(e => e.subject === filter);

  const handleStart = (e: Exercise) => {
    addPoints(e.points);
    toast.success(`تمت إضافة +${e.points} نقطة!`, { description: `أكملت: ${e.title}` });
  };

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <BookOpen className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">مكتبة التمارين</h1>
          <p className="text-sm text-muted-foreground">{filtered.length} تمرين متاح</p>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1">
        <FilterChip active={filter === "all"} onClick={() => setFilter("all")} label="الكل" emoji="📚" />
        {(Object.keys(SUBJECT_META) as Subject[]).map(s => (
          <FilterChip key={s} active={filter === s} onClick={() => setFilter(s)} label={SUBJECT_META[s].label} emoji={SUBJECT_META[s].emoji} />
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {filtered.map(ex => {
          const meta = SUBJECT_META[ex.subject];
          return (
            <Card key={ex.id} className="p-5 bg-gradient-card border-border/60 card-hover">
              <div className="flex items-start gap-3 mb-3">
                <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl flex-shrink-0`}>
                  {meta.emoji}
                </div>
                <div className="flex-1 min-w-0">
                  <Badge variant="secondary" className="text-[10px] font-bold mb-1">{meta.label}</Badge>
                  <h3 className="font-display font-bold text-base leading-snug">{ex.title}</h3>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-4 text-xs">
                <Badge variant="outline" className={cn("font-bold", DIFF_COLORS[ex.difficulty])}>{ex.difficulty}</Badge>
                <span className="text-muted-foreground font-semibold">{ex.questions} سؤال</span>
                <span className="text-muted-foreground">·</span>
                <span className="font-bold text-warning flex items-center gap-1"><Zap className="h-3 w-3" />+{ex.points}</span>
              </div>
              <Button onClick={() => handleStart(ex)} className="w-full bg-gradient-primary hover:opacity-95 gap-1">
                ابدأ التمرين <ChevronLeft className="h-4 w-4" />
              </Button>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

function FilterChip({ active, onClick, label, emoji }: { active: boolean; onClick: () => void; label: string; emoji: string }) {
  return (
    <button onClick={onClick} className={cn(
      "flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-smooth border",
      active ? "bg-gradient-primary text-white border-transparent shadow-primary" : "bg-card text-muted-foreground border-border hover:border-primary/40"
    )}>
      <span>{emoji}</span> {label}
    </button>
  );
}

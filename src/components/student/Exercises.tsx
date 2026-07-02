import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp } from "@/lib/state";
import { BookOpen, Zap, ChevronLeft, Clock, Check, X, Eye, Square, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

type Exercise = {
  id: string;
  title: string;
  subject: string;
  difficulty: "سهل" | "متوسط" | "صعب";
  content: string;
  solution: string;
  points: number;
  duration: number;
};

const DIFF_COLORS: Record<Exercise["difficulty"], string> = {
  "سهل": "bg-success/15 text-success border-success/30",
  "متوسط": "bg-warning/15 text-warning border-warning/30",
  "صعب": "bg-destructive/15 text-destructive border-destructive/30",
};

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beep = (f: number, s: number, d: number) => {
      const o = ctx.createOscillator(); const g = ctx.createGain();
      o.frequency.value = f; o.type = "sine"; o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + s);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + s + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + s + d);
      o.start(ctx.currentTime + s); o.stop(ctx.currentTime + s + d);
    };
    beep(880, 0, 0.4); beep(660, 0.5, 0.4); beep(880, 1.0, 0.6);
  } catch {}
}

export default function Exercises() {
  const { addPoints } = useApp();
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [subjectFilter, setSubjectFilter] = useState<string>("all");
  const [diffFilter, setDiffFilter] = useState<string>("all");

  const [active, setActive] = useState<Exercise | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [showSolution, setShowSolution] = useState(false);
  const startedAt = useRef<number | null>(null);
  const beeped = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("exercises" as any).select("*").order("created_at", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();

    const channel = supabase
      .channel("exercises-rt")
      .on("postgres_changes", { event: "*", schema: "public", table: "exercises" }, () => {
        supabase.from("exercises" as any).select("*").order("created_at", { ascending: false })
          .then(({ data }) => setItems((data as any) || []));
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  useEffect(() => {
    if (!active) return;
    const i = setInterval(() => {
      if (startedAt.current) setElapsed(Math.floor((Date.now() - startedAt.current) / 1000));
    }, 250);
    return () => clearInterval(i);
  }, [active]);

  const plannedSec = active ? active.duration * 60 : 0;
  const remaining = Math.max(0, plannedSec - elapsed);
  const overtime = !!(active && elapsed > plannedSec);
  const warn = !overtime && remaining <= 300 && remaining > 0;

  useEffect(() => {
    if (active && plannedSec > 0 && elapsed >= plannedSec && !beeped.current) {
      beeped.current = true;
      playBeep();
      toast.warning("انتهى الوقت!");
    }
  }, [elapsed, plannedSec, active]);

  const subjects = useMemo(() => Array.from(new Set(items.map(i => i.subject))).sort(), [items]);
  const filtered = items.filter(i =>
    (subjectFilter === "all" || i.subject === subjectFilter) &&
    (diffFilter === "all" || i.difficulty === diffFilter)
  );

  const start = (ex: Exercise) => {
    setActive(ex); setElapsed(0); setShowSolution(false);
    startedAt.current = Date.now(); beeped.current = false;
  };
  const cancel = () => {
    setActive(null); setElapsed(0); setShowSolution(false);
    startedAt.current = null; beeped.current = false;
  };

  const markCorrect = async () => {
    if (!active) return;
    await addPoints(active.points);
    toast.success(`أحسنت! +${active.points} نقطة 🎉`, { description: active.title });
    cancel();
  };
  const markWrong = () => {
    toast.info("لا بأس، يمكنك المحاولة لاحقاً 💪", { description: active?.title });
    cancel();
  };

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const timerColor = overtime ? "text-destructive" : warn ? "text-warning" : "text-primary";

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

      <div className="grid grid-cols-2 gap-3">
        <Select value={subjectFilter} onValueChange={setSubjectFilter}>
          <SelectTrigger><SelectValue placeholder="المادة" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المواد</SelectItem>
            {subjects.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={diffFilter} onValueChange={setDiffFilter}>
          <SelectTrigger><SelectValue placeholder="المستوى" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل المستويات</SelectItem>
            {(["سهل", "متوسط", "صعب"] as const).map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد تمارين بعد. سيقوم الأستاذ أو الإدارة بإضافتها قريباً.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-4">
          {filtered.map(ex => (
            <Card key={ex.id} className="p-5 bg-gradient-card border-border/60 card-hover">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge variant="secondary" className="text-[10px] font-bold">{ex.subject}</Badge>
                <Badge variant="outline" className={cn("text-[10px] font-bold", DIFF_COLORS[ex.difficulty])}>{ex.difficulty}</Badge>
              </div>
              <h3 className="font-display font-bold text-base leading-snug mb-2">{ex.title}</h3>
              <div className="flex items-center gap-3 mb-4 text-xs">
                <span className="flex items-center gap-1 text-muted-foreground"><Clock className="h-3 w-3" />{ex.duration}د</span>
                <span className="font-bold text-warning flex items-center gap-1"><Zap className="h-3 w-3" />+{ex.points}</span>
              </div>
              <Button onClick={() => start(ex)} className="w-full bg-gradient-primary hover:opacity-95 gap-1">
                ابدأ التمرين <ChevronLeft className="h-4 w-4" />
              </Button>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) cancel(); }}>
        <DialogContent className="max-h-[92vh] overflow-y-auto">
          {active && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display">{active.title}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className={cn("text-center font-display font-extrabold text-5xl tabular-nums", timerColor)}>
                  {overtime ? `+${fmt(elapsed - plannedSec)}` : fmt(remaining)}
                </div>
                <p className="text-center text-xs text-muted-foreground">
                  {overtime ? "وقت إضافي" : warn ? "تبقى أقل من 5 دقائق ⚠️" : `من أصل ${active.duration} دقيقة`}
                </p>
                {active.content && (
                  <Card className="p-4 bg-muted/40 whitespace-pre-wrap text-sm">{active.content}</Card>
                )}
                <p className="text-center text-sm text-muted-foreground">
                  ✍️ حل التمرين على ورقة، ثم اطلع على الحل النموذجي
                </p>

                {showSolution && (
                  <Card className="p-4 bg-success/10 border-success/30 whitespace-pre-wrap text-sm">
                    <div className="font-bold text-success mb-2 flex items-center gap-1">
                      <Check className="h-4 w-4" /> الحل النموذجي
                    </div>
                    {active.solution || "لم يتم إضافة حل لهذا التمرين."}
                  </Card>
                )}
              </div>
              <DialogFooter className="gap-2 flex-col sm:flex-row">
                {!showSolution ? (
                  <>
                    <Button variant="outline" onClick={cancel} className="gap-1"><Square className="h-4 w-4" /> إلغاء</Button>
                    <Button onClick={() => setShowSolution(true)} className="bg-gradient-primary hover:opacity-95 gap-1">
                      <Eye className="h-4 w-4" /> اطلع على الحل
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="outline" onClick={markWrong} className="gap-1 border-destructive/40 text-destructive hover:bg-destructive/10">
                      <X className="h-4 w-4" /> أجبت خطأ
                    </Button>
                    <Button onClick={markCorrect} className="bg-success hover:bg-success/90 text-white gap-1">
                      <Check className="h-4 w-4" /> أجبت صح (+{active.points})
                    </Button>
                  </>
                )}
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <div className="pt-4 border-t border-border/60">
        <PastExams />
      </div>
    </div>
  );
}


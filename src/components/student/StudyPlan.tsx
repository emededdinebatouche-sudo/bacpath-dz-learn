import { useState, useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp, SUBJECT_META, Subject } from "@/lib/state";
import { Clock, Zap, Check, Calendar, Plus, Trash2, Play, Square } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const beep = (freq: number, start: number, dur: number) => {
      const o = ctx.createOscillator();
      const g = ctx.createGain();
      o.frequency.value = freq;
      o.type = "sine";
      o.connect(g); g.connect(ctx.destination);
      g.gain.setValueAtTime(0.0001, ctx.currentTime + start);
      g.gain.exponentialRampToValueAtTime(0.4, ctx.currentTime + start + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + start + dur);
      o.start(ctx.currentTime + start);
      o.stop(ctx.currentTime + start + dur);
    };
    beep(880, 0, 0.4); beep(660, 0.5, 0.4); beep(880, 1.0, 0.6);
  } catch {}
}

function computeAward(base: number, durationMin: number, elapsedSec: number) {
  const planned = durationMin * 60;
  if (elapsedSec < planned) return Math.round(base * 1.2);
  if (elapsedSec === planned) return base;
  const extraMin = Math.floor((elapsedSec - planned) / 60);
  const penaltyUnits = Math.floor(extraMin / 10);
  const factor = Math.max(0, 1 - penaltyUnits * 0.1);
  return Math.round(base * factor);
}

export default function StudyPlan() {
  const { tasks, completeTask, addTask, deleteTask } = useApp();
  const today = new Date().toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [duration, setDuration] = useState(30);

  // Timer state
  const [activeId, setActiveId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startedAtRef = useRef<number | null>(null);
  const beepedRef = useRef(false);

  useEffect(() => {
    if (!activeId) return;
    const i = setInterval(() => {
      if (startedAtRef.current) {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }
    }, 250);
    return () => clearInterval(i);
  }, [activeId]);

  const activeTask = tasks.find(t => t.id === activeId) || null;
  const plannedSec = activeTask ? activeTask.duration * 60 : 0;
  const remaining = Math.max(0, plannedSec - elapsed);
  const overtime = elapsed > plannedSec;

  useEffect(() => {
    if (activeTask && remaining === 0 && !beepedRef.current && elapsed >= plannedSec && plannedSec > 0) {
      beepedRef.current = true;
      playBeep();
      toast.warning("انتهى الوقت! اضغط إنهاء لإنهاء المهمة");
    }
  }, [remaining, activeTask, elapsed, plannedSec]);

  const handleStart = (id: string) => {
    setActiveId(id);
    setElapsed(0);
    startedAtRef.current = Date.now();
    beepedRef.current = false;
  };

  const handleStop = () => {
    setActiveId(null);
    setElapsed(0);
    startedAtRef.current = null;
    beepedRef.current = false;
  };

  const handleFinish = async () => {
    if (!activeTask) return;
    const award = computeAward(activeTask.points, activeTask.duration, elapsed);
    await completeTask(activeTask.id, award);
    toast.success(`أحسنت! +${award} نقطة 🎉`, { description: activeTask.title });
    handleStop();
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({ title: title.trim(), subject, duration, points: duration });
    setTitle(""); setDuration(30); setSubject("math");
    setOpen(false);
    toast.success("تمت إضافة المهمة ✅");
  };

  const total = tasks.reduce((s, t) => s + t.points, 0);
  const earned = tasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);

  const fmt = (s: number) => `${String(Math.floor(s / 60)).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
  const warn = !overtime && remaining <= 300 && remaining > 0;
  const timerColor = overtime ? "text-destructive" : warn ? "text-warning" : "text-primary";

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
            <Calendar className="h-6 w-6 text-white" />
          </div>
          <div>
            <h1 className="font-display text-2xl md:text-3xl font-extrabold">خطة اليوم الدراسية</h1>
            <p className="text-sm text-muted-foreground">{today}</p>
          </div>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-95 gap-2 shadow-primary">
              <Plus className="h-4 w-4" /> أضف مهمة
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle className="font-display">إضافة مهمة جديدة</DialogTitle></DialogHeader>
            <form onSubmit={handleAdd} className="space-y-3">
              <div>
                <Label>عنوان المهمة</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required maxLength={120} placeholder="مثال: مراجعة درس النهايات" />
              </div>
              <div>
                <Label>المادة</Label>
                <Select value={subject} onValueChange={(v) => setSubject(v as Subject)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {(Object.keys(SUBJECT_META) as Subject[]).map(s => (
                      <SelectItem key={s} value={s}>{SUBJECT_META[s].emoji} {SUBJECT_META[s].label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>المدة (دقيقة)</Label>
                <Input type="number" min={5} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                <p className="text-xs text-muted-foreground mt-1">النقاط تُحسب تلقائياً: {duration} نقطة (دقيقة = نقطة)</p>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95">حفظ المهمة</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {activeTask && (
        <Card className={cn("p-6 text-center border-2", warn ? "border-warning" : overtime ? "border-destructive" : "border-primary")}>
          <p className="text-sm text-muted-foreground font-semibold mb-1">جاري العمل على</p>
          <h3 className="font-display font-bold text-lg mb-3">{activeTask.title}</h3>
          <div className={cn("font-display font-extrabold text-6xl md:text-7xl tabular-nums mb-2", timerColor)}>
            {overtime ? `+${fmt(elapsed - plannedSec)}` : fmt(remaining)}
          </div>
          <p className="text-xs text-muted-foreground mb-4">
            {overtime ? "وقت إضافي - النقاط تنقص كل 10 دقائق" : warn ? "تبقى أقل من 5 دقائق ⚠️" : `من أصل ${activeTask.duration} دقيقة`}
          </p>
          <div className="flex gap-2 justify-center">
            <Button onClick={handleFinish} className="bg-gradient-primary hover:opacity-95 gap-2">
              <Check className="h-4 w-4" /> إنهاء
            </Button>
            <Button onClick={handleStop} variant="outline" className="gap-2">
              <Square className="h-4 w-4" /> إلغاء
            </Button>
          </div>
        </Card>
      )}

      <Card className="p-5 bg-gradient-hero text-white border-0 shadow-elevated">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-white/80 text-sm font-semibold">تقدمك اليوم</p>
            <div className="font-display text-3xl font-extrabold">{earned}/{total} نقطة</div>
          </div>
          <div className="text-right">
            <p className="text-white/80 text-sm font-semibold">المتبقي</p>
            <div className="font-display text-3xl font-extrabold">{tasks.filter(t => !t.done).length} مهام</div>
          </div>
        </div>
      </Card>

      {tasks.length === 0 ? (
        <Card className="p-8 text-center bg-gradient-card border-border/60 border-dashed">
          <div className="h-16 w-16 mx-auto rounded-2xl bg-gradient-primary flex items-center justify-center mb-4 shadow-primary">
            <Plus className="h-8 w-8 text-white" />
          </div>
          <h3 className="font-display font-bold text-lg mb-1">لا توجد مهام بعد</h3>
          <p className="text-sm text-muted-foreground mb-4">ابدأ بإضافة مهامك اليومية الخاصة بك</p>
          <Button onClick={() => setOpen(true)} className="bg-gradient-primary hover:opacity-95 gap-2">
            <Plus className="h-4 w-4" /> أضف أول مهمة
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {tasks.map(task => {
            const meta = SUBJECT_META[task.subject];
            const isActive = activeId === task.id;
            return (
              <Card key={task.id} className={cn(
                "p-4 md:p-5 border-border/60 transition-smooth",
                task.done ? "opacity-60 bg-muted/40" : "card-hover bg-gradient-card",
                isActive && "ring-2 ring-primary"
              )}>
                <div className="flex items-start gap-4">
                  <div className={cn("h-12 w-12 rounded-xl bg-gradient-to-br flex items-center justify-center text-2xl flex-shrink-0", meta.color)}>
                    {meta.emoji}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Badge variant="secondary" className="text-[10px] font-bold">{meta.label}</Badge>
                      <Badge variant="outline" className="text-[10px] gap-1"><Clock className="h-3 w-3" />{task.duration}د</Badge>
                      <Badge className="text-[10px] gap-1 bg-warning/15 text-warning hover:bg-warning/20 border-warning/30"><Zap className="h-3 w-3" />+{task.points}</Badge>
                    </div>
                    <h3 className={cn("font-display font-bold text-base md:text-lg", task.done && "line-through")}>{task.title}</h3>
                  </div>
                  <div className="flex flex-col gap-2 flex-shrink-0">
                    {task.done ? (
                      <div className="h-10 w-10 rounded-xl bg-success/15 text-success flex items-center justify-center">
                        <Check className="h-5 w-5" />
                      </div>
                    ) : isActive ? (
                      <Badge className="bg-primary text-primary-foreground">نشط</Badge>
                    ) : (
                      <Button onClick={() => handleStart(task.id)} size="sm" disabled={!!activeId} className="bg-gradient-primary hover:opacity-95 gap-1">
                        <Play className="h-3 w-3" /> ابدأ
                      </Button>
                    )}
                    <Button onClick={() => deleteTask(task.id)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive" disabled={isActive}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

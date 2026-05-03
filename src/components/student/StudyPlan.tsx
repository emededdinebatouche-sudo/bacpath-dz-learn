import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp, SUBJECT_META, Subject } from "@/lib/state";
import { Clock, Zap, Check, Calendar, Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudyPlan() {
  const { tasks, completeTask, addTask, deleteTask } = useApp();
  const today = new Date().toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState<Subject>("math");
  const [duration, setDuration] = useState(30);
  const [points, setPoints] = useState(20);

  const handleComplete = (id: string, title: string, points: number) => {
    completeTask(id);
    toast.success(`أحسنت! +${points} نقطة 🎉`, { description: title });
  };

  const handleAdd = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await addTask({ title: title.trim(), subject, duration, points });
    setTitle(""); setDuration(30); setPoints(20); setSubject("math");
    setOpen(false);
    toast.success("تمت إضافة المهمة ✅");
  };

  const total = tasks.reduce((s, t) => s + t.points, 0);
  const earned = tasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);

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
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>المدة (دقيقة)</Label>
                  <Input type="number" min={5} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
                <div>
                  <Label>النقاط</Label>
                  <Input type="number" min={5} max={200} value={points} onChange={e => setPoints(Number(e.target.value))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95">حفظ المهمة</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

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
            return (
              <Card key={task.id} className={cn(
                "p-4 md:p-5 border-border/60 transition-smooth",
                task.done ? "opacity-60 bg-muted/40" : "card-hover bg-gradient-card"
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
                    ) : (
                      <Button onClick={() => handleComplete(task.id, task.title, task.points)} size="sm" className="bg-gradient-primary hover:opacity-95">
                        إنهاء
                      </Button>
                    )}
                    <Button onClick={() => deleteTask(task.id)} size="icon" variant="ghost" className="h-8 w-8 text-muted-foreground hover:text-destructive">
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

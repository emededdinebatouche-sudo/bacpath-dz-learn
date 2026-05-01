import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useApp, SUBJECT_META } from "@/lib/state";
import { Clock, Zap, Check, Calendar } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

export default function StudyPlan() {
  const { tasks, completeTask, user } = useApp();
  const today = new Date().toLocaleDateString("ar-DZ", { weekday: "long", day: "numeric", month: "long" });

  const handleComplete = (id: string, title: string, points: number) => {
    completeTask(id);
    toast.success(`أحسنت! +${points} نقطة 🎉`, { description: title });
  };

  const total = tasks.reduce((s, t) => s + t.points, 0);
  const earned = tasks.filter(t => t.done).reduce((s, t) => s + t.points, 0);

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Calendar className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">خطة اليوم الدراسية</h1>
          <p className="text-sm text-muted-foreground">{today}</p>
        </div>
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
                {task.done ? (
                  <div className="h-10 w-10 rounded-xl bg-success/15 text-success flex items-center justify-center flex-shrink-0">
                    <Check className="h-5 w-5" />
                  </div>
                ) : (
                  <Button onClick={() => handleComplete(task.id, task.title, task.points)} size="sm" className="bg-gradient-primary hover:opacity-95 flex-shrink-0">
                    إنهاء
                  </Button>
                )}
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

import { useEffect, useMemo, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useApp } from "@/lib/state";
import { FileText, Loader2, ExternalLink, Play, Square, Clock, Check, X, BookMarked } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import type { PastExam } from "@/components/exams/PastExamsManager";

const BUCKET = "past-exams";
const ALL = "الكل";

function playBeep() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const o = ctx.createOscillator(); const g = ctx.createGain();
    o.connect(g); g.connect(ctx.destination);
    o.frequency.value = 880; o.type = "sine";
    g.gain.setValueAtTime(0.001, ctx.currentTime);
    g.gain.exponentialRampToValueAtTime(0.3, ctx.currentTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
    o.start(); o.stop(ctx.currentTime + 1.3);
  } catch {}
}

export default function PastExams() {
  const { user, addPoints } = useApp() as any;
  const [items, setItems] = useState<PastExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [year, setYear] = useState<string>(ALL);
  const [branch, setBranch] = useState<string>(ALL);
  const [subject, setSubject] = useState<string>(ALL);

  const [active, setActive] = useState<PastExam | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [running, setRunning] = useState(false);
  const [showSolution, setShowSolution] = useState(false);
  const intRef = useRef<number | null>(null);
  const beepedRef = useRef(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.from("past_exams" as any).select("*").order("year", { ascending: false });
      setItems((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const years = useMemo(() => [ALL, ...Array.from(new Set(items.map(i => String(i.year)))).sort((a, b) => Number(b) - Number(a))], [items]);
  const branches = useMemo(() => [ALL, ...Array.from(new Set(items.map(i => i.branch)))], [items]);
  const subjects = useMemo(() => [ALL, ...Array.from(new Set(items.map(i => i.subject)))], [items]);

  const filtered = items.filter(i =>
    (year === ALL || String(i.year) === year) &&
    (branch === ALL || i.branch === branch) &&
    (subject === ALL || i.subject === subject)
  );

  const openPdf = async (path: string) => {
    const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (error || !data) { toast.error("تعذر فتح الملف"); return; }
    window.open(data.signedUrl, "_blank", "noopener,noreferrer");
  };

  const startExam = async (ex: PastExam) => {
    setActive(ex); setElapsed(0); setRunning(true); setShowSolution(false); beepedRef.current = false;
    await openPdf(ex.exam_path);
  };

  useEffect(() => {
    if (!running) { if (intRef.current) window.clearInterval(intRef.current); return; }
    intRef.current = window.setInterval(() => {
      setElapsed(e => {
        const next = e + 1;
        if (active && !beepedRef.current && next >= active.duration * 60) {
          beepedRef.current = true; playBeep();
          toast.info("انتهى الوقت المخصص");
        }
        return next;
      });
    }, 1000);
    return () => { if (intRef.current) window.clearInterval(intRef.current); };
  }, [running, active]);

  const stopTimer = () => setRunning(false);

  const finish = async (correct: boolean) => {
    if (!active) return;
    const award = correct ? active.points : 0;
    if (award > 0 && addPoints) await addPoints(award);
    toast.success(correct ? `أحسنت! +${award} نقطة` : "لا بأس، حاول لاحقاً");
    setActive(null); setRunning(false); setElapsed(0); setShowSolution(false);
  };

  const totalSec = (active?.duration || 0) * 60;
  const remaining = Math.max(0, totalSec - elapsed);
  const overtime = elapsed > totalSec;
  const mm = String(Math.floor((overtime ? elapsed - totalSec : remaining) / 60)).padStart(2, "0");
  const ss = String((overtime ? elapsed - totalSec : remaining) % 60).padStart(2, "0");
  const warn = !overtime && remaining <= 5 * 60;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <BookMarked className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-lg">بكالوريات سابقة</h2>
        <Badge variant="secondary">{items.length}</Badge>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <Select value={year} onValueChange={setYear}>
          <SelectTrigger><SelectValue placeholder="السنة" /></SelectTrigger>
          <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y === ALL ? "كل السنوات" : y}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={branch} onValueChange={setBranch}>
          <SelectTrigger><SelectValue placeholder="الشعبة" /></SelectTrigger>
          <SelectContent>{branches.map(b => <SelectItem key={b} value={b}>{b === ALL ? "كل الشعب" : b}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={subject} onValueChange={setSubject}>
          <SelectTrigger><SelectValue placeholder="المادة" /></SelectTrigger>
          <SelectContent>{subjects.map(s => <SelectItem key={s} value={s}>{s === ALL ? "كل المواد" : s}</SelectItem>)}</SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد امتحانات مطابقة.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {filtered.map(ex => (
            <Card key={ex.id} className="p-4 bg-gradient-card border-border/60 hover:border-primary/40 transition-smooth">
              <div className="flex flex-wrap gap-1.5 mb-2">
                <Badge className="bg-gradient-primary text-white border-0 text-[10px] font-bold">{ex.year}</Badge>
                <Badge variant="outline" className="text-[10px] font-bold">{ex.branch}</Badge>
                <Badge variant="outline" className="text-[10px] font-bold">{ex.subject}</Badge>
                <Badge variant="outline" className="text-[10px]"><Clock className="h-2.5 w-2.5 ml-1" />{ex.duration}د</Badge>
                <Badge variant="outline" className="text-[10px] text-primary border-primary/30">{ex.points} نقطة</Badge>
              </div>
              {ex.title && <h3 className="font-display font-bold text-sm mb-2">{ex.title}</h3>}
              <div className="flex gap-2">
                <Button size="sm" onClick={() => startExam(ex)} className="bg-gradient-primary hover:opacity-95 gap-1 flex-1">
                  <Play className="h-3.5 w-3.5" /> ابدأ
                </Button>
                <Button size="sm" variant="outline" onClick={() => openPdf(ex.exam_path)} className="gap-1">
                  <ExternalLink className="h-3.5 w-3.5" /> عرض
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={!!active} onOpenChange={(o) => { if (!o) { setActive(null); setRunning(false); setElapsed(0); setShowSolution(false); } }}>
        <DialogContent className="max-w-md">
          <DialogHeader><DialogTitle className="font-display">{active?.year} — {active?.subject}</DialogTitle></DialogHeader>
          {active && (
            <div className="space-y-4">
              <div className="text-xs text-muted-foreground">{active.branch}{active.title ? ` • ${active.title}` : ""}</div>
              <div className={cn(
                "rounded-2xl p-6 text-center border-2 transition-smooth",
                overtime ? "border-destructive/50 bg-destructive/5" : warn ? "border-warning/50 bg-warning/5" : "border-primary/30 bg-primary/5"
              )}>
                <div className="text-xs text-muted-foreground mb-1">{overtime ? "وقت إضافي" : "الوقت المتبقي"}</div>
                <div className={cn("text-5xl font-black tabular-nums", overtime ? "text-destructive" : warn ? "text-warning" : "text-primary")}>
                  {mm}:{ss}
                </div>
                <div className="text-[10px] text-muted-foreground mt-1">المدة: {active.duration} دقيقة</div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button variant="outline" onClick={() => openPdf(active.exam_path)} className="gap-1">
                  <FileText className="h-4 w-4" /> الموضوع
                </Button>
                <Button
                  variant="outline"
                  disabled={!active.solution_path}
                  onClick={async () => { setShowSolution(true); if (active.solution_path) await openPdf(active.solution_path); }}
                  className="gap-1"
                >
                  <FileText className="h-4 w-4" /> {active.solution_path ? "التصحيح" : "لا يوجد تصحيح"}
                </Button>
              </div>

              {running ? (
                <Button variant="outline" onClick={stopTimer} className="w-full gap-2">
                  <Square className="h-4 w-4" /> إيقاف المؤقت
                </Button>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  <Button onClick={() => finish(true)} className="bg-gradient-primary hover:opacity-95 gap-1">
                    <Check className="h-4 w-4" /> أجبت صح
                  </Button>
                  <Button variant="outline" onClick={() => finish(false)} className="gap-1">
                    <X className="h-4 w-4" /> أجبت خطأ
                  </Button>
                </div>
              )}
              {running && showSolution && (
                <p className="text-[11px] text-muted-foreground text-center">أوقف المؤقت لتأكيد النتيجة والحصول على النقاط.</p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

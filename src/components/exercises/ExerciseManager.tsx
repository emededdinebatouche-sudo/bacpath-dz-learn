import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Pencil, Trash2, Loader2, BookOpen } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export type Exercise = {
  id: string;
  created_by: string;
  title: string;
  subject: string;
  difficulty: "سهل" | "متوسط" | "صعب";
  content: string;
  points: number;
  duration: number;
  created_at: string;
};

const DIFFS: Exercise["difficulty"][] = ["سهل", "متوسط", "صعب"];
const DIFF_COLORS: Record<Exercise["difficulty"], string> = {
  "سهل": "bg-success/15 text-success border-success/30",
  "متوسط": "bg-warning/15 text-warning border-warning/30",
  "صعب": "bg-destructive/15 text-destructive border-destructive/30",
};

export default function ExerciseManager() {
  const { user } = useApp();
  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Exercise | null>(null);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [difficulty, setDifficulty] = useState<Exercise["difficulty"]>("متوسط");
  const [content, setContent] = useState("");
  const [points, setPoints] = useState(30);
  const [duration, setDuration] = useState(30);

  const reset = () => {
    setEditing(null);
    setTitle(""); setSubject(""); setDifficulty("متوسط"); setContent(""); setPoints(30); setDuration(30);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("exercises" as any).select("*").order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const openEdit = (ex: Exercise) => {
    setEditing(ex);
    setTitle(ex.title); setSubject(ex.subject); setDifficulty(ex.difficulty);
    setContent(ex.content); setPoints(ex.points); setDuration(ex.duration);
    setOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!title.trim() || !subject.trim()) { toast.error("العنوان والمادة مطلوبان"); return; }

    if (editing) {
      const { error } = await supabase.from("exercises" as any).update({
        title: title.trim(), subject: subject.trim(), difficulty, content, points, duration,
      }).eq("id", editing.id);
      if (error) { toast.error(error.message); return; }
      toast.success("تم تحديث التمرين");
    } else {
      const { error } = await supabase.from("exercises" as any).insert({
        created_by: user.id, title: title.trim(), subject: subject.trim(), difficulty, content, points, duration,
      });
      if (error) { toast.error(error.message); return; }
      toast.success("تمت إضافة التمرين");
    }
    setOpen(false); reset(); load();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("حذف هذا التمرين؟")) return;
    const { error } = await supabase.from("exercises" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    setItems(prev => prev.filter(x => x.id !== id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">إدارة التمارين</h2>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-95 gap-2"><Plus className="h-4 w-4" /> تمرين جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editing ? "تعديل التمرين" : "تمرين جديد"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <Label>عنوان التمرين</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} required maxLength={150} />
              </div>
              <div>
                <Label>المادة</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} required placeholder="مثال: الرياضيات، الفيزياء..." />
              </div>
              <div>
                <Label>المستوى</Label>
                <Select value={difficulty} onValueChange={(v) => setDifficulty(v as Exercise["difficulty"])}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {DIFFS.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>محتوى التمرين / السؤال</Label>
                <Textarea value={content} onChange={e => setContent(e.target.value)} rows={5} placeholder="اكتب نص التمرين أو السؤال..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>النقاط</Label>
                  <Input type="number" min={1} max={500} value={points} onChange={e => setPoints(Number(e.target.value))} />
                </div>
                <div>
                  <Label>المدة (دقيقة)</Label>
                  <Input type="number" min={1} max={300} value={duration} onChange={e => setDuration(Number(e.target.value))} />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95">{editing ? "حفظ التغييرات" : "إضافة"}</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد تمارين بعد. أضف أول تمرين 🚀</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(ex => {
            const canEdit = user?.role === "admin" || (user?.role === "teacher" && ex.created_by === user.id);
            return (
              <Card key={ex.id} className="p-4 bg-gradient-card border-border/60">
                <div className="flex items-start gap-2 mb-2">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap gap-1.5 mb-1">
                      <Badge variant="secondary" className="text-[10px] font-bold">{ex.subject}</Badge>
                      <Badge variant="outline" className={cn("text-[10px] font-bold", DIFF_COLORS[ex.difficulty])}>{ex.difficulty}</Badge>
                      <Badge variant="outline" className="text-[10px]">{ex.points} نقطة • {ex.duration}د</Badge>
                    </div>
                    <h3 className="font-display font-bold text-sm leading-snug">{ex.title}</h3>
                    {ex.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{ex.content}</p>}
                  </div>
                  {canEdit && (
                    <div className="flex flex-col gap-1">
                      <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ex)}><Pencil className="h-3.5 w-3.5" /></Button>
                      <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ex.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

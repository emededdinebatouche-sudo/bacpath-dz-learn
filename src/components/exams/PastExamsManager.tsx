import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Trash2, Loader2, FileText, Pencil } from "lucide-react";
import { toast } from "sonner";

export type PastExam = {
  id: string;
  created_by: string;
  year: number;
  branch: string;
  subject: string;
  title: string | null;
  exam_path: string;
  solution_path: string | null;
  points: number;
  duration: number;
  created_at: string;
};

const BUCKET = "past-exams";

export default function PastExamsManager() {
  const { user } = useApp();
  const [items, setItems] = useState<PastExam[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<PastExam | null>(null);
  const [saving, setSaving] = useState(false);

  const [year, setYear] = useState<number>(new Date().getFullYear() - 1);
  const [branch, setBranch] = useState("");
  const [subject, setSubject] = useState("");
  const [title, setTitle] = useState("");
  const [duration, setDuration] = useState(120);
  const [points, setPoints] = useState(50);
  const [examFile, setExamFile] = useState<File | null>(null);
  const [solutionFile, setSolutionFile] = useState<File | null>(null);

  const reset = () => {
    setEditing(null); setBranch(""); setSubject(""); setTitle("");
    setDuration(120); setPoints(50); setExamFile(null); setSolutionFile(null);
    setYear(new Date().getFullYear() - 1);
  };

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("past_exams" as any).select("*").order("year", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };
  useEffect(() => { load(); }, []);

  const openEdit = (ex: PastExam) => {
    setEditing(ex);
    setYear(ex.year); setBranch(ex.branch); setSubject(ex.subject);
    setTitle(ex.title || ""); setDuration(ex.duration); setPoints(ex.points);
    setOpen(true);
  };

  const uploadPdf = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "pdf";
    const path = `${user!.id}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
      contentType: file.type || "application/pdf",
    });
    if (error) throw error;
    return path;
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!branch.trim() || !subject.trim()) { toast.error("الشعبة والمادة مطلوبتان"); return; }
    if (!editing && !examFile) { toast.error("ملف الموضوع (PDF) مطلوب"); return; }
    setSaving(true);
    try {
      let exam_path = editing?.exam_path || "";
      let solution_path: string | null = editing?.solution_path || null;
      if (examFile) exam_path = await uploadPdf(examFile);
      if (solutionFile) solution_path = await uploadPdf(solutionFile);

      const payload = {
        year, branch: branch.trim(), subject: subject.trim(),
        title: title.trim() || null, exam_path, solution_path,
        points, duration,
      };
      if (editing) {
        const { error } = await supabase.from("past_exams" as any).update(payload).eq("id", editing.id);
        if (error) throw error;
        toast.success("تم التحديث");
      } else {
        const { error } = await supabase.from("past_exams" as any).insert({ ...payload, created_by: user.id });
        if (error) throw error;
        toast.success("تمت إضافة الامتحان");
      }
      setOpen(false); reset(); load();
    } catch (err: any) {
      toast.error(err.message || "فشل الحفظ");
    } finally { setSaving(false); }
  };

  const handleDelete = async (ex: PastExam) => {
    if (!confirm("حذف هذا الامتحان؟")) return;
    const paths = [ex.exam_path, ex.solution_path].filter(Boolean) as string[];
    if (paths.length) await supabase.storage.from(BUCKET).remove(paths);
    const { error } = await supabase.from("past_exams" as any).delete().eq("id", ex.id);
    if (error) { toast.error(error.message); return; }
    toast.success("تم الحذف");
    setItems(prev => prev.filter(x => x.id !== ex.id));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <FileText className="h-5 w-5 text-primary" />
          <h2 className="font-display font-bold text-lg">بكالوريات سابقة</h2>
          <Badge variant="secondary">{items.length}</Badge>
        </div>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-95 gap-2"><Plus className="h-4 w-4" /> امتحان جديد</Button>
          </DialogTrigger>
          <DialogContent className="max-h-[90vh] overflow-y-auto">
            <DialogHeader><DialogTitle className="font-display">{editing ? "تعديل امتحان" : "امتحان بكالوريا جديد"}</DialogTitle></DialogHeader>
            <form onSubmit={handleSave} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label>السنة</Label>
                  <Input type="number" value={year} onChange={e => setYear(Number(e.target.value))} min={1990} max={2100} required />
                </div>
                <div>
                  <Label>المدة (دقيقة)</Label>
                  <Input type="number" value={duration} onChange={e => setDuration(Number(e.target.value))} min={10} required />
                </div>
              </div>
              <div>
                <Label>الشعبة</Label>
                <Input value={branch} onChange={e => setBranch(e.target.value)} placeholder="مثال: علوم تجريبية، رياضيات، آداب..." required />
              </div>
              <div>
                <Label>المادة</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="مثال: الرياضيات، الفيزياء..." required />
              </div>
              <div>
                <Label>عنوان اختياري</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="مثال: الدورة العادية" />
              </div>
              <div>
                <Label>النقاط عند الإنجاز</Label>
                <Input type="number" value={points} onChange={e => setPoints(Number(e.target.value))} min={0} required />
              </div>
              <div>
                <Label>ملف الموضوع (PDF) {editing && <span className="text-xs text-muted-foreground">— اترك فارغاً للإبقاء على الحالي</span>}</Label>
                <Input type="file" accept="application/pdf" onChange={e => setExamFile(e.target.files?.[0] || null)} />
              </div>
              <div>
                <Label>ملف التصحيح (PDF) — اختياري</Label>
                <Input type="file" accept="application/pdf" onChange={e => setSolutionFile(e.target.files?.[0] || null)} />
              </div>
              <DialogFooter>
                <Button type="submit" disabled={saving} className="w-full bg-gradient-primary hover:opacity-95">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : editing ? "حفظ التغييرات" : "إضافة"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد امتحانات بعد.</Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-3">
          {items.map(ex => (
            <Card key={ex.id} className="p-4 bg-gradient-card border-border/60">
              <div className="flex items-start gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap gap-1.5 mb-1">
                    <Badge variant="secondary" className="text-[10px] font-bold">{ex.year}</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold">{ex.branch}</Badge>
                    <Badge variant="outline" className="text-[10px] font-bold">{ex.subject}</Badge>
                    <Badge variant="outline" className="text-[10px]">{ex.points} نقطة • {ex.duration}د</Badge>
                    {ex.solution_path && <Badge variant="outline" className="text-[10px] text-success border-success/30">تصحيح ✓</Badge>}
                  </div>
                  {ex.title && <h3 className="font-display font-bold text-sm">{ex.title}</h3>}
                </div>
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(ex)}><Pencil className="h-3.5 w-3.5" /></Button>
                  <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => handleDelete(ex)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

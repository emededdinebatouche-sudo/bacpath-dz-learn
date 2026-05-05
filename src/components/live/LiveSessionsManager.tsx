import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Plus, Pencil, Trash2, Calendar, ExternalLink, Video } from "lucide-react";
import { toast } from "sonner";

export type LiveSession = {
  id: string;
  created_by: string;
  title: string;
  subject: string;
  scheduled_at: string;
  stream_link: string;
  status: string;
};

const DURATION_MS = 90 * 60 * 1000; // a session is "live" for 90 min after scheduled_at

export function getSessionState(s: LiveSession): "live" | "upcoming" | "past" {
  if (s.status === "cancelled") return "past";
  const t = new Date(s.scheduled_at).getTime();
  const now = Date.now();
  if (now >= t && now <= t + DURATION_MS) return "live";
  if (now < t) return "upcoming";
  return "past";
}

export default function LiveSessionsManager() {
  const { user } = useApp();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<LiveSession | null>(null);
  const [form, setForm] = useState({ title: "", subject: "", scheduled_at: "", stream_link: "" });

  const load = async () => {
    const { data } = await supabase.from("live_sessions" as any).select("*").order("scheduled_at", { ascending: true });
    setSessions((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("live_sessions_admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const reset = () => { setEditing(null); setForm({ title: "", subject: "", scheduled_at: "", stream_link: "" }); };

  const openNew = () => { reset(); setOpen(true); };
  const openEdit = (s: LiveSession) => {
    setEditing(s);
    setForm({
      title: s.title,
      subject: s.subject,
      scheduled_at: new Date(s.scheduled_at).toISOString().slice(0, 16),
      stream_link: s.stream_link,
    });
    setOpen(true);
  };

  const save = async () => {
    if (!user) return;
    if (!form.title || !form.subject || !form.scheduled_at || !form.stream_link) {
      toast.error("يرجى ملء كل الحقول");
      return;
    }
    const payload = {
      title: form.title,
      subject: form.subject,
      scheduled_at: new Date(form.scheduled_at).toISOString(),
      stream_link: form.stream_link,
    };
    if (editing) {
      const { error } = await supabase.from("live_sessions" as any).update(payload).eq("id", editing.id);
      if (error) return toast.error(error.message);
      toast.success("تم تحديث الحصة");
    } else {
      const { error } = await supabase.from("live_sessions" as any).insert({ ...payload, created_by: user.id, status: "scheduled" });
      if (error) return toast.error(error.message);
      toast.success("تمت جدولة الحصة");
    }
    setOpen(false); reset(); load();
  };

  const cancel = async (s: LiveSession) => {
    const { error } = await supabase.from("live_sessions" as any).update({ status: "cancelled" }).eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("تم إلغاء الحصة");
    load();
  };

  const remove = async (s: LiveSession) => {
    const { error } = await supabase.from("live_sessions" as any).delete().eq("id", s.id);
    if (error) return toast.error(error.message);
    toast.success("تم الحذف");
    load();
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="font-display font-bold text-lg flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> الحصص المباشرة</h2>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) reset(); }}>
          <DialogTrigger asChild>
            <Button onClick={openNew} className="bg-gradient-primary gap-2"><Plus className="h-4 w-4" /> جدولة حصة</Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader><DialogTitle>{editing ? "تعديل الحصة" : "جدولة حصة جديدة"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>العنوان</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div><Label>المادة</Label><Input value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} placeholder="مثال: الرياضيات" /></div>
              <div><Label>التاريخ والوقت</Label><Input type="datetime-local" value={form.scheduled_at} onChange={e => setForm({ ...form, scheduled_at: e.target.value })} /></div>
              <div><Label>رابط البث</Label><Input value={form.stream_link} onChange={e => setForm({ ...form, stream_link: e.target.value })} placeholder="Meet / Zoom / YouTube..." /></div>
            </div>
            <DialogFooter><Button onClick={save} className="bg-gradient-primary">{editing ? "حفظ" : "جدولة"}</Button></DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {sessions.length === 0 && <p className="text-sm text-muted-foreground">لا توجد حصص مجدولة.</p>}

      {sessions.map(s => {
        const state = getSessionState(s);
        const canManage = user && (user.role === "admin" || (user.role === "teacher" && s.created_by === user.id));
        return (
          <Card key={s.id} className="p-4 bg-gradient-card border-border/60">
            <div className="flex items-start gap-3">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
                <Video className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-[10px]">{s.subject}</Badge>
                  {state === "live" && <Badge className="bg-destructive text-destructive-foreground text-[10px] gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />مباشر</Badge>}
                  {state === "upcoming" && <Badge variant="outline" className="text-[10px]">قادمة</Badge>}
                  {state === "past" && <Badge variant="outline" className="text-[10px]">{s.status === "cancelled" ? "ملغاة" : "منتهية"}</Badge>}
                </div>
                <h3 className="font-display font-bold text-sm">{s.title}</h3>
                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                  <Calendar className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString("ar-DZ")}
                </p>
                <a href={s.stream_link} target="_blank" rel="noreferrer" className="text-xs text-primary inline-flex items-center gap-1 mt-1 truncate max-w-full">
                  <ExternalLink className="h-3 w-3" /> {s.stream_link}
                </a>
              </div>
              {canManage && (
                <div className="flex flex-col gap-1">
                  <Button size="icon" variant="ghost" onClick={() => openEdit(s)}><Pencil className="h-4 w-4" /></Button>
                  {s.status !== "cancelled" && <Button size="icon" variant="ghost" onClick={() => cancel(s)} title="إلغاء"><Trash2 className="h-4 w-4" /></Button>}
                  {user?.role === "admin" && <Button size="icon" variant="ghost" onClick={() => remove(s)} title="حذف"><Trash2 className="h-4 w-4 text-destructive" /></Button>}
                </div>
              )}
            </div>
          </Card>
        );
      })}
    </div>
  );
}

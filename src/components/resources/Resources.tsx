import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useApp } from "@/lib/state";
import { safeResourceUrl } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ExternalLink, Heart, Library, Loader2, Pencil, Plus, Search, Trash2, Video } from "lucide-react";
import { toast } from "sonner";

type Resource = Tables<"learning_resources">;
const emptyForm = { title: "", subject: "", category: "channel", url: "", description: "" };

export default function Resources() {
  const { user } = useApp();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("all");
  const [subject, setSubject] = useState("all");
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Resource | null>(null);
  const [deleting, setDeleting] = useState<Resource | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [onlyFavorites, setOnlyFavorites] = useState(false);
  const staff = user?.role === "admin" || user?.role === "teacher";
  const isStudent = user?.role === "student";
  const load = useCallback(async () => {
    setLoading(true);
    const [{ data, error: loadError }, fav] = await Promise.all([
      supabase.from("learning_resources").select("*").order("created_at", { ascending: false }),
      user ? supabase.from("resource_favorites").select("resource_id").eq("user_id", user.id) : Promise.resolve({ data: [] as { resource_id: string }[] }),
    ]);
    setError(Boolean(loadError));
    if (data) setResources(data);
    setFavorites(new Set((fav.data ?? []).map(f => f.resource_id)));
    setLoading(false);
  }, [user?.id]);
  useEffect(() => { void load(); }, [load]);
  const edit = (resource?: Resource) => {
    setEditing(resource ?? null);
    setForm(resource ? { title: resource.title, subject: resource.subject, category: resource.category, url: resource.url, description: resource.description } : emptyForm);
    setOpen(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    const url = safeResourceUrl(form.url);
    if (!url) return toast.error("أدخل رابطاً صالحاً يبدأ بـ https:// أو http://");
    if (!form.title.trim()) return;
    setSaving(true);
    const values = { ...form, title: form.title.trim(), subject: form.subject.trim(), description: form.description.trim(), url };
    const result = editing
      ? await supabase.from("learning_resources").update(values).eq("id", editing.id).select().single()
      : await supabase.from("learning_resources").insert({ ...values, created_by: user.id }).select().single();
    setSaving(false);
    if (result.error) return toast.error("تعذر حفظ المصدر، حاول مجدداً");
    setOpen(false);
    toast.success("تم حفظ المصدر");
    void load();
  };
  const remove = async () => {
    if (!deleting || saving) return;
    setSaving(true);
    const { error: deleteError } = await supabase.from("learning_resources").delete().eq("id", deleting.id);
    setSaving(false);
    if (deleteError) return toast.error("تعذر حذف المصدر");
    setDeleting(null);
    toast.success("تم حذف المصدر");
    void load();
  };
  const toggleFavorite = async (id: string) => {
    if (!user) return;
    const previous = favorites;
    const has = previous.has(id);
    const next = new Set(previous);
    if (has) next.delete(id); else next.add(id);
    setFavorites(next);
    const { error: favError } = has
      ? await supabase.from("resource_favorites").delete().eq("user_id", user.id).eq("resource_id", id)
      : await supabase.from("resource_favorites").insert({ user_id: user.id, resource_id: id });
    if (favError) { setFavorites(previous); toast.error("تعذر تحديث المفضلة"); }
    else toast.success(has ? "أُزيل من المفضلة" : "حُفظ في المفضلة");
  };
  const filtered = resources.filter(r => (!onlyFavorites || favorites.has(r.id)) && (category === "all" || r.category === category) && (subject === "all" || r.subject === subject) && `${r.title} ${r.subject} ${r.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase()));

  return <div className="space-y-6 pb-24 animate-fade-in" dir="rtl">
    <header className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
      <h1 className="font-display text-3xl font-extrabold flex items-center gap-3"><Library className="h-8 w-8 text-primary" />مصادري</h1>
      {staff && <Button onClick={() => edit()} className="bg-gradient-primary"><Plus />إضافة مصدر</Button>}
    </header>
    <div className="flex flex-col sm:flex-row gap-3">
      {isStudent && <Button variant={onlyFavorites ? "default" : "outline"} aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(v => !v)} className={onlyFavorites ? "bg-gradient-primary" : ""}><Heart className={onlyFavorites ? "fill-current" : ""} />مفضلتي ({favorites.size})</Button>}
      <div className="relative flex-1"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="بحث في المصادر" placeholder="ابحث عن مصدر…" value={search} onChange={e => setSearch(e.target.value)} className="pr-9" /></div>
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="sm:w-44" aria-label="نوع المصدر"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المصادر</SelectItem><SelectItem value="channel">قنوات تعليمية</SelectItem><SelectItem value="exercise">تمارين</SelectItem></SelectContent></Select>
      <Select value={subject} onValueChange={setSubject}><SelectTrigger className="sm:w-44" aria-label="المادة"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المواد</SelectItem>{[...new Set(resources.map(r => r.subject).filter(Boolean))].sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    </div>
    {loading ? <div className="flex justify-center py-16" role="status" aria-label="تحميل المصادر"><Loader2 className="animate-spin text-primary" /></div> : error ? <div className="text-center py-12 space-y-3"><p>تعذر تحميل المصادر.</p><Button variant="outline" onClick={() => void load()}>إعادة المحاولة</Button></div> : filtered.length === 0 ? <div className="text-center py-16 space-y-3 text-muted-foreground"><Library className="h-12 w-12 mx-auto text-primary/50" /><p>{onlyFavorites ? "لم تحفظ أي مصدر بعد. اضغط على القلب لحفظه." : resources.length ? "لا توجد مصادر مطابقة لبحثك." : "لا توجد مصادر مضافة بعد."}</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map(r => {
        const url = safeResourceUrl(r.url);
        const editable = staff && (user?.role === "admin" || r.created_by === user?.id);
        const Icon = r.category === "channel" ? Video : BookOpen;
        return <Card key={r.id} className="p-5 rounded-lg flex flex-col gap-4 border-border/60 bg-gradient-card min-w-0">
          <div className="flex items-start gap-3"><div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h2 className="font-display text-lg font-bold break-words">{r.title}</h2><div className="flex gap-2 flex-wrap mt-2"><Badge variant="secondary">{r.category === "channel" ? "قناة تعليمية" : "تمارين"}</Badge>{r.subject && <Badge variant="outline">{r.subject}</Badge>}</div></div></div>
          {r.description && <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{r.description}</p>}
          {url && <p dir="ltr" className="text-xs text-muted-foreground truncate text-right">{new URL(url).hostname}</p>}
          <div className="flex items-center gap-2 mt-auto pt-2">{url && <Button asChild variant="outline" className="flex-1"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />فتح المصدر</a></Button>}{isStudent && <Button variant="ghost" size="icon" aria-pressed={favorites.has(r.id)} aria-label={favorites.has(r.id) ? `إزالة ${r.title} من المفضلة` : `حفظ ${r.title} في المفضلة`} title="المفضلة" onClick={() => void toggleFavorite(r.id)} className="text-primary"><Heart className={favorites.has(r.id) ? "fill-current" : ""} /></Button>}{editable && <><Button variant="ghost" size="icon" aria-label={`تعديل ${r.title}`} title="تعديل" onClick={() => edit(r)}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive" aria-label={`حذف ${r.title}`} title="حذف" onClick={() => setDeleting(r)}><Trash2 /></Button></>}</div>
        </Card>;
      })}
    </div>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "تعديل المصدر" : "إضافة مصدر"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="resource-title">عنوان المصدر</Label><Input id="resource-title" required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>نوع المصدر</Label><Select value={form.category} onValueChange={category => setForm({ ...form, category })}><SelectTrigger aria-label="تصنيف المصدر"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="channel">قناة تعليمية</SelectItem><SelectItem value="exercise">تمارين</SelectItem></SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="resource-subject">المادة</Label><Input id="resource-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="resource-url">الرابط</Label><Input id="resource-url" type="url" dir="ltr" required placeholder="https://" value={form.url} onChange={e => setForm({ ...form, url: e.target.value })} /></div>
      <div className="space-y-2"><Label htmlFor="resource-description">وصف مختصر (اختياري)</Label><Textarea id="resource-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-primary">{saving && <Loader2 className="animate-spin" />}حفظ المصدر</Button>
    </form></DialogContent></Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={value => { if (!value && !saving) setDeleting(null); }}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف المصدر؟</AlertDialogTitle><AlertDialogDescription>{deleting?.title}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={e => { e.preventDefault(); void remove(); }}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
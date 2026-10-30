import { useCallback, useEffect, useState, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { useApp } from "@/lib/state";
import { safeResourceUrl, detectResourceType, resourceTypeLabel, RESOURCE_TYPES } from "@/lib/resources";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { BookOpen, ExternalLink, FileText, Globe, HardDrive, Heart, Library, Loader2, Pencil, Plus, Search, Send, Trash2, Upload, Video, Youtube } from "lucide-react";
import { toast } from "sonner";

type Resource = Tables<"learning_resources">;
const emptyForm = { title: "", subject: "", category: "youtube", url: "", description: "" };
const BUCKET = "resource-files";
const ICONS: Record<string, typeof Video> = { youtube: Youtube, telegram: Send, drive: HardDrive, file: FileText, exercise: BookOpen, website: Globe, channel: Video };

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
  const [file, setFile] = useState<File | null>(null);
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
    setFile(null);
    setForm(resource ? { title: resource.title, subject: resource.subject, category: resource.category, url: resource.url, description: resource.description } : emptyForm);
    setOpen(true);
  };
  const save = async (event: FormEvent) => {
    event.preventDefault();
    if (!user || saving) return;
    const isFile = form.category === "file";
    const url = isFile ? "" : safeResourceUrl(form.url);
    if (!isFile && !url) return toast.error("أدخل رابطاً صالحاً يبدأ بـ https:// أو http://");
    if (isFile && !file && !editing?.file_path) return toast.error("اختر ملفاً لرفعه");
    if (!form.title.trim()) return;
    setSaving(true);
    let file_path: string | null = isFile ? editing?.file_path ?? null : null;
    if (isFile && file) {
      const ext = file.name.includes(".") ? file.name.split(".").pop() : "bin";
      const path = `${user.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error: upErr } = await supabase.storage.from(BUCKET).upload(path, file, { contentType: file.type || undefined, upsert: false });
      if (upErr) { setSaving(false); return toast.error("تعذر رفع الملف"); }
      file_path = path;
    }
    const values = { ...form, title: form.title.trim(), subject: form.subject.trim(), description: form.description.trim(), url: url ?? "", file_path };
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
    if (deleting.file_path) void supabase.storage.from(BUCKET).remove([deleting.file_path]);
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
  const openFile = async (path: string) => {
    const win = window.open("", "_blank");
    const { data, error: signErr } = await supabase.storage.from(BUCKET).createSignedUrl(path, 60 * 60);
    if (signErr || !data) { win?.close(); return toast.error("تعذر فتح الملف"); }
    if (win) win.location.href = data.signedUrl; else window.location.href = data.signedUrl;
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
      <Select value={category} onValueChange={setCategory}><SelectTrigger className="sm:w-44" aria-label="نوع المصدر"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المصادر</SelectItem>{RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}{resources.some(r => r.category === "channel") && <SelectItem value="channel">قنوات تعليمية</SelectItem>}</SelectContent></Select>
      <Select value={subject} onValueChange={setSubject}><SelectTrigger className="sm:w-44" aria-label="المادة"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المواد</SelectItem>{[...new Set(resources.map(r => r.subject).filter(Boolean))].sort().map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent></Select>
    </div>
    {loading ? <div className="flex justify-center py-16" role="status" aria-label="تحميل المصادر"><Loader2 className="animate-spin text-primary" /></div> : error ? <div className="text-center py-12 space-y-3"><p>تعذر تحميل المصادر.</p><Button variant="outline" onClick={() => void load()}>إعادة المحاولة</Button></div> : filtered.length === 0 ? <div className="text-center py-16 space-y-3 text-muted-foreground"><Library className="h-12 w-12 mx-auto text-primary/50" /><p>{onlyFavorites ? "لم تحفظ أي مصدر بعد. اضغط على القلب لحفظه." : resources.length ? "لا توجد مصادر مطابقة لبحثك." : "لا توجد مصادر مضافة بعد."}</p></div> : <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
      {filtered.map(r => {
        const url = safeResourceUrl(r.url);
        const editable = staff && (user?.role === "admin" || r.created_by === user?.id);
        const Icon = ICONS[r.category] ?? Globe;
        return <Card key={r.id} className="p-5 rounded-lg flex flex-col gap-4 border-border/60 bg-gradient-card min-w-0">
          <div className="flex items-start gap-3"><div className="bg-primary/10 text-primary p-2.5 rounded-lg shrink-0"><Icon className="h-5 w-5" /></div><div className="min-w-0 flex-1"><h2 className="font-display text-lg font-bold break-words">{r.title}</h2><div className="flex gap-2 flex-wrap mt-2"><Badge variant="secondary">{resourceTypeLabel(r.category)}</Badge>{r.subject && <Badge variant="outline">{r.subject}</Badge>}</div></div></div>
          {r.description && <p className="text-sm text-muted-foreground break-words whitespace-pre-wrap">{r.description}</p>}
          {url && <p dir="ltr" className="text-xs text-muted-foreground truncate text-right">{new URL(url).hostname}</p>}
          <div className="flex items-center gap-2 mt-auto pt-2">{url ? <Button asChild variant="outline" className="flex-1"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />فتح المصدر</a></Button> : r.file_path ? <Button variant="outline" className="flex-1" onClick={() => void openFile(r.file_path!)}><FileText />فتح الملف</Button> : null}{isStudent && <Button variant="ghost" size="icon" aria-pressed={favorites.has(r.id)} aria-label={favorites.has(r.id) ? `إزالة ${r.title} من المفضلة` : `حفظ ${r.title} في المفضلة`} title="المفضلة" onClick={() => void toggleFavorite(r.id)} className="text-primary"><Heart className={favorites.has(r.id) ? "fill-current" : ""} /></Button>}{editable && <><Button variant="ghost" size="icon" aria-label={`تعديل ${r.title}`} title="تعديل" onClick={() => edit(r)}><Pencil /></Button><Button variant="ghost" size="icon" className="text-destructive" aria-label={`حذف ${r.title}`} title="حذف" onClick={() => setDeleting(r)}><Trash2 /></Button></>}</div>
        </Card>;
      })}
    </div>}
    <Dialog open={open} onOpenChange={value => { if (!saving) setOpen(value); }}><DialogContent dir="rtl" className="max-h-[85vh] overflow-y-auto"><DialogHeader><DialogTitle>{editing ? "تعديل المصدر" : "إضافة مصدر"}</DialogTitle></DialogHeader><form onSubmit={save} className="space-y-4">
      <div className="space-y-2"><Label htmlFor="resource-title">عنوان المصدر</Label><Input id="resource-title" required maxLength={200} value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
      <div className="space-y-2"><Label>نوع المصدر</Label><Select value={form.category} onValueChange={category => setForm({ ...form, category })}><SelectTrigger aria-label="تصنيف المصدر"><SelectValue /></SelectTrigger><SelectContent>{RESOURCE_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}{form.category === "channel" && <SelectItem value="channel">قناة تعليمية</SelectItem>}</SelectContent></Select></div>
      <div className="space-y-2"><Label htmlFor="resource-subject">المادة</Label><Input id="resource-subject" value={form.subject} onChange={e => setForm({ ...form, subject: e.target.value })} /></div>
      {form.category === "file" ? <div className="space-y-2"><Label htmlFor="resource-file">الملف</Label><label htmlFor="resource-file" className="flex items-center gap-2 border border-dashed border-primary/40 rounded-lg p-3 cursor-pointer text-sm text-muted-foreground hover:bg-muted"><Upload className="h-4 w-4 text-primary" /><span className="truncate">{file ? file.name : editing?.file_path ? "ملف مرفوع — اختر ملفاً آخر لاستبداله" : "اختر ملفاً (PDF، Word، صور…) حتى 50MB"}</span></label><Input id="resource-file" type="file" className="sr-only" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.zip,image/*" onChange={e => { const f = e.target.files?.[0] ?? null; if (f && f.size > 50 * 1024 * 1024) { toast.error("حجم الملف يتجاوز 50MB"); return; } setFile(f); }} /></div>
      : <div className="space-y-2"><Label htmlFor="resource-url">الرابط</Label><Input id="resource-url" type="url" dir="ltr" required placeholder="https://youtube.com/… أو https://t.me/… أو رابط Drive" value={form.url} onChange={e => { const v = e.target.value; const t = detectResourceType(v); setForm(f => ({ ...f, url: v, category: t && f.category !== "exercise" ? t : f.category })); }} /><p className="text-xs text-muted-foreground">يُتعرّف تلقائياً على روابط يوتيوب وتلغرام وGoogle Drive.</p></div>}
      <div className="space-y-2"><Label htmlFor="resource-description">وصف مختصر (اختياري)</Label><Textarea id="resource-description" value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} /></div>
      <Button type="submit" disabled={saving} className="w-full bg-gradient-primary">{saving && <Loader2 className="animate-spin" />}حفظ المصدر</Button>
    </form></DialogContent></Dialog>
    <AlertDialog open={Boolean(deleting)} onOpenChange={value => { if (!value && !saving) setDeleting(null); }}><AlertDialogContent dir="rtl"><AlertDialogHeader><AlertDialogTitle>حذف المصدر؟</AlertDialogTitle><AlertDialogDescription>{deleting?.title}</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel disabled={saving}>إلغاء</AlertDialogCancel><AlertDialogAction disabled={saving} onClick={e => { e.preventDefault(); void remove(); }}>حذف</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
  </div>;
}
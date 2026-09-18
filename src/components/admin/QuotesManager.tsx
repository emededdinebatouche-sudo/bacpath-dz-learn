import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Loader2, Plus, Trash2, Save, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { useApp } from "@/lib/state";

type Quote = { id: string; text: string; is_active: boolean };

export default function QuotesManager() {
  const { user } = useApp();
  const [items, setItems] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [newText, setNewText] = useState("");
  const [adding, setAdding] = useState(false);

  const load = async () => {
    const { data } = await supabase
      .from("motivational_quotes" as any)
      .select("id, text, is_active")
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
    setLoading(false);
  };

  useEffect(() => { load(); }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = newText.trim();
    if (!text) return;
    setAdding(true);
    const { data, error } = await supabase
      .from("motivational_quotes" as any)
      .insert({ text, is_active: true, created_by: user?.id ?? null })
      .select("id, text, is_active")
      .single();
    setAdding(false);
    if (error) return toast.error(error.message);
    setItems(prev => [data as any, ...prev]);
    setNewText("");
    toast.success("تمت إضافة العبارة ✅");
  };

  const toggle = async (q: Quote) => {
    setItems(prev => prev.map(i => i.id === q.id ? { ...i, is_active: !q.is_active } : i));
    const { error } = await supabase.from("motivational_quotes" as any).update({ is_active: !q.is_active }).eq("id", q.id);
    if (error) { toast.error(error.message); load(); }
  };

  const remove = async (id: string) => {
    setItems(prev => prev.filter(i => i.id !== id));
    const { error } = await supabase.from("motivational_quotes" as any).delete().eq("id", id);
    if (error) { toast.error(error.message); load(); }
    else toast.success("تم الحذف");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="h-11 w-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Sparkles className="h-5 w-5 text-white" />
        </div>
        <h2 className="text-2xl font-display font-extrabold">العبارات التحفيزية</h2>
      </div>

      <Card className="p-4">
        <form onSubmit={add} className="flex gap-2 flex-wrap">
          <Input value={newText} onChange={e => setNewText(e.target.value)} placeholder="اكتب عبارة جديدة..." maxLength={200} className="flex-1 min-w-[200px]" />
          <Button type="submit" disabled={adding || !newText.trim()} className="bg-gradient-primary gap-1">
            <Plus className="h-4 w-4" /> إضافة
          </Button>
        </form>
      </Card>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-7 w-7 animate-spin text-primary" /></div>
      ) : items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد عبارات بعد.</Card>
      ) : (
        <div className="space-y-2">
          {items.map(q => <QuoteRow key={q.id} q={q} onToggle={() => toggle(q)} onDelete={() => remove(q.id)} onSaved={(t) => setItems(prev => prev.map(i => i.id === q.id ? { ...i, text: t } : i))} />)}
        </div>
      )}
    </div>
  );
}

function QuoteRow({ q, onToggle, onDelete, onSaved }: { q: Quote; onToggle: () => void; onDelete: () => void; onSaved: (t: string) => void }) {
  const [text, setText] = useState(q.text);
  const [saving, setSaving] = useState(false);
  const dirty = text.trim() !== q.text && text.trim().length > 0;

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("motivational_quotes" as any).update({ text: text.trim() }).eq("id", q.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    onSaved(text.trim());
    toast.success("تم الحفظ");
  };

  return (
    <Card className="p-3 flex items-center gap-2 flex-wrap">
      <Input value={text} onChange={e => setText(e.target.value)} maxLength={200} className="flex-1 min-w-[180px] h-9" />
      <div className="flex items-center gap-2">
        <Switch checked={q.is_active} onCheckedChange={onToggle} />
        <span className="text-xs text-muted-foreground">{q.is_active ? "مفعّلة" : "موقوفة"}</span>
      </div>
      <Button size="sm" onClick={save} disabled={!dirty || saving} className="bg-gradient-primary gap-1">
        <Save className="h-4 w-4" /> حفظ
      </Button>
      <Button size="icon" variant="ghost" onClick={onDelete} className="h-9 w-9 text-muted-foreground hover:text-destructive">
        <Trash2 className="h-4 w-4" />
      </Button>
    </Card>
  );
}

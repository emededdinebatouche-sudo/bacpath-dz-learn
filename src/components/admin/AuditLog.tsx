import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, ScrollText } from "lucide-react";
import { ACTION_LABEL, ENTITY_LABEL, type AuditLog as AuditLogRow } from "@/lib/audit";
import { cn } from "@/lib/utils";

const ACTION_STYLE: Record<string, string> = {
  created: "bg-success/15 text-success border-success/30",
  updated: "bg-warning/15 text-warning border-warning/30",
  cancelled: "bg-warning/15 text-warning border-warning/30",
  deleted: "bg-destructive/15 text-destructive border-destructive/30",
};

export default function AuditLog() {
  const [rows, setRows] = useState<AuditLogRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [entity, setEntity] = useState("all");
  const [action, setAction] = useState("all");

  useEffect(() => {
    (async () => {
      const { data } = await supabase
        .from("audit_logs" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(300);
      setRows((data as any) || []);
      setLoading(false);
    })();
  }, []);

  const filtered = useMemo(() => rows.filter(r => {
    if (entity !== "all" && r.entity_type !== entity) return false;
    if (action !== "all" && r.action !== action) return false;
    if (q.trim()) {
      const s = q.trim().toLowerCase();
      if (!`${r.actor_name} ${r.entity_title}`.toLowerCase().includes(s)) return false;
    }
    return true;
  }), [rows, entity, action, q]);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <ScrollText className="h-5 w-5 text-primary" />
        <h2 className="font-display font-bold text-lg">سجل النشاطات</h2>
        <Badge variant="secondary">{filtered.length}</Badge>
      </div>

      <div className="grid gap-2 sm:grid-cols-3">
        <Input value={q} onChange={e => setQ(e.target.value)} placeholder="بحث بالاسم أو العنوان..." />
        <Select value={entity} onValueChange={setEntity}>
          <SelectTrigger><SelectValue placeholder="النوع" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الأنواع</SelectItem>
            <SelectItem value="exercise">تمرين</SelectItem>
            <SelectItem value="live_session">حصة مباشرة</SelectItem>
            <SelectItem value="past_exam">بكالوريا سابقة</SelectItem>
          </SelectContent>
        </Select>
        <Select value={action} onValueChange={setAction}>
          <SelectTrigger><SelectValue placeholder="العملية" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل العمليات</SelectItem>
            <SelectItem value="created">إضافة</SelectItem>
            <SelectItem value="updated">تعديل</SelectItem>
            <SelectItem value="cancelled">إلغاء</SelectItem>
            <SelectItem value="deleted">حذف</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {loading ? (
        <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
      ) : filtered.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground">لا توجد نشاطات مسجلة بعد.</Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(r => (
            <Card key={r.id} className="p-4 flex items-start gap-3 flex-wrap">
              <div className="flex-1 min-w-[180px]">
                <div className="flex flex-wrap items-center gap-1.5 mb-1">
                  <Badge variant="outline" className={cn("text-[10px] font-bold", ACTION_STYLE[r.action])}>
                    {ACTION_LABEL[r.action] || r.action}
                  </Badge>
                  <Badge variant="secondary" className="text-[10px]">{ENTITY_LABEL[r.entity_type] || r.entity_type}</Badge>
                  <Badge variant="outline" className="text-[10px]">{r.actor_role === "admin" ? "أدمن" : "أستاذ"}</Badge>
                </div>
                <div className="font-bold text-sm">{r.entity_title || "—"}</div>
                <div className="text-xs text-muted-foreground">
                  بواسطة {r.actor_name || "مستخدم"} • {new Date(r.created_at).toLocaleString("ar-DZ")}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Send, CheckCircle2, Circle, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { toast } from "sonner";

type QA = {
  id: string;
  user_id: string;
  user_name: string;
  subject: string;
  question: string;
  answer: string | null;
  answered_by_name: string | null;
  created_at: string;
};

export default function QABoard() {
  const { user } = useApp();
  const [items, setItems] = useState<QA[]>([]);
  const [subject, setSubject] = useState("");
  const [question, setQuestion] = useState("");
  const [aInput, setAInput] = useState<Record<string, string>>({});

  const load = async () => {
    const { data } = await supabase
      .from("qa_questions" as any)
      .select("*")
      .order("created_at", { ascending: false });
    setItems((data as any) || []);
  };

  useEffect(() => {
    load();
    const ch = supabase
      .channel("qa_questions_all")
      .on("postgres_changes", { event: "*", schema: "public", table: "qa_questions" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, []);

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  const ask = async () => {
    if (!user) return toast.error("سجّل الدخول أولاً");
    const s = subject.trim();
    const q = question.trim();
    if (!s || !q) return toast.error("أدخل المادة والسؤال");
    const { error } = await supabase.from("qa_questions" as any).insert({
      user_id: user.id,
      user_name: user.name,
      subject: s,
      question: q,
    });
    if (error) return toast.error(error.message);
    setSubject(""); setQuestion("");
    toast.success("تم إرسال السؤال");
  };

  const reply = async (q: QA) => {
    if (!user) return;
    const text = (aInput[q.id] || "").trim();
    if (!text) return;
    const { error } = await supabase.from("qa_questions" as any).update({
      answer: text,
      answered_by: user.id,
      answered_by_name: user.name,
    }).eq("id", q.id);
    if (error) return toast.error(error.message);
    setAInput({ ...aInput, [q.id]: "" });
    toast.success("تم الرد");
  };

  const remove = async (id: string) => {
    const { error } = await supabase.from("qa_questions" as any).delete().eq("id", id);
    if (error) return toast.error(error.message);
  };

  return (
    <div className="space-y-4">
      <Card className="p-4 bg-gradient-card border-border/60 space-y-3">
        <Input
          value={subject}
          onChange={(e) => setSubject(e.target.value)}
          placeholder="المادة (مثال: رياضيات)"
        />
        <Textarea
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="اكتب سؤالك هنا..."
          rows={3}
        />
        <Button onClick={ask} className="bg-gradient-primary gap-1 w-full sm:w-auto">
          <Send className="h-4 w-4" /> إرسال السؤال
        </Button>
      </Card>

      <div className="space-y-2">
        {items.length === 0 && (
          <p className="text-sm text-muted-foreground text-center py-6">لا توجد أسئلة بعد. كن أول من يسأل!</p>
        )}
        {items.map(q => (
          <Card key={q.id} className="p-3 bg-card/50">
            <div className="flex items-start gap-2">
              {q.answer
                ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Badge variant="secondary" className="text-[10px]">{q.subject}</Badge>
                  {q.answer
                    ? <Badge className="bg-primary text-primary-foreground text-[10px]">تمت الإجابة</Badge>
                    : <Badge variant="outline" className="text-[10px]">في الانتظار</Badge>}
                  <span className="text-[10px] text-muted-foreground">
                    {new Date(q.created_at).toLocaleString("ar-DZ")}
                  </span>
                </div>
                <p className="text-sm"><span className="font-bold">{q.user_name || "طالب"}:</span> {q.question}</p>
                {q.answer && (
                  <div className="mt-2 ps-3 border-s-2 border-primary">
                    <p className="text-xs text-muted-foreground font-bold">{q.answered_by_name || "الأستاذ"} رد:</p>
                    <p className="text-sm">{q.answer}</p>
                  </div>
                )}
                {isStaff && !q.answer && (
                  <div className="flex gap-2 mt-2">
                    <Input
                      value={aInput[q.id] || ""}
                      onChange={(e) => setAInput({ ...aInput, [q.id]: e.target.value })}
                      placeholder="اكتب الرد..."
                      className="h-8 text-sm"
                      onKeyDown={(e) => { if (e.key === "Enter") reply(q); }}
                    />
                    <Button size="sm" onClick={() => reply(q)} className="bg-gradient-primary">رد</Button>
                  </div>
                )}
              </div>
              {(user?.id === q.user_id || user?.role === "admin") && (
                <Button size="icon" variant="ghost" onClick={() => remove(q.id)} className="h-7 w-7">
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

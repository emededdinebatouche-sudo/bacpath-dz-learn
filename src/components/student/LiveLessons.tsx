import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Video, Calendar, ExternalLink, Send, MessageSquare, CheckCircle2, Circle, HelpCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useApp } from "@/lib/state";
import { toast } from "sonner";
import { getSessionState, type LiveSession } from "@/components/live/LiveSessionsManager";
import QABoard from "@/components/live/QABoard";

type Question = {
  id: string;
  session_id: string;
  user_id: string;
  user_name: string;
  question: string;
  answer: string | null;
  answered_by_name: string | null;
  created_at: string;
};

export default function LiveLessons() {
  const { user } = useApp();
  const [sessions, setSessions] = useState<LiveSession[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [qInput, setQInput] = useState<Record<string, string>>({});
  const [aInput, setAInput] = useState<Record<string, string>>({});

  const loadAll = async () => {
    const [{ data: s }, { data: q }] = await Promise.all([
      supabase.from("live_sessions" as any).select("*").order("scheduled_at", { ascending: true }),
      supabase.from("live_questions" as any).select("*").order("created_at", { ascending: true }),
    ]);
    setSessions((s as any) || []);
    setQuestions((q as any) || []);
  };

  useEffect(() => {
    loadAll();
    const ch = supabase
      .channel("live_all")
      .on("postgres_changes", { event: "*", schema: "public", table: "live_sessions" }, loadAll)
      .on("postgres_changes", { event: "*", schema: "public", table: "live_questions" }, loadAll)
      .subscribe();
    const interval = setInterval(() => setSessions(prev => [...prev]), 30000);
    return () => { supabase.removeChannel(ch); clearInterval(interval); };
  }, []);

  const live = sessions.filter(s => getSessionState(s) === "live");
  const upcoming = sessions.filter(s => getSessionState(s) === "upcoming");
  const past = sessions.filter(s => getSessionState(s) === "past");

  const ask = async (sessionId: string) => {
    if (!user) return;
    const text = (qInput[sessionId] || "").trim();
    if (!text) return;
    const { error } = await supabase.from("live_questions" as any).insert({
      session_id: sessionId,
      user_id: user.id,
      user_name: user.name,
      question: text,
    });
    if (error) return toast.error(error.message);
    setQInput({ ...qInput, [sessionId]: "" });
    toast.success("تم إرسال السؤال");
  };

  const answer = async (q: Question) => {
    if (!user) return;
    const text = (aInput[q.id] || "").trim();
    if (!text) return;
    const { error } = await supabase.from("live_questions" as any).update({
      answer: text,
      answered_by: user.id,
      answered_by_name: user.name,
    }).eq("id", q.id);
    if (error) return toast.error(error.message);
    setAInput({ ...aInput, [q.id]: "" });
    toast.success("تم الرد");
  };

  const isStaff = user?.role === "admin" || user?.role === "teacher";

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Video className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">الدروس المباشرة</h1>
          <p className="text-sm text-muted-foreground">انضم للحصص الحية وشارك بأسئلتك</p>
        </div>
      </div>

      {live.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" /> مباشر الآن
          </h2>
          <div className="space-y-4">
            {live.map(s => (
              <SessionCard key={s.id} s={s} state="live">
                <QASection
                  session={s}
                  questions={questions.filter(q => q.session_id === s.id)}
                  qInput={qInput[s.id] || ""}
                  setQInput={(v) => setQInput({ ...qInput, [s.id]: v })}
                  ask={() => ask(s.id)}
                  isStaff={!!isStaff}
                  aInput={aInput}
                  setAInput={setAInput}
                  answer={answer}
                />
              </SessionCard>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> الحصص القادمة
        </h2>
        {upcoming.length === 0 && <p className="text-sm text-muted-foreground">لا توجد حصص مجدولة.</p>}
        <div className="space-y-3">
          {upcoming.map(s => <SessionCard key={s.id} s={s} state="upcoming" />)}
        </div>
      </section>

      <section>
        <h2 className="font-display font-bold text-lg mb-3">الحصص السابقة</h2>
        {past.length === 0 && <p className="text-sm text-muted-foreground">لا توجد حصص سابقة.</p>}
        <div className="space-y-3">
          {past.map(s => (
            <SessionCard key={s.id} s={s} state="past">
              <QASection
                session={s}
                questions={questions.filter(q => q.session_id === s.id)}
                qInput={qInput[s.id] || ""}
                setQInput={(v) => setQInput({ ...qInput, [s.id]: v })}
                ask={() => ask(s.id)}
                isStaff={!!isStaff}
                aInput={aInput}
                setAInput={setAInput}
                answer={answer}
                readOnlyAsk
              />
            </SessionCard>
          ))}
        </div>
      </section>
    </div>
  );
}

function SessionCard({ s, state, children }: { s: LiveSession; state: "live" | "upcoming" | "past"; children?: React.ReactNode }) {
  return (
    <Card className="p-4 bg-gradient-card border-border/60">
      <div className="flex items-start gap-3">
        <div className="h-12 w-12 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0">
          <Video className="h-5 w-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap mb-1">
            <Badge variant="secondary" className="text-[10px]">{s.subject}</Badge>
            {state === "live" && <Badge className="bg-destructive text-destructive-foreground text-[10px] gap-1"><span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> مباشر</Badge>}
            {state === "upcoming" && <Badge variant="outline" className="text-[10px]">قادمة</Badge>}
            {state === "past" && <Badge variant="outline" className="text-[10px]">{s.status === "cancelled" ? "ملغاة" : "منتهية"}</Badge>}
          </div>
          <h3 className="font-display font-bold">{s.title}</h3>
          <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
            <Calendar className="h-3 w-3" /> {new Date(s.scheduled_at).toLocaleString("ar-DZ")}
          </p>
        </div>
        {state !== "past" && s.status !== "cancelled" && (
          <Button asChild size="sm" className="bg-gradient-primary gap-1">
            <a href={s.stream_link} target="_blank" rel="noreferrer"><ExternalLink className="h-4 w-4" /> انضم</a>
          </Button>
        )}
      </div>
      {children && <div className="mt-4 border-t border-border/60 pt-4">{children}</div>}
    </Card>
  );
}

function QASection({
  session, questions, qInput, setQInput, ask, isStaff, aInput, setAInput, answer, readOnlyAsk,
}: {
  session: LiveSession;
  questions: Question[];
  qInput: string;
  setQInput: (v: string) => void;
  ask: () => void;
  isStaff: boolean;
  aInput: Record<string, string>;
  setAInput: (v: Record<string, string>) => void;
  answer: (q: Question) => void;
  readOnlyAsk?: boolean;
}) {
  return (
    <div className="space-y-3">
      <h4 className="font-display font-bold text-sm flex items-center gap-2">
        <MessageSquare className="h-4 w-4 text-primary" /> الأسئلة ({questions.length})
      </h4>
      {!readOnlyAsk && (
        <div className="flex gap-2">
          <Input
            value={qInput}
            onChange={(e) => setQInput(e.target.value)}
            placeholder="اكتب سؤالك..."
            onKeyDown={(e) => { if (e.key === "Enter") ask(); }}
          />
          <Button onClick={ask} className="bg-gradient-primary gap-1"><Send className="h-4 w-4" /> إرسال</Button>
        </div>
      )}
      <div className="space-y-2">
        {questions.length === 0 && <p className="text-xs text-muted-foreground">لا توجد أسئلة بعد.</p>}
        {questions.map(q => (
          <Card key={q.id} className="p-3 bg-card/50">
            <div className="flex items-start gap-2">
              {q.answer ? <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" /> : <Circle className="h-4 w-4 text-muted-foreground flex-shrink-0 mt-0.5" />}
              <div className="flex-1 min-w-0">
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
                      onKeyDown={(e) => { if (e.key === "Enter") answer(q); }}
                    />
                    <Button size="sm" onClick={() => answer(q)} className="bg-gradient-primary">رد</Button>
                  </div>
                )}
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}

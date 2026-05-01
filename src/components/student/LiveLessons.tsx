import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Video, Users, Calendar, Bell } from "lucide-react";
import { SUBJECT_META, Subject } from "@/lib/state";
import { toast } from "sonner";

type Lesson = { id: string; title: string; subject: Subject; teacher: string; status: "live" | "upcoming"; viewers?: number; time?: string; };

const LESSONS: Lesson[] = [
  { id: "l1", title: "المعادلات التفاضلية — تمارين البكالوريا", subject: "math", teacher: "أ. سامي بوزيد", status: "live", viewers: 1240 },
  { id: "l2", title: "تصحيح بكالوريا 2024 — الفيزياء", subject: "physics", teacher: "أ. ليلى عمراني", status: "live", viewers: 890 },
  { id: "l3", title: "الكيمياء العضوية: الميكانيزمات", subject: "chemistry", teacher: "أ. خالد مرابطي", status: "upcoming", time: "غداً 18:00" },
  { id: "l4", title: "الثورة التحريرية: تحليل وثائق", subject: "history", teacher: "أ. نادية بلهاج", status: "upcoming", time: "السبت 20:00" },
  { id: "l5", title: "المتتاليات العددية — حلول مفصلة", subject: "math", teacher: "أ. رضا حداد", status: "upcoming", time: "الأحد 17:30" },
];

export default function LiveLessons() {
  const live = LESSONS.filter(l => l.status === "live");
  const upcoming = LESSONS.filter(l => l.status === "upcoming");

  return (
    <div className="space-y-6 animate-fade-in pb-8">
      <div className="flex items-center gap-3">
        <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
          <Video className="h-6 w-6 text-white" />
        </div>
        <div>
          <h1 className="font-display text-2xl md:text-3xl font-extrabold">الدروس المباشرة</h1>
          <p className="text-sm text-muted-foreground">انضم لحصص حية مع أفضل الأساتذة</p>
        </div>
      </div>

      {live.length > 0 && (
        <section>
          <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-destructive animate-pulse" />
            مباشر الآن
          </h2>
          <div className="grid md:grid-cols-2 gap-4">
            {live.map(l => <LiveCard key={l.id} lesson={l} />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="font-display font-bold text-lg mb-3 flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" /> القادمة
        </h2>
        <div className="space-y-3">
          {upcoming.map(l => <UpcomingCard key={l.id} lesson={l} />)}
        </div>
      </section>
    </div>
  );
}

function LiveCard({ lesson }: { lesson: Lesson }) {
  const meta = SUBJECT_META[lesson.subject];
  const initials = lesson.teacher.split(" ").slice(-2).map(n => n[0]).join("");
  return (
    <Card className="overflow-hidden border-border/60 card-hover group">
      <div className={`relative h-36 bg-gradient-to-br ${meta.color} flex items-center justify-center`}>
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="text-7xl relative">{meta.emoji}</div>
        <Badge className="absolute top-3 right-3 bg-destructive text-destructive-foreground border-0 gap-1.5 font-bold">
          <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" /> مباشر
        </Badge>
        <Badge className="absolute top-3 left-3 bg-black/40 text-white border-0 gap-1 backdrop-blur">
          <Users className="h-3 w-3" /> {lesson.viewers?.toLocaleString("ar-DZ")}
        </Badge>
      </div>
      <div className="p-5">
        <Badge variant="secondary" className="text-[10px] font-bold mb-2">{meta.label}</Badge>
        <h3 className="font-display font-bold text-base mb-3 leading-snug">{lesson.title}</h3>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white text-xs font-bold">{initials}</AvatarFallback>
            </Avatar>
            <span className="text-xs font-semibold text-muted-foreground">{lesson.teacher}</span>
          </div>
          <Button size="sm" onClick={() => toast.success("جارٍ الانضمام للحصة...")} className="bg-gradient-primary hover:opacity-95">
            انضم
          </Button>
        </div>
      </div>
    </Card>
  );
}

function UpcomingCard({ lesson }: { lesson: Lesson }) {
  const meta = SUBJECT_META[lesson.subject];
  return (
    <Card className="p-4 bg-gradient-card border-border/60 card-hover">
      <div className="flex items-center gap-4">
        <div className={`h-14 w-14 rounded-2xl bg-gradient-to-br ${meta.color} flex items-center justify-center text-2xl flex-shrink-0`}>
          {meta.emoji}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <Badge variant="secondary" className="text-[10px] font-bold">{meta.label}</Badge>
            <Badge variant="outline" className="text-[10px] gap-1"><Calendar className="h-3 w-3" />{lesson.time}</Badge>
          </div>
          <h3 className="font-display font-bold text-base leading-snug truncate">{lesson.title}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">{lesson.teacher}</p>
        </div>
        <Button size="sm" variant="outline" onClick={() => toast.success("ستصلك تذكرة قبل بدء الحصة 🔔")} className="gap-1 flex-shrink-0">
          <Bell className="h-4 w-4" />
          <span className="hidden sm:inline">ذكّرني</span>
        </Button>
      </div>
    </Card>
  );
}

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useApp, SUBJECT_META, Subject } from "@/lib/state";
import { Plus, BookOpen, Video, Users, GraduationCap, LogOut, TrendingUp, Calendar } from "lucide-react";
import { toast } from "sonner";
import { Progress } from "@/components/ui/progress";

const STUDENTS = [
  { name: "أمين الجزائري", points: 1280, level: 2, progress: 78 },
  { name: "ليندا بن صالح", points: 2150, level: 3, progress: 92 },
  { name: "يوسف زيدان", points: 950, level: 1, progress: 64 },
  { name: "هبة بومدين", points: 1740, level: 2, progress: 85 },
  { name: "كريم بوزيد", points: 620, level: 1, progress: 42 },
];

export default function TeacherDashboard() {
  const { user, logout } = useApp();
  const [lessons, setLessons] = useState([
    { title: "المعادلات التفاضلية", subject: "math" as Subject, type: "درس" },
    { title: "الحقل المغناطيسي — تمارين", subject: "physics" as Subject, type: "تمرين" },
  ]);
  const [open, setOpen] = useState(false);

  if (!user) return null;
  const initials = user.name.split(" ").slice(0, 2).map(n => n[0]).join("");

  return (
    <div className="min-h-screen bg-mesh">
      <header className="bg-card/80 backdrop-blur border-b border-border sticky top-0 z-30">
        <div className="container max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
              <GraduationCap className="h-6 w-6 text-white" />
            </div>
            <div>
              <span className="font-display text-xl font-extrabold text-gradient block leading-tight">BacPath</span>
              <span className="text-[10px] text-muted-foreground font-semibold">لوحة الأستاذ</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-9 w-9 ring-2 ring-primary/20">
              <AvatarFallback className="bg-gradient-primary text-white text-sm font-bold">{initials}</AvatarFallback>
            </Avatar>
            <Button variant="ghost" size="icon" onClick={logout}><LogOut className="h-4 w-4" /></Button>
          </div>
        </div>
      </header>

      <main className="container max-w-6xl mx-auto px-4 py-6 space-y-6 animate-fade-in pb-12">
        <Card className="p-6 md:p-8 bg-gradient-hero text-white border-0 shadow-elevated relative overflow-hidden">
          <div className="absolute -top-12 -left-12 h-48 w-48 rounded-full bg-white/10 blur-2xl" />
          <div className="relative">
            <p className="text-white/80 text-sm font-semibold">مرحباً أستاذ 👨‍🏫</p>
            <h1 className="font-display text-3xl md:text-4xl font-extrabold">{user.name}</h1>
            <p className="text-white/80 mt-2">إدارة الدروس، التمارين، وحصص الطلاب</p>
          </div>
        </Card>

        <div className="grid grid-cols-3 gap-3 md:gap-5">
          <StatCard icon={Users} label="طلابي" value="142" gradient="from-blue-500 to-indigo-600" />
          <StatCard icon={BookOpen} label="دروسي" value={`${lessons.length}`} gradient="from-violet-500 to-purple-600" />
          <StatCard icon={Video} label="حصص قادمة" value="3" gradient="from-pink-500 to-rose-600" />
        </div>

        <Tabs defaultValue="live">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="live">الحصص المباشرة</TabsTrigger>
            <TabsTrigger value="students">تقدّم الطلاب</TabsTrigger>
            <TabsTrigger value="content">تمارين (اختياري)</TabsTrigger>
          </TabsList>

          <TabsContent value="content" className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">تماريني (اختياري)</h2>
              <Dialog open={open} onOpenChange={setOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-gradient-primary hover:opacity-95 gap-2 shadow-primary">
                    <Plus className="h-4 w-4" /> إضافة جديد
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle className="font-display">إضافة درس / تمرين</DialogTitle></DialogHeader>
                  <form onSubmit={(e) => {
                    e.preventDefault();
                    const fd = new FormData(e.currentTarget);
                    setLessons(prev => [...prev, { title: fd.get("title") as string, subject: fd.get("subject") as Subject, type: fd.get("type") as string }]);
                    setOpen(false);
                    toast.success("تمت الإضافة بنجاح ✅");
                  }} className="space-y-3">
                    <div>
                      <Label>العنوان</Label>
                      <Input name="title" required placeholder="مثال: تمارين النهايات" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>المادة</Label>
                        <Select name="subject" defaultValue="math">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            {(Object.keys(SUBJECT_META) as Subject[]).map(s => (
                              <SelectItem key={s} value={s}>{SUBJECT_META[s].emoji} {SUBJECT_META[s].label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>النوع</Label>
                        <Select name="type" defaultValue="درس">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="درس">درس</SelectItem>
                            <SelectItem value="تمرين">تمرين</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label>الوصف</Label>
                      <Textarea placeholder="وصف مختصر..." rows={3} />
                    </div>
                    <Button type="submit" className="w-full bg-gradient-primary hover:opacity-95">حفظ</Button>
                  </form>
                </DialogContent>
              </Dialog>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {lessons.map((l, i) => {
                const m = SUBJECT_META[l.subject];
                return (
                  <Card key={i} className="p-4 bg-gradient-card border-border/60 card-hover">
                    <div className="flex items-center gap-3">
                      <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center text-2xl`}>{m.emoji}</div>
                      <div className="flex-1 min-w-0">
                        <div className="flex gap-1.5 mb-1">
                          <Badge variant="secondary" className="text-[10px] font-bold">{m.label}</Badge>
                          <Badge variant="outline" className="text-[10px]">{l.type}</Badge>
                        </div>
                        <h3 className="font-display font-bold text-sm truncate">{l.title}</h3>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </TabsContent>

          <TabsContent value="live" className="space-y-4 mt-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display font-bold text-lg">حصصي المجدولة</h2>
              <Button onClick={() => toast.success("تمت جدولة حصة جديدة 📅")} className="bg-gradient-primary hover:opacity-95 gap-2 shadow-primary">
                <Plus className="h-4 w-4" /> جدولة حصة
              </Button>
            </div>
            {[
              { title: "تصحيح بكالوريا 2024 — الرياضيات", time: "اليوم 19:00", subject: "math" as Subject },
              { title: "حصة مراجعة الفصل الأول", time: "غداً 17:30", subject: "math" as Subject },
              { title: "ورشة حل المسائل", time: "السبت 20:00", subject: "math" as Subject },
            ].map((s, i) => {
              const m = SUBJECT_META[s.subject];
              return (
                <Card key={i} className="p-4 bg-gradient-card border-border/60 card-hover">
                  <div className="flex items-center gap-3">
                    <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${m.color} flex items-center justify-center`}>
                      <Video className="h-5 w-5 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm">{s.title}</h3>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5"><Calendar className="h-3 w-3" /> {s.time}</p>
                    </div>
                    <Button size="sm" variant="outline">إدارة</Button>
                  </div>
                </Card>
              );
            })}
          </TabsContent>

          <TabsContent value="students" className="space-y-3 mt-5">
            <h2 className="font-display font-bold text-lg flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> أداء الطلاب</h2>
            {STUDENTS.map((s, i) => {
              const init = s.name.split(" ").map(n => n[0]).join("");
              return (
                <Card key={i} className="p-4 bg-gradient-card border-border/60">
                  <div className="flex items-center gap-3 mb-2">
                    <Avatar className="h-10 w-10 ring-2 ring-primary/20">
                      <AvatarFallback className="bg-gradient-primary text-white font-bold text-sm">{init}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-display font-bold text-sm">{s.name}</h3>
                      <p className="text-xs text-muted-foreground">المستوى {s.level} · {s.points.toLocaleString("ar-DZ")} نقطة</p>
                    </div>
                    <span className="font-display font-extrabold text-lg text-gradient">{s.progress}%</span>
                  </div>
                  <Progress value={s.progress} className="h-2" />
                </Card>
              );
            })}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, gradient }: { icon: any; label: string; value: string; gradient: string }) {
  return (
    <Card className="p-4 md:p-5 bg-gradient-card border-border/60 card-hover">
      <div className={`h-10 w-10 rounded-xl bg-gradient-to-br ${gradient} flex items-center justify-center mb-3 shadow-md`}>
        <Icon className="h-5 w-5 text-white" />
      </div>
      <div className="font-display text-2xl md:text-3xl font-extrabold">{value}</div>
      <div className="text-xs md:text-sm text-muted-foreground font-semibold">{label}</div>
    </Card>
  );
}

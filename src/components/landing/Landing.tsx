import { useState } from "react";
import heroImg from "@/assets/hero-students.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useApp } from "@/lib/state";
import { GraduationCap, Sparkles, Trophy, Video, BookOpen, Target, Mail, Lock, ChevronLeft } from "lucide-react";

export default function Landing() {
  const { login } = useApp();
  const [showAuth, setShowAuth] = useState(false);
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    login(role, name || undefined, email || undefined);
  };

  return (
    <div className="min-h-screen bg-mesh">
      {/* Header */}
      <header className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-gradient">BacPath</span>
        </div>
        <Button onClick={() => setShowAuth(true)} className="bg-gradient-primary hover:opacity-95 shadow-primary">
          تسجيل الدخول
        </Button>
      </header>

      {/* Hero */}
      <section className="container mx-auto px-4 pt-8 pb-20">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          <div className="text-center lg:text-right space-y-6 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm text-accent-foreground font-semibold">
              <Sparkles className="h-4 w-4" />
              منصة التحضير الذكي للبكالوريا الجزائرية
            </div>
            <h1 className="font-display text-4xl md:text-6xl font-extrabold leading-tight">
              تعلّم بذكاء.
              <br />
              <span className="text-gradient">تفوّق في البكالوريا.</span>
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto lg:mx-0">
              خطط دراسة يومية مخصصة، تمارين تفاعلية، دروس مباشرة مع أفضل الأساتذة، ونظام مكافآت يحفّزك لتحقيق هدفك.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button size="lg" onClick={() => { setRole("student"); setShowAuth(true); }} className="bg-gradient-primary hover:opacity-95 shadow-primary text-base h-12 px-8">
                ابدأ الآن مجاناً
                <ChevronLeft className="h-5 w-5 mr-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={() => { setRole("teacher"); setShowAuth(true); }} className="h-12 px-8 text-base">
                أنا أستاذ
              </Button>
            </div>
          </div>
          <div className="relative animate-scale-in">
            <div className="absolute inset-0 bg-gradient-primary rounded-full blur-3xl opacity-20 animate-pulse-glow" />
            <img src={heroImg} alt="طلاب يدرسون على منصة BacPath" className="relative w-full h-auto animate-float" width={1024} height={1024} />
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="container mx-auto px-4 pb-20">
        <h2 className="font-display text-3xl md:text-4xl font-extrabold text-center mb-3">كل ما تحتاجه للنجاح</h2>
        <p className="text-center text-muted-foreground mb-12">منصة شاملة مصممة خصيصاً لطلاب البكالوريا في الجزائر</p>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {[
            { icon: Target, title: "خطة يومية", desc: "مهام محددة كل يوم لتقدّم منظّم", color: "from-blue-500 to-indigo-600" },
            { icon: BookOpen, title: "تمارين تفاعلية", desc: "آلاف التمارين في كل المواد", color: "from-violet-500 to-purple-600" },
            { icon: Video, title: "دروس مباشرة", desc: "حصص مع أساتذة مختصين", color: "from-pink-500 to-rose-600" },
            { icon: Trophy, title: "نظام مكافآت", desc: "نقاط، مستويات، وشارات إنجاز", color: "from-amber-500 to-orange-600" },
          ].map((f, i) => (
            <Card key={i} className="p-6 card-hover bg-gradient-card border-border/60">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center mb-4 shadow-md`}>
                <f.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-lg mb-1">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </Card>
          ))}
        </div>
      </section>

      {/* Auth modal */}
      {showAuth && (
        <div className="fixed inset-0 bg-foreground/40 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in" onClick={() => setShowAuth(false)}>
          <Card className="w-full max-w-md p-7 animate-scale-in" onClick={e => e.stopPropagation()}>
            <div className="text-center mb-5">
              <div className="h-12 w-12 rounded-xl bg-gradient-primary mx-auto flex items-center justify-center mb-3 shadow-primary">
                <GraduationCap className="h-7 w-7 text-white" />
              </div>
              <h3 className="font-display text-2xl font-bold">مرحباً بك في BacPath</h3>
              <p className="text-sm text-muted-foreground mt-1">سجّل الدخول للمتابعة</p>
            </div>

            <Tabs value={role} onValueChange={(v) => setRole(v as "student" | "teacher")} className="mb-4">
              <TabsList className="grid grid-cols-2 w-full">
                <TabsTrigger value="student">👨‍🎓 طالب</TabsTrigger>
                <TabsTrigger value="teacher">👨‍🏫 أستاذ</TabsTrigger>
              </TabsList>
              <TabsContent value="student" />
              <TabsContent value="teacher" />
            </Tabs>

            <Button type="button" onClick={() => login(role)} variant="outline" className="w-full mb-3 h-11 gap-2">
              <svg className="h-5 w-5" viewBox="0 0 24 24"><path fill="#4285f4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34a853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#fbbc05" d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.61z"/><path fill="#ea4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z"/></svg>
              متابعة باستخدام Google
            </Button>

            <div className="relative my-4">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t" /></div>
              <span className="relative bg-card px-3 text-xs text-muted-foreground mx-auto block w-fit">أو</span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <Label htmlFor="name" className="text-sm">الاسم الكامل</Label>
                <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="اكتب اسمك" className="h-11" />
              </div>
              <div>
                <Label htmlFor="email" className="text-sm">البريد الإلكتروني</Label>
                <div className="relative">
                  <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="example@bacpath.dz" className="h-11 pr-9" />
                </div>
              </div>
              <div>
                <Label htmlFor="password" className="text-sm">كلمة المرور</Label>
                <div className="relative">
                  <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="password" type="password" placeholder="••••••••" className="h-11 pr-9" />
                </div>
              </div>
              <Button type="submit" className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-primary mt-2">
                دخول
              </Button>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

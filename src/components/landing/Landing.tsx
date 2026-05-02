import { useNavigate } from "react-router-dom";
import heroImg from "@/assets/hero-students.png";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, Sparkles, Trophy, Video, BookOpen, Target, ChevronLeft } from "lucide-react";

export default function Landing() {
  const navigate = useNavigate();
  const goAuth = () => navigate("/auth");

  return (
    <div className="min-h-screen bg-mesh">
      <header className="container mx-auto px-4 py-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-10 w-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-primary">
            <GraduationCap className="h-6 w-6 text-white" />
          </div>
          <span className="font-display text-2xl font-extrabold text-gradient">BacPath</span>
        </div>
        <Button onClick={goAuth} className="bg-gradient-primary hover:opacity-95 shadow-primary">
          تسجيل الدخول
        </Button>
      </header>

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
              <Button size="lg" onClick={goAuth} className="bg-gradient-primary hover:opacity-95 shadow-primary text-base h-12 px-8">
                ابدأ الآن مجاناً
                <ChevronLeft className="h-5 w-5 mr-1" />
              </Button>
              <Button size="lg" variant="outline" onClick={goAuth} className="h-12 px-8 text-base">
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
    </div>
  );
}

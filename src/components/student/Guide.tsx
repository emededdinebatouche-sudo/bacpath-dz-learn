import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Compass, Clock, BookOpenCheck, ShieldAlert, AlertTriangle, Sparkles, CalendarCheck, LucideIcon } from "lucide-react";

type Article = {
  id: string;
  icon: LucideIcon;
  title: string;
  short: string;
  body: string[];
};

const ARTICLES: Article[] = [
  {
    id: "time",
    icon: Clock,
    title: "كيف نظمت وقتي",
    short: "طريقة تنظيم الوقت التي اتبعتها طوال السنة",
    body: [
      "قسمت يومي إلى ثلاث فترات: صباحية للمواد العلمية الثقيلة، مسائية للحفظ، وليلية للمراجعة الخفيفة.",
      "اعتمدت تقنية بومودورو: 25 دقيقة تركيز + 5 دقائق راحة، وكل 4 جولات استراحة 20 دقيقة.",
      "خصصت يوم الجمعة لمراجعة كل ما درسته في الأسبوع، وليس لتعلّم جديد.",
      "نمت 7 ساعات على الأقل — السهر يقتل الحفظ ويرهق الذاكرة.",
    ],
  },
  {
    id: "study",
    icon: BookOpenCheck,
    title: "طريقة دراستي",
    short: "خطوات الدراسة الفعّالة التي اعتمدتها",
    body: [
      "ابدأ بقراءة سريعة للدرس لفهم الفكرة العامة قبل الدخول في التفاصيل.",
      "لخّص بخط يدك — الكتابة تثبّت المعلومة أكثر من القراءة فقط.",
      "حلّ تمارين فورًا بعد كل درس، لا تؤجل التطبيق.",
      "اشرح الدرس لنفسك بصوت مرتفع كأنك أستاذ — هذه أفضل طريقة لاكتشاف الثغرات.",
    ],
  },
  {
    id: "focus",
    icon: ShieldAlert,
    title: "محاربة السلبية والتشتت",
    short: "كيف تتغلب على الكسل والإرهاق",
    body: [
      "ضع الهاتف في غرفة أخرى أثناء الدراسة — وجوده وحده يشتت التركيز.",
      "ابدأ بـ 10 دقائق فقط عندما تشعر بالكسل، غالبًا ستكمل ساعة كاملة.",
      "حدّد هدفًا واضحًا لكل جلسة دراسة: \"سأنهي هذا التمرين\" بدل \"سأدرس قليلاً\".",
      "كافئ نفسك بعد كل إنجاز صغير — الدماغ يحب المكافآت.",
    ],
  },
  {
    id: "mistakes",
    icon: AlertTriangle,
    title: "أخطاء يجب تجنبها",
    short: "أكثر الأخطاء التي رأيتها وتجنبتها",
    body: [
      "الاعتماد على ملخصات الآخرين فقط دون فهم الدرس من المصدر.",
      "تأجيل المراجعة إلى آخر شهر — المراجعة الأخيرة تثبيت لا تعلّم.",
      "إهمال المواد ذات المعامل المنخفض — كل نقطة مهمة في المعدل العام.",
      "مقارنة نفسك بالآخرين بدل التركيز على تطورك الشخصي.",
    ],
  },
  {
    id: "tips",
    icon: Sparkles,
    title: "نصائح سريعة",
    short: "نصائح ذهبية ستوفر عليك الكثير",
    body: [
      "احفظ القوانين والمعادلات في بطاقات صغيرة وراجعها يوميًا قبل النوم.",
      "حلّ مواضيع البكالوريا للسنوات السابقة — الأسئلة تتكرر بأنماط مشابهة.",
      "اشرب الماء بكثرة وقلل من السكريات أثناء فترات المراجعة.",
      "ثق في تحضيرك يوم الامتحان، التوتر يضيع نصف ما حفظته.",
    ],
  },
  {
    id: "final-week",
    icon: CalendarCheck,
    title: "جدول المراجعة الأخيرة",
    short: "كيف تراجع في آخر أسبوع قبل البكالوريا",
    body: [
      "اليوم 1-2: مراجعة المواد ذات المعامل العالي عبر الملخصات فقط.",
      "اليوم 3-4: حل موضوعين كاملين من بكالوريات سابقة في ظروف الامتحان.",
      "اليوم 5: مراجعة سريعة للقوانين والصيغ المهمة.",
      "اليوم 6: راحة نسبية، مراجعة خفيفة، نوم مبكر.",
      "اليوم 7 (يوم الامتحان): اقرأ ملخصاتك القصيرة فقط، وادخل بثقة.",
    ],
  },
];

export default function Guide() {
  const [active, setActive] = useState<Article | null>(null);

  return (
    <div className="space-y-8 pb-24 lg:pb-8">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12 text-white shadow-primary">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold mb-4">
            <Compass className="h-4 w-4" />
            دليلي
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">
            دليلي - تجربتي مع البكالوريا
          </h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            قصص نجاح حقيقية من طلاب جزائريين
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {ARTICLES.map((article) => {
          const Icon = article.icon;
          return (
            <Card key={article.id} className="card-hover bg-gradient-card border-border/60">
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary mb-3">
                  <Icon className="h-6 w-6 text-white" />
                </div>
                <CardTitle className="text-xl">{article.title}</CardTitle>
                <CardDescription className="leading-relaxed">{article.short}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={() => setActive(article)}
                  variant="outline"
                  className="w-full border-primary/30 text-primary hover:bg-gradient-primary hover:text-white hover:border-transparent transition-smooth"
                >
                  اقرأ أكثر
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </section>

      {/* Article modal */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto" dir="rtl">
          {active && (
            <>
              <DialogHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="h-11 w-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
                    <active.icon className="h-5 w-5 text-white" />
                  </div>
                  <DialogTitle className="text-2xl text-right">{active.title}</DialogTitle>
                </div>
                <DialogDescription className="text-right text-base">{active.short}</DialogDescription>
              </DialogHeader>
              <ul className="space-y-3 mt-4">
                {active.body.map((p, i) => (
                  <li key={i} className="flex gap-3 p-4 rounded-xl bg-muted/50 border border-border/60">
                    <span className="flex-shrink-0 h-7 w-7 rounded-full bg-gradient-primary text-white text-sm font-bold flex items-center justify-center">
                      {i + 1}
                    </span>
                    <p className="leading-relaxed text-foreground/90">{p}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

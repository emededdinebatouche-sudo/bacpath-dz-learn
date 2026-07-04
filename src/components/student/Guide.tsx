import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Compass, ArrowRight, Target, BookOpenCheck, Sparkles, GraduationCap, Quote } from "lucide-react";

type Stream =
  | "علوم تجريبية"
  | "رياضيات"
  | "تقني رياضي"
  | "آداب وفلسفة"
  | "لغات أجنبية";

type Story = {
  id: string;
  name: string;
  stream: Stream;
  average: string;
  quote: string;
  challenge: string;
  method: string;
  goldenTip: string;
};

const STREAMS: Stream[] = [
  "علوم تجريبية",
  "رياضيات",
  "تقني رياضي",
  "آداب وفلسفة",
  "لغات أجنبية",
];

const STORIES: Story[] = [
  {
    id: "amina",
    name: "أمينة بلحاج",
    stream: "علوم تجريبية",
    average: "18.42",
    quote: "لم أكن الأذكى في القسم، لكنني كنت الأكثر انتظامًا. الانضباط يهزم الموهبة كل مرة.",
    challenge:
      "كنت أعاني من رهبة مادة العلوم الطبيعية بسبب كثرة المصطلحات، وفي بداية السنة كان معدلي فيها 09/20 وكنت على وشك اليأس.",
    method:
      "قسّمت الدروس إلى بطاقات صغيرة بألوان مختلفة، وخصصت 45 دقيقة يوميًا فقط لهذه المادة قبل النوم. حللت كل مواضيع البكالوريا لآخر 10 سنوات وصحّحتها بنفسي.",
    goldenTip:
      "لا تقارن نفسك بالآخرين، قارن نفسك بنفسك قبل شهر. لو تحسّنت ولو قليلاً، فأنت على الطريق الصحيح.",
  },
  {
    id: "yacine",
    name: "ياسين مرابط",
    stream: "رياضيات",
    average: "19.08",
    quote: "الرياضيات ليست موهبة، هي عادة يومية. من يحل تمرينًا كل يوم يصل، ومن ينتظر الإلهام يخسر.",
    challenge:
      "أتيت من ثانوية في قرية بولاية الأغواط، وشعرت أن طلاب المدن يسبقونني بأشواط، خاصة في المسائل المعقدة للتحليل الرياضي.",
    method:
      "استعملت الإنترنت بذكاء: قنوات يوتيوب جزائرية، ومنتديات لطلاب سابقين. وضعت لنفسي هدفًا: 5 تمارين يوميًا مهما كان، حتى في العطل.",
    goldenTip:
      "ابدأ بأصعب تمرين في اليوم وأنت في قمة تركيزك. الباقي سيصبح سهلاً بعدها.",
  },
  {
    id: "khadija",
    name: "خديجة زروقي",
    stream: "آداب وفلسفة",
    average: "17.85",
    quote: "شعبة الآداب ليست للحفظ الأعمى، هي شعبة التفكير. من يفهم الفلسفة يفهم الحياة.",
    challenge:
      "كان الجميع يقول لي إن شعبة الآداب لا مستقبل لها، وكنت أفقد الحماس. كما أن مادة الفلسفة كانت لغزًا حقيقيًا في السداسي الأول.",
    method:
      "قرأت مقالات فلسفية خارج المقرر لأفهم روح المادة، ودرّبت نفسي على كتابة مقال كامل كل أسبوع. راجعت التاريخ والجغرافيا عبر الخرائط الذهنية.",
    goldenTip:
      "في مواد الحفظ، لا تحفظ الجملة، افهم الفكرة ثم أعد صياغتها بأسلوبك. المصحح يميز الطالب المفكر فورًا.",
  },
];

const SECTION_ICONS = {
  challenge: Target,
  method: BookOpenCheck,
  tip: Sparkles,
};

export default function Guide() {
  const [filter, setFilter] = useState<string>("all");
  const [active, setActive] = useState<Story | null>(null);

  const filtered = useMemo(
    () => (filter === "all" ? STORIES : STORIES.filter((s) => s.stream === filter)),
    [filter],
  );

  if (active) {
    const Challenge = SECTION_ICONS.challenge;
    const Method = SECTION_ICONS.method;
    const Tip = SECTION_ICONS.tip;
    return (
      <div className="space-y-6 pb-24 lg:pb-8" dir="rtl">
        <Button
          onClick={() => setActive(null)}
          variant="ghost"
          className="gap-2 text-primary hover:bg-primary/10"
        >
          <ArrowRight className="h-4 w-4" />
          العودة إلى كل القصص
        </Button>

        {/* Student header */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12 text-white shadow-primary">
          <div className="absolute inset-0 bg-mesh opacity-30" />
          <div className="relative flex flex-col md:flex-row md:items-center gap-6">
            <div className="h-20 w-20 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0">
              <GraduationCap className="h-10 w-10" />
            </div>
            <div className="flex-1">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-3">{active.name}</h1>
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-white/20 hover:bg-white/25 border-0 text-white text-sm">
                  {active.stream}
                </Badge>
                <Badge className="bg-white/20 hover:bg-white/25 border-0 text-white text-sm">
                  معدل الباك: {active.average}
                </Badge>
              </div>
            </div>
          </div>
        </section>

        {/* Sections */}
        <div className="grid gap-4">
          {[
            { icon: Challenge, title: "التحدي", body: active.challenge },
            { icon: Method, title: "الطريقة", body: active.method },
            { icon: Tip, title: "النصيحة الذهبية", body: active.goldenTip },
          ].map((s) => {
            const Icon = s.icon;
            return (
              <Card key={s.title} className="bg-gradient-card border-border/60">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="h-11 w-11 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary">
                      <Icon className="h-5 w-5 text-primary-foreground" />
                    </div>
                    <CardTitle className="text-xl">{s.title}</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="leading-relaxed text-foreground/90 text-base">{s.body}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-24 lg:pb-8" dir="rtl">
      {/* Hero */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-hero p-8 md:p-12 text-white shadow-primary">
        <div className="absolute inset-0 bg-mesh opacity-30" />
        <div className="relative">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/15 backdrop-blur text-sm font-semibold mb-4">
            <Compass className="h-4 w-4" />
            دليلي
          </div>
          <h1 className="text-3xl md:text-5xl font-extrabold mb-3 leading-tight">دليلي</h1>
          <p className="text-lg md:text-xl text-white/90 max-w-2xl">
            قصص نجاح حقيقية من طلاب جزائريين
          </p>
        </div>
      </section>

      {/* Filter */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
        <label className="text-sm font-semibold text-foreground/80">تصفية حسب الشعبة:</label>
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-64">
            <SelectValue placeholder="كل الشعب" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">كل الشعب</SelectItem>
            {STREAMS.map((s) => (
              <SelectItem key={s} value={s}>
                {s}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Grid */}
      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filtered.map((story) => (
          <Card
            key={story.id}
            className="card-hover bg-gradient-card border-border/60 flex flex-col"
          >
            <CardHeader>
              <div className="flex items-start gap-3 mb-2">
                <div className="h-12 w-12 rounded-2xl bg-gradient-primary flex items-center justify-center shadow-primary shrink-0">
                  <GraduationCap className="h-6 w-6 text-primary-foreground" />
                </div>
                <div className="flex-1 min-w-0">
                  <CardTitle className="text-lg leading-tight mb-1">{story.name}</CardTitle>
                  <div className="flex flex-wrap gap-1.5">
                    <Badge variant="secondary" className="text-xs">
                      {story.stream}
                    </Badge>
                    <Badge className="text-xs bg-gradient-primary border-0 text-primary-foreground">
                      {story.average}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="flex flex-col flex-1 gap-4">
              <div className="relative flex-1 p-4 rounded-xl bg-muted/50 border border-border/60">
                <Quote className="absolute top-2 left-2 h-4 w-4 text-primary/40" />
                <p className="text-sm leading-relaxed text-foreground/90 pr-2">
                  {story.quote}
                </p>
              </div>
              <Button
                onClick={() => setActive(story)}
                variant="outline"
                className="w-full border-primary/30 text-primary hover:bg-gradient-primary hover:text-primary-foreground hover:border-transparent transition-smooth"
              >
                اقرأ القصة
              </Button>
            </CardContent>
          </Card>
        ))}
        {filtered.length === 0 && (
          <p className="text-muted-foreground col-span-full text-center py-12">
            لا توجد قصص في هذه الشعبة بعد.
          </p>
        )}
      </section>
    </div>
  );
}

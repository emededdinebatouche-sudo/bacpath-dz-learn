import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { GraduationCap, Mail, Lock, User as UserIcon, ChevronLeft } from "lucide-react";

const STREAMS = [
  { value: "sciences", label: "علوم تجريبية" },
  { value: "math", label: "رياضيات" },
  { value: "technical_math", label: "تقني رياضي" },
  { value: "letters_philosophy", label: "آداب وفلسفة" },
  { value: "foreign_languages", label: "لغات أجنبية" },
  { value: "management_economics", label: "تسيير واقتصاد" },
];

const signupSchema = z.object({
  fullName: z.string().trim().min(2, "الاسم قصير جداً").max(100),
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  password: z.string().min(6, "كلمة المرور 6 أحرف على الأقل").max(72),
  role: z.enum(["student", "teacher"]),
  stream: z.string().optional(),
});

const loginSchema = z.object({
  email: z.string().trim().email("بريد إلكتروني غير صالح").max(255),
  password: z.string().min(1, "أدخل كلمة المرور").max(72),
});

export default function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [submitting, setSubmitting] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"student" | "teacher">("student");
  const [stream, setStream] = useState<string>("sciences");

  const redirectFor = async (email: string | undefined, userId: string) => {
    if (email === "batoucheimad0@gmail.com") return "/admin";
    const { data: roleRow } = await supabase.from("user_roles").select("role").eq("user_id", userId).maybeSingle();
    if (roleRow?.role === "teacher") return "/teacher";
    return "/dashboard";
  };

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session) {
        const path = await redirectFor(session.user.email, session.user.id);
        navigate(path, { replace: true });
      }
    });
  }, [navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "signup") {
        const parsed = signupSchema.safeParse({ fullName, email, password, role, stream: role === "student" ? stream : undefined });
        if (!parsed.success) {
          toast({ title: "خطأ", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: {
              full_name: parsed.data.fullName,
              role: parsed.data.role,
              stream: parsed.data.stream,
            },
          },
        });
        if (error) {
          const msg = error.message.includes("already") ? "هذا البريد مسجّل مسبقاً" : error.message;
          toast({ title: "تعذّر إنشاء الحساب", description: msg, variant: "destructive" });
          return;
        }
        toast({ title: "تم إنشاء الحساب", description: "مرحباً بك في BacPath" });
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (s2) {
          const path = await redirectFor(s2.user.email, s2.user.id);
          navigate(path, { replace: true });
        } else {
          navigate("/auth", { replace: true });
        }
      } else {
        const parsed = loginSchema.safeParse({ email, password });
        if (!parsed.success) {
          toast({ title: "خطأ", description: parsed.error.issues[0].message, variant: "destructive" });
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          const msg = error.message.includes("Invalid") ? "البريد أو كلمة المرور غير صحيحة" : error.message;
          toast({ title: "تعذّر تسجيل الدخول", description: msg, variant: "destructive" });
          return;
        }
        const { data: { session: s2 } } = await supabase.auth.getSession();
        if (s2) {
          const path = await redirectFor(s2.user.email, s2.user.id);
          navigate(path, { replace: true });
        }
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-7 animate-scale-in">
        <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4">
          <ChevronLeft className="h-4 w-4" /> العودة
        </button>
        <div className="text-center mb-5">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary mx-auto flex items-center justify-center mb-3 shadow-primary">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">مرحباً بك في BacPath</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {mode === "login" ? "سجّل الدخول للمتابعة" : "أنشئ حسابك في دقيقة"}
          </p>
        </div>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "login" | "signup")} className="mb-4">
          <TabsList className="grid grid-cols-2 w-full">
            <TabsTrigger value="login">تسجيل الدخول</TabsTrigger>
            <TabsTrigger value="signup">إنشاء حساب</TabsTrigger>
          </TabsList>
        </Tabs>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === "signup" && (
            <>
              <div>
                <Label htmlFor="name" className="text-sm">الاسم الكامل</Label>
                <div className="relative">
                  <UserIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="name" value={fullName} onChange={e => setFullName(e.target.value)} placeholder="اسمك الكامل" className="h-11 pr-9" />
                </div>
              </div>

              <div>
                <Label className="text-sm mb-2 block">أنت...</Label>
                <RadioGroup value={role} onValueChange={(v) => setRole(v as "student" | "teacher")} className="grid grid-cols-2 gap-2">
                  <Label htmlFor="r-student" className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${role === "student" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="student" id="r-student" />
                    <span>👨‍🎓 طالب</span>
                  </Label>
                  <Label htmlFor="r-teacher" className={`flex items-center gap-2 border rounded-lg p-3 cursor-pointer transition ${role === "teacher" ? "border-primary bg-primary/5" : "border-border"}`}>
                    <RadioGroupItem value="teacher" id="r-teacher" />
                    <span>👨‍🏫 أستاذ</span>
                  </Label>
                </RadioGroup>
              </div>

              {role === "student" && (
                <div>
                  <Label className="text-sm">الشعبة</Label>
                  <Select value={stream} onValueChange={setStream}>
                    <SelectTrigger className="h-11"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STREAMS.map(s => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </>
          )}

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
              <Input id="password" type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="h-11 pr-9" />
            </div>
          </div>

          <Button type="submit" disabled={submitting} className="w-full h-11 bg-gradient-primary hover:opacity-95 shadow-primary mt-2">
            {submitting ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

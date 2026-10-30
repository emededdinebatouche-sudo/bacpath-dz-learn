import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { KeyRound, Lock } from "lucide-react";

export default function ResetPassword() {
  const navigate = useNavigate();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setReady(true);
    });
    supabase.auth.getSession().then(({ data: { session } }) => { if (session) setReady(true); });
    return () => sub.subscription.unsubscribe();
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) return toast({ title: "كلمة المرور 6 أحرف على الأقل", variant: "destructive" });
    if (password !== confirm) return toast({ title: "كلمتا المرور غير متطابقتين", variant: "destructive" });
    setSaving(true);
    const { data, error } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (error) return toast({ title: "تعذّر تغيير كلمة المرور", description: error.message, variant: "destructive" });
    toast({ title: "تم تغيير كلمة المرور بنجاح" });
    navigate(data.user?.email === "batoucheimad0@gmail.com" ? "/admin" : "/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md p-7 animate-scale-in">
        <div className="text-center mb-5">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary mx-auto flex items-center justify-center mb-3 shadow-primary">
            <KeyRound className="h-7 w-7 text-primary-foreground" />
          </div>
          <h1 className="font-display text-2xl font-bold">كلمة مرور جديدة</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {ready ? "اختر كلمة مرور جديدة لحسابك" : "افتح هذه الصفحة من الرابط المرسل إلى بريدك"}
          </p>
        </div>
        {ready ? (
          <form onSubmit={submit} className="space-y-3">
            <div>
              <Label htmlFor="new-password" className="text-sm">كلمة المرور الجديدة</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="new-password" type="password" value={password} onChange={e => setPassword(e.target.value)} className="h-11 pr-9" />
              </div>
            </div>
            <div>
              <Label htmlFor="confirm-password" className="text-sm">تأكيد كلمة المرور</Label>
              <div className="relative">
                <Lock className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="confirm-password" type="password" value={confirm} onChange={e => setConfirm(e.target.value)} className="h-11 pr-9" />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full h-11 bg-gradient-primary shadow-primary mt-2">
              {saving ? "..." : "حفظ كلمة المرور"}
            </Button>
          </form>
        ) : (
          <Button variant="outline" className="w-full" onClick={() => navigate("/auth")}>العودة لتسجيل الدخول</Button>
        )}
      </Card>
    </div>
  );
}

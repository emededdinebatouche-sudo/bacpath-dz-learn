import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { GraduationCap, ShieldCheck, Loader2 } from "lucide-react";

// Local typed wrapper for the beta supabase.auth.oauth namespace.
type OAuthClient = { name?: string; client_name?: string; redirect_uri?: string };
type OAuthDetails = {
  client?: OAuthClient;
  scope?: string;
  scopes?: string[];
  requested_scopes?: string[];
  redirect_url?: string;
  redirect_to?: string;
};
type OAuthResult = { data: OAuthDetails | null; error: { message: string } | null };
type OAuthDecision = { data: { redirect_url?: string; redirect_to?: string } | null; error: { message: string } | null };
type SupabaseOAuth = {
  getAuthorizationDetails(id: string): Promise<OAuthResult>;
  approveAuthorization(id: string): Promise<OAuthDecision>;
  denyAuthorization(id: string): Promise<OAuthDecision>;
};
const oauth = ((supabase.auth as unknown) as { oauth: SupabaseOAuth }).oauth;

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get("authorization_id") ?? "";
  const [details, setDetails] = useState<OAuthDetails | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError("طلب التفويض غير صالح.");
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = "/auth?next=" + encodeURIComponent(next);
        return;
      }
      setUserEmail(sess.session.user.email ?? null);
      const { data, error } = await oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) {
        window.location.href = immediate;
        return;
      }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId]);

  async function decide(approve: boolean) {
    setBusy(true);
    const { data, error } = approve
      ? await oauth.approveAuthorization(authorizationId)
      : await oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError("لم يُرجع خادم التفويض أي وجهة."); }
    window.location.href = target;
  }

  if (error) {
    return (
      <div className="min-h-screen bg-mesh flex items-center justify-center p-4" dir="rtl">
        <Card className="w-full max-w-md p-6 text-center space-y-3">
          <h1 className="font-display text-xl font-bold">تعذّر تحميل طلب الربط</h1>
          <p className="text-sm text-muted-foreground">{error}</p>
        </Card>
      </div>
    );
  }

  if (!details) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const clientName = details.client?.name || details.client?.client_name || "تطبيق خارجي";
  const scopes = details.scopes ?? details.requested_scopes ?? (details.scope ? details.scope.split(/\s+/) : []);

  return (
    <div className="min-h-screen bg-mesh flex items-center justify-center p-4" dir="rtl">
      <Card className="w-full max-w-md p-7 animate-scale-in space-y-5">
        <div className="text-center space-y-2">
          <div className="h-12 w-12 rounded-xl bg-gradient-primary mx-auto flex items-center justify-center shadow-primary">
            <GraduationCap className="h-7 w-7 text-white" />
          </div>
          <h1 className="font-display text-2xl font-bold">ربط {clientName} بحسابك</h1>
          <p className="text-sm text-muted-foreground">
            سيتمكن <span className="font-semibold">{clientName}</span> من استخدام BacPath بالنيابة عنك.
          </p>
        </div>

        <div className="rounded-xl border border-border p-3 text-sm space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <ShieldCheck className="h-4 w-4" /> الحساب الحالي
          </div>
          <div className="font-semibold">{userEmail}</div>
        </div>

        <div className="rounded-xl border border-border p-3 text-sm space-y-2">
          <div className="font-semibold">الصلاحيات المطلوبة</div>
          <ul className="list-disc pr-5 space-y-1 text-muted-foreground">
            <li>قراءة ملفك الشخصي (الاسم، الشعبة، النقاط)</li>
            <li>إدارة مهام الدراسة الخاصة بك</li>
            <li>قراءة الحصص المباشرة وأسئلة Q&amp;A</li>
            <li>نشر أسئلة في لوحة Q&amp;A باسمك</li>
          </ul>
          {scopes.length > 0 && (
            <div className="text-xs text-muted-foreground">Scopes: {scopes.join(", ")}</div>
          )}
          <p className="text-xs text-muted-foreground pt-1">
            لا يتجاوز هذا الربط سياسات وصول قاعدة البيانات في BacPath.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button variant="outline" disabled={busy} onClick={() => decide(false)}>
            رفض
          </Button>
          <Button disabled={busy} onClick={() => decide(true)} className="bg-gradient-primary shadow-primary">
            {busy ? "..." : "السماح"}
          </Button>
        </div>
      </Card>
    </div>
  );
}

import { supabase } from "@/integrations/supabase/client";

export type AuditAction = "created" | "updated" | "deleted" | "cancelled";
export type AuditEntity = "exercise" | "live_session" | "past_exam";

export const ENTITY_LABEL: Record<string, string> = {
  exercise: "تمرين",
  live_session: "حصة مباشرة",
  past_exam: "بكالوريا سابقة",
};

export const ACTION_LABEL: Record<string, string> = {
  created: "إضافة",
  updated: "تعديل",
  deleted: "حذف",
  cancelled: "إلغاء",
};

export type AuditLog = {
  id: string;
  actor_id: string;
  actor_name: string;
  actor_role: string;
  action: string;
  entity_type: string;
  entity_id: string | null;
  entity_title: string;
  details: Record<string, unknown> | null;
  created_at: string;
};

type Actor = { id: string; name?: string; role?: string } | null | undefined;

export async function logAudit(
  actor: Actor,
  action: AuditAction,
  entityType: AuditEntity,
  opts: { entityId?: string | null; title?: string; details?: Record<string, unknown> } = {}
) {
  if (!actor?.id) return;
  if (actor.role !== "admin" && actor.role !== "teacher") return;
  const { error } = await supabase.from("audit_logs" as any).insert({
    actor_id: actor.id,
    actor_name: actor.name ?? "",
    actor_role: actor.role ?? "",
    action,
    entity_type: entityType,
    entity_id: opts.entityId ?? null,
    entity_title: opts.title ?? "",
    details: opts.details ?? {},
  });
  if (error) console.warn("audit log failed", error.message);
}

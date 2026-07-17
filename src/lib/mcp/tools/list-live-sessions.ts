import { createClient } from "@supabase/supabase-js";
import { defineTool, type ToolContext } from "@lovable.dev/mcp-js";
import { z } from "zod";

function sb(ctx: ToolContext) {
  return createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_PUBLISHABLE_KEY!, {
    global: { headers: { Authorization: `Bearer ${ctx.getToken()}` } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export default defineTool({
  name: "list_live_sessions",
  title: "List live sessions",
  description: "List BacPath live sessions (upcoming by default). Only registered students can see the stream link.",
  inputSchema: {
    when: z.enum(["upcoming", "past", "all"]).optional().describe("Filter: upcoming (default), past, or all."),
    limit: z.number().int().min(1).max(50).optional(),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ when, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const filter = when ?? "upcoming";
    let q = sb(ctx).from("live_sessions").select("*").limit(limit ?? 20);
    const now = new Date().toISOString();
    if (filter === "upcoming") q = q.gte("scheduled_at", now).order("scheduled_at", { ascending: true });
    else if (filter === "past") q = q.lt("scheduled_at", now).order("scheduled_at", { ascending: false });
    else q = q.order("scheduled_at", { ascending: false });
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { sessions: data ?? [] },
    };
  },
});

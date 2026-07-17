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
  name: "list_tasks",
  title: "List my study tasks",
  description: "List the signed-in user's BacPath study tasks. Optionally filter by done status.",
  inputSchema: {
    done: z.boolean().optional().describe("If set, only return tasks with this done status."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ done }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx).from("tasks").select("id, title, subject, duration, points, done, created_at").eq("user_id", ctx.getUserId()).order("created_at", { ascending: true });
    if (typeof done === "boolean") q = q.eq("done", done);
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { tasks: data ?? [] },
    };
  },
});

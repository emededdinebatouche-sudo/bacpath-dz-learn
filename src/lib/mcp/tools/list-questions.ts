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
  name: "list_questions",
  title: "List Q&A questions",
  description: "List questions posted to the BacPath Q&A board, newest first.",
  inputSchema: {
    subject: z.string().trim().optional().describe("Filter by subject text."),
    answered: z.boolean().optional().describe("If set, filter by whether the question has been answered."),
    limit: z.number().int().min(1).max(50).optional().describe("Max results (default 20)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ subject, answered, limit }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    let q = sb(ctx).from("qa_questions").select("*").order("created_at", { ascending: false }).limit(limit ?? 20);
    if (subject) q = q.ilike("subject", subject);
    if (typeof answered === "boolean") {
      q = answered ? q.not("answer", "is", null) : q.is("answer", null);
    }
    const { data, error } = await q;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: JSON.stringify(data, null, 2) }],
      structuredContent: { questions: data ?? [] },
    };
  },
});

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
  name: "ask_question",
  title: "Ask a Q&A question",
  description: "Post a new question to the BacPath Q&A board on behalf of the signed-in user.",
  inputSchema: {
    subject: z.string().trim().min(1).describe("Subject (e.g. رياضيات، فيزياء)."),
    question: z.string().trim().min(3).describe("The question text."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: true },
  handler: async ({ subject, question }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data: profile } = await client.from("profiles").select("full_name").eq("id", ctx.getUserId()).maybeSingle();
    const { data, error } = await client
      .from("qa_questions")
      .insert({
        user_id: ctx.getUserId(),
        user_name: profile?.full_name || ctx.getUserEmail() || "طالب",
        subject,
        question,
      })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Question posted: ${data.id}` }],
      structuredContent: { question: data },
    };
  },
});

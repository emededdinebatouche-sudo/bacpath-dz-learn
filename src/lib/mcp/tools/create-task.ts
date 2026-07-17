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
  name: "create_task",
  title: "Create study task",
  description: "Add a new BacPath study task to the signed-in user's plan.",
  inputSchema: {
    title: z.string().trim().min(1).describe("Task title."),
    subject: z.enum(["math", "physics", "chemistry", "history"]).describe("Subject key."),
    duration: z.number().int().min(1).max(600).describe("Estimated duration in minutes."),
    points: z.number().int().min(1).max(10000).describe("Points awarded on completion."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ title, subject, duration, points }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const { data, error } = await sb(ctx)
      .from("tasks")
      .insert({ user_id: ctx.getUserId(), title, subject, duration, points, done: false })
      .select()
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    return {
      content: [{ type: "text", text: `Task created: ${data.id}` }],
      structuredContent: { task: data },
    };
  },
});

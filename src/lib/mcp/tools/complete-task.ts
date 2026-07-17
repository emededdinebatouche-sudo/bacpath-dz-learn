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
  name: "complete_task",
  title: "Mark task done",
  description: "Mark one of the signed-in user's tasks as completed and award its points.",
  inputSchema: {
    task_id: z.string().uuid().describe("Task id to mark done."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ task_id }, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const client = sb(ctx);
    const { data: task, error: tErr } = await client.from("tasks").select("id, points, done, user_id").eq("id", task_id).maybeSingle();
    if (tErr) return { content: [{ type: "text", text: tErr.message }], isError: true };
    if (!task) return { content: [{ type: "text", text: "Task not found" }], isError: true };
    if (task.done) return { content: [{ type: "text", text: "Task already completed" }], structuredContent: { task } };

    const { error: uErr } = await client.from("tasks").update({ done: true }).eq("id", task_id);
    if (uErr) return { content: [{ type: "text", text: uErr.message }], isError: true };

    const { data: profile } = await client.from("profiles").select("points").eq("id", ctx.getUserId()).maybeSingle();
    const newPoints = (profile?.points ?? 0) + (task.points ?? 0);
    const newLevel = Math.floor(newPoints / 1000) + 1;
    await client.from("profiles").update({ points: newPoints, level: newLevel }).eq("id", ctx.getUserId());

    return {
      content: [{ type: "text", text: `Task completed. Awarded ${task.points} points. Total: ${newPoints} (level ${newLevel}).` }],
      structuredContent: { task_id, awarded: task.points, points: newPoints, level: newLevel },
    };
  },
});

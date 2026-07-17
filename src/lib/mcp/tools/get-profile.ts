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
  name: "get_profile",
  title: "Get my profile",
  description: "Return the signed-in BacPath user's profile: name, stream, points, level, streak, and role.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated()) return { content: [{ type: "text", text: "Not authenticated" }], isError: true };
    const uid = ctx.getUserId();
    const client = sb(ctx);
    const [{ data: profile, error: pErr }, { data: role }] = await Promise.all([
      client.from("profiles").select("full_name, points, level, streak, stream, teacher_subject").eq("id", uid).maybeSingle(),
      client.from("user_roles").select("role").eq("user_id", uid).maybeSingle(),
    ]);
    if (pErr) return { content: [{ type: "text", text: pErr.message }], isError: true };
    const result = { ...profile, role: role?.role ?? "student", email: ctx.getUserEmail() };
    return {
      content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
      structuredContent: result,
    };
  },
});

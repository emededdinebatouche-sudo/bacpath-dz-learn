import { auth, defineMcp } from "@lovable.dev/mcp-js";
import getProfileTool from "./tools/get-profile";
import listTasksTool from "./tools/list-tasks";
import createTaskTool from "./tools/create-task";
import completeTaskTool from "./tools/complete-task";
import listQuestionsTool from "./tools/list-questions";
import askQuestionTool from "./tools/ask-question";
import listLiveSessionsTool from "./tools/list-live-sessions";

// Build the Supabase auth issuer from the project ref (inlined at build time by Vite).
// Never derive it from SUPABASE_URL — on Lovable Cloud that is the .lovable.cloud proxy,
// which mcp-js rejects because it does not match the discovery document's issuer.
const projectRef = import.meta.env.VITE_SUPABASE_PROJECT_ID ?? "project-ref-unset";

export default defineMcp({
  name: "bacpath-mcp",
  title: "BacPath MCP",
  version: "0.1.0",
  instructions:
    "Tools for BacPath, an Algerian baccalaureate study platform. Use these tools to read the signed-in student's profile, manage their study tasks, browse live sessions, and read or post questions to the Q&A board. All tools act as the authenticated user; database access is protected by RLS.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
  tools: [
    getProfileTool,
    listTasksTool,
    createTaskTool,
    completeTaskTool,
    listLiveSessionsTool,
    listQuestionsTool,
    askQuestionTool,
  ],
});

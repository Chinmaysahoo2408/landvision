import { createServerFn } from "@tanstack/react-start";
import { executeAiChatQuery, type AiChatPayload, type AiChatResponse } from "./openaiChatProxy";

/**
 * TanStack Start Server Function: aiChatServerFn
 *
 * Runs strictly on the server-side to execute AI decision queries
 * while keeping OPENAI_API_KEY / CLAUDE_API_KEY completely safe and isolated from browser bundles.
 */
export const aiChatServerFn = createServerFn({ method: "POST" })
  .validator((d: AiChatPayload) => d)
  .handler(async ({ data }): Promise<AiChatResponse> => {
    return await executeAiChatQuery(data);
  });

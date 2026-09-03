import { createServerFn } from "@tanstack/react-start";
import { generatePredictionExplanation, type ExplanationPayload, type ExplanationResponse } from "./claudeProxy";

/**
 * TanStack Start Server Function: explainPredictionServerFn
 *
 * Runs strictly on the server-side to generate AI narrative summaries
 * while keeping CLAUDE_API_KEY completely safe and isolated from client bundles.
 */
export const explainPredictionServerFn = createServerFn({ method: "POST" })
  .validator((d: ExplanationPayload) => d)
  .handler(async ({ data }): Promise<ExplanationResponse> => {
    return await generatePredictionExplanation(data);
  });

/**
 * LandVision AI — Server-Side Claude Explanation Proxy (§9, §26)
 *
 * CRITICAL SECURITY ENFORCEMENT:
 * 1. CLAUDE_API_KEY is read strictly server-side from process.env / server environment.
 * 2. It is NEVER exposed to client JavaScript, browser localStorage, or client network payloads.
 * 3. This function acts solely as a translator of deterministic ML predictions into clear
 *    administrative governance briefings for officers. The ML prediction is the numerical ground truth.
 */

export interface ExplanationPayload {
  projectName: string;
  projectType: string;
  state: string;
  district: string;
  predictedDelayDays: number;
  riskScore: number;
  riskCategory: string;
  delayProbability: number;
  majorFactors: Array<{ factor: string; contribution: number; detail: string }>;
  statutoryDays?: number;
}

export interface ExplanationResponse {
  success: boolean;
  explanation: string;
  keyMitigations: string[];
  provider: "Claude 3.5 Sonnet (Server Proxy)" | "Deterministic Rule Synthesis (Offline Mode)";
  timestamp: string;
  error?: string;
}

/**
 * Server-side explanation generation function.
 * Connects to Anthropic API if CLAUDE_API_KEY is configured in server env;
 * otherwise provides deterministic domain governance synthesis without failure.
 */
export async function generatePredictionExplanation(
  payload: ExplanationPayload,
): Promise<ExplanationResponse> {
  const apiKey =
    typeof process !== "undefined" && process.env
      ? process.env["CLAUDE_API_KEY"] || process.env["ANTHROPIC_API_KEY"]
      : undefined;

  const timestamp = new Date().toISOString();

  // If Anthropic API key is configured server-side, call Claude API securely
  if (apiKey && apiKey.trim().length > 10) {
    try {
      const prompt = `You are an AI Decision-Support and Governance Explainer for Ministry of Road Transport & State Land Acquisition Officers.
Explain the following deterministic Machine Learning prediction clearly, highlighting the primary bottleneck drivers and practical administrative actions.

Project Details:
- Corridor: ${payload.projectName} (${payload.projectType})
- Location: ${payload.district}, ${payload.state}
- ML Predicted Delay: ${payload.predictedDelayDays} days
- Risk Level: ${payload.riskCategory} (Score: ${payload.riskScore}/100, Delay Probability: ${payload.delayProbability}%)
- Primary Bottlenecks:
${payload.majorFactors.map((f) => `  * ${f.factor} (${f.contribution}% risk weight): ${f.detail}`).join("\n")}

Respond with:
1. Executive Narrative Summary (2-3 concise sentences explaining the core delay cause).
2. 3 Actionable Governance Interventions for the District Collector and CALA.`;

      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
          "x-api-key": apiKey.trim(),
          "anthropic-version": "2023-06-01",
          "content-type": "application/json",
        },
        body: JSON.stringify({
          model: "claude-3-5-sonnet-20241022",
          max_tokens: 600,
          messages: [{ role: "user", content: prompt }],
        }),
      });

      if (res.ok) {
        const data = await res.json() as { content?: Array<{ text?: string }> };
        const text = data.content?.[0]?.text;
        if (text) {
          return {
            success: true,
            explanation: text,
            keyMitigations: [
              "Deploy Special Land Acquisition Officer (SLAO) rapid-response camp for Section 3G awards.",
              "Schedule pre-litigation Lok Adalat session for title dispute settlements.",
              "Fast-track Stage-II MoEFCC forest compliance portal upload with designated DFO liaison.",
            ],
            provider: "Claude 3.5 Sonnet (Server Proxy)",
            timestamp,
          };
        }
      }
    } catch {
      // Safe fallback to deterministic synthesis below
    }
  }

  // Deterministic domain synthesis fallback (Zero hallucination rule)
  const topFactor = payload.majorFactors[0]?.factor || "Administrative Clearances";
  const secondFactor = payload.majorFactors[1]?.factor || "Compensation Disbursal";

  const syntheticExplanation = `The deterministic XGBoost prediction engine forecasts approximately ${payload.predictedDelayDays} days of acquisition slippage for ${payload.projectName} in ${payload.district}, ${payload.state}. The corridor is categorized at ${payload.riskCategory} risk (${payload.riskScore}/100 score) primarily driven by friction in ${topFactor} (${payload.majorFactors[0]?.contribution ?? 32}% weight) alongside secondary bottlenecks in ${secondFactor}. Statutory milestones require immediate intervention by the District Land Acquisition Task Force to prevent timeline overrun.`;

  return {
    success: true,
    explanation: syntheticExplanation,
    keyMitigations: [
      `Expedite resolution of ${topFactor} through dedicated revenue officer deputation.`,
      `Establish direct beneficiary bank transfer verification desks to accelerate compensation disbursal past 85%.`,
      `Deploy district coordination liaison to clear statutory compliance bottlenecks with state regulatory bodies.`,
    ],
    provider: "Deterministic Rule Synthesis (Offline Mode)",
    timestamp,
  };
}

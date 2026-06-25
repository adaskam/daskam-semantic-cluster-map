import { createServerFn } from "@tanstack/react-start";
import { generateText } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const PillarSchema = z.object({
  title: z.string(),
  description: z.string(),
  articles: z.array(z.string()),
  keywords: z.array(z.string()),
  internalLinks: z.array(z.string()),
  intent: z.string().optional(),
  opportunity: z.string().optional(),
});

const ClusterSchema = z.object({
  primaryTopic: z.string(),
  pillars: z.array(PillarSchema),
  mode: z.enum(["topic", "gap", "text"]).optional(),
  gapSummary: z.string().optional(),
});


export type Cluster = z.infer<typeof ClusterSchema>;

const TopicInputSchema = z.object({ topic: z.string().min(2).max(200) });

const GapInputSchema = z.object({
  url: z.string().trim().min(3).max(400),
  keywords: z.string().min(2).max(800),
  goals: z.string().max(800).optional().default(""),
  competitors: z.string().max(800).optional().default(""),
});

function extractJsonObject(text: string) {
  const trimmed = text.trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)\s*```/i)?.[1]?.trim();
  const candidate = fenced || trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("The AI response was not valid JSON. Please try again.");
  }

  return JSON.parse(candidate.slice(start, end + 1));
}

async function callModel(systemPrompt: string, userPrompt: string) {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");
  const gateway = createLovableAiGatewayProvider(key);
  const { text } = await generateText({
    model: gateway("google/gemini-3-flash-preview"),
    maxOutputTokens: 8192,
    system: systemPrompt,
    prompt: userPrompt,
  });
  return text;
}

export const generateCluster = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TopicInputSchema.parse(d))
  .handler(async ({ data }) => {
    const text = await callModel(
      "You are an expert SEO content strategist. Return only valid JSON. Do not include markdown, prose, comments, or trailing commas.",
      `Create a semantic content cluster for the primary topic: "${data.topic}".

Return exactly this JSON object shape:
{
  "primaryTopic": "${data.topic}",
  "pillars": [
    {
      "title": "Secondary content pillar",
      "description": "1-2 sentence strategic description.",
      "articles": ["Specific blog/article title", "Specific blog/article title", "Specific blog/article title"],
      "keywords": ["realistic SEO keyword", "realistic SEO keyword", "realistic SEO keyword", "realistic SEO keyword"],
      "internalLinks": ["Linking recommendation referencing another pillar or article", "Linking recommendation referencing another pillar or article"]
    }
  ]
}

Requirements:
- Include 4 to 5 pillars.
- Each pillar has 3 to 6 article titles.
- Each pillar has 4 to 8 recommended keywords.
- Each pillar has 2 to 5 internal linking recommendations.
- Be specific, modern, and actionable.
- Output JSON only.`,
    );

    try {
      const parsed = ClusterSchema.parse(extractJsonObject(text));
      return { ...parsed, mode: "topic" as const };
    } catch (error) {
      console.error("Cluster JSON parse/validation failed", error, text);
      throw new Error("The AI returned an incomplete cluster. Please try generating again.");
    }
  });

export const generateGapCluster = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => GapInputSchema.parse(d))
  .handler(async ({ data }) => {
    const goalsBlock = data.goals?.trim() ? data.goals.trim() : "(not specified — infer reasonable B2B/B2C goals from the site URL)";
    const competitorsBlock = data.competitors?.trim() ? data.competitors.trim() : "(not specified — infer 2-3 plausible competitors from the site URL and keywords)";

    const text = await callModel(
      "You are an expert SEO and content strategist specializing in search intent gap analysis. Return only valid JSON. Do not include markdown, prose, comments, or trailing commas.",
      `Perform a search intent gap analysis and build a recommended semantic content cluster.

Company site / URL: ${data.url}
Seed keywords: ${data.keywords}
Business goals: ${goalsBlock}
Known competitors: ${competitorsBlock}

Analyze the four main search intents (informational, commercial investigation, transactional, navigational) for the seed keywords. Identify where competitors likely have coverage that this site is missing, and where there's whitespace opportunity aligned to the company's goals. Use those gaps to design content pillars.

Return exactly this JSON object shape:
{
  "primaryTopic": "A concise label (3-6 words) summarizing the strategic territory",
  "gapSummary": "2-3 sentence executive summary of the biggest intent gaps and opportunities for this company vs its competitors.",
  "pillars": [
    {
      "title": "Pillar title framed around the intent gap",
      "description": "1-2 sentence strategic description tying the pillar to the company's goals.",
      "intent": "Informational | Commercial | Transactional | Navigational",
      "opportunity": "1-2 sentence rationale: what gap vs competitors this closes and why it matters to the goals.",
      "articles": ["Specific article/blog title", "Specific article/blog title", "Specific article/blog title"],
      "keywords": ["realistic SEO keyword", "realistic SEO keyword", "realistic SEO keyword", "realistic SEO keyword"],
      "internalLinks": ["Linking recommendation referencing another pillar or existing site section", "Linking recommendation"]
    }
  ]
}

Requirements:
- Include 4 to 5 pillars, each covering a distinct intent gap or opportunity.
- Mix intents across pillars (don't make them all informational).
- Each pillar has 3 to 6 article titles, 4 to 8 keywords, 2 to 5 internal linking recommendations.
- Recommendations must be specific, modern, and actionable for THIS company.
- Output JSON only.`,
    );

    try {
      const parsed = ClusterSchema.parse(extractJsonObject(text));
      return { ...parsed, mode: "gap" as const };
    } catch (error) {
      console.error("Gap cluster JSON parse/validation failed", error, text);
      throw new Error("The AI returned an incomplete analysis. Please try generating again.");
    }
  });

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
});

const ClusterSchema = z.object({
  primaryTopic: z.string(),
  pillars: z.array(PillarSchema),
});

export type Cluster = z.infer<typeof ClusterSchema>;

const TopicInputSchema = z.object({ topic: z.string().min(2).max(200) });

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
      return parsed;
    } catch (error) {
      console.error("Cluster JSON parse/validation failed", error, text);
      throw new Error("The AI returned an incomplete cluster. Please try generating again.");
    }
  });

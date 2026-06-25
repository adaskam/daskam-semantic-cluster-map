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

const TextInputSchema = z.object({
  label: z.string().max(120).optional().default(""),
  texts: z.string().min(10).max(40000),
});

export const generateTextCluster = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => TextInputSchema.parse(d))
  .handler(async ({ data }) => {
    // Split on blank lines first, then fall back to single newlines
    const raw = data.texts.trim();
    let blobs = raw.split(/\n\s*\n+/).map((s) => s.trim()).filter(Boolean);
    if (blobs.length < 4) blobs = raw.split(/\n+/).map((s) => s.trim()).filter(Boolean);
    blobs = blobs.slice(0, 80);

    const numbered = blobs.map((t, i) => `[${i + 1}] ${t.replace(/\s+/g, " ").slice(0, 600)}`).join("\n");
    const labelLine = data.label?.trim() ? `Overall corpus label/context: ${data.label.trim()}` : "";

    const text = await callModel(
      "You are an expert semantic analyst. You group short texts into semantically similar clusters and summarize each cluster. Return only valid JSON. Do not include markdown, prose, comments, or trailing commas.",
      `Group the following ${blobs.length} text snippets into 4 to 5 semantically coherent clusters based on meaning and theme. Summarize each cluster, derive keywords, and write a one-line headline for each snippet that captures its gist.
${labelLine}

Snippets:
${numbered}

Return exactly this JSON object shape:
{
  "primaryTopic": "A concise 2-5 word label that captures the whole corpus",
  "gapSummary": "2-3 sentence executive summary of what themes emerged and how snippets distribute across them.",
  "pillars": [
    {
      "title": "Cluster theme (3-6 words)",
      "description": "1-2 sentence summary of what unites this cluster.",
      "intent": "Short tag for the dominant tone/intent (e.g. Feedback, Question, Insight, Complaint, Praise)",
      "opportunity": "1-2 sentence 'so what' — what this cluster tells the reader.",
      "articles": ["Snippet 1 headline (≤80 chars) — [N]", "Snippet 2 headline — [N]"],
      "keywords": ["semantic keyword", "semantic keyword", "semantic keyword", "semantic keyword"],
      "internalLinks": ["How this cluster connects to another cluster by name", "Another cross-cluster relationship"]
    }
  ]
}

Requirements:
- Exactly 4 to 5 clusters. Every snippet must appear in exactly one cluster's articles list.
- Each article entry MUST end with the original snippet number in brackets, e.g. "Users love the dark mode — [3]".
- Article headlines are short (≤80 chars), paraphrased, written by you.
- 4 to 8 keywords per cluster, 2 to 4 internalLinks per cluster.
- Output JSON only.`,
    );

    try {
      const parsed = ClusterSchema.parse(extractJsonObject(text));
      return { ...parsed, mode: "text" as const };
    } catch (error) {
      console.error("Text cluster JSON parse/validation failed", error, text);
      throw new Error("The AI returned an incomplete clustering. Please try again.");
    }
  });


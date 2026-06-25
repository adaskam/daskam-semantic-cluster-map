import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const ClusterSchema = z.object({
  primaryTopic: z.string(),
  pillars: z.array(
    z.object({
      title: z.string(),
      description: z.string(),
      articles: z.array(z.string()),
      keywords: z.array(z.string()),
      internalLinks: z.array(z.string()),
    }),
  ),
});

export type Cluster = z.infer<typeof ClusterSchema>;

const InputSchema = z.object({ topic: z.string().min(2).max(200) });

export const generateCluster = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => InputSchema.parse(d))
  .handler(async ({ data }) => {
    const key = process.env.LOVABLE_API_KEY;
    if (!key) throw new Error("Missing LOVABLE_API_KEY");

    const gateway = createLovableAiGatewayProvider(key);

    const { experimental_output } = await generateText({
      model: gateway("google/gemini-3-flash-preview"),
      experimental_output: Output.object({ schema: ClusterSchema }),
      maxOutputTokens: 8192,
      system:
        "You are an expert SEO content strategist. Given a primary topic, design a semantic content cluster with exactly 4-5 secondary content pillars. Each pillar must include: a title, a 1-2 sentence description, 3-6 specific blog post titles (articles), 4-8 realistic SEO keywords, and 2-5 internal link suggestions referencing other pillars/articles in this cluster. Be specific, modern, and actionable.",
      prompt: `Primary topic: "${data.topic}"\n\nReturn a content cluster following the schema exactly.`,
    });

    return experimental_output as Cluster;
  });

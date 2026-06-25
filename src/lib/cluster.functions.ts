import { createServerFn } from "@tanstack/react-start";
import { generateText, Output } from "ai";
import { z } from "zod";
import { createLovableAiGatewayProvider } from "./ai-gateway.server";

const ClusterSchema = z.object({
  primaryTopic: z.string(),
  pillars: z
    .array(
      z.object({
        title: z.string(),
        description: z.string(),
        articles: z.array(z.string()).min(3).max(6),
        keywords: z.array(z.string()).min(4).max(8),
        internalLinks: z.array(z.string()).min(2).max(5),
      }),
    )
    .min(4)
    .max(5),
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
      system:
        "You are an expert SEO content strategist. Given a primary topic, design a semantic content cluster: 4-5 secondary content pillars, each with concrete blog post titles, target keywords, and internal linking suggestions (titles that link to other pillars or articles in this cluster). Be specific, modern, and actionable.",
      prompt: `Primary topic: "${data.topic}"\n\nReturn a content cluster following the schema. Article titles should be compelling and specific. Keywords should be realistic SEO terms. Internal links should reference other pillar topics or articles within this cluster.`,
    });

    return experimental_output as Cluster;
  });

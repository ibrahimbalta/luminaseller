import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const getSupabase = () => supabase;

/**
 * ELITE AI ENGINE (Pollinations & Custom Prompting)
 */
async function callAI(body: { messages: any[], systemPrompt?: string }) {
  const url = "https://text.pollinations.ai/";
  const payload = {
    messages: body.systemPrompt 
      ? [{ role: "system", content: body.systemPrompt }, ...body.messages]
      : body.messages,
    model: "openai", 
    jsonMode: true,
    cache: true,
    seed: Math.floor(Math.random() * 1000)
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) throw new Error("AI Timeout");
    const text = await res.text();
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    return { content: jsonMatch ? jsonMatch[0] : text };
  } catch (e) {
    throw e;
  }
}

// 1) ELITE DESIGN GENERATOR (Flux-Pro)
export const generateDesign = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; style: string; userId: string; niche?: string }) => 
    z.object({ prompt: z.string(), style: z.string(), userId: z.string(), niche: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const seed = Math.floor(Math.random() * 9999999);
    
    // Advanced Etsy-Seller Prompt Engineering
    const basePrompt = `high-end Etsy print-on-demand design, ${data.prompt}, ${data.style}, centered on white background, sharp vector lines, trending on pinterest, professional illustration, masterpiece quality, 8k, isolated`;
    const safePrompt = encodeURIComponent(basePrompt.replace(/[\n\r]/g, " "));
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    
    const { data: design, error } = await getSupabase()
      .from("designs")
      .insert({
        user_id: data.userId,
        prompt: data.prompt,
        style: data.style,
        image_url: imageUrl,
        niche: data.niche || ""
      })
      .select()
      .single();
        
    if (error) throw new Error(`Database error: ${error.message}`);
    return { imageUrl, designId: design.id };
  });

// 2) ETSY LISTING ARCHITECT (Deep SEO)
export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; niche: string; language: "tr" | "en" }) => 
    z.object({ prompt: z.string(), niche: z.string(), language: z.enum(["tr", "en"]) }).parse(d))
  .handler(async ({ data }) => {
    try {
      const ai = await callAI({
        systemPrompt: `You are an Elite Etsy SEO Architect. Your goal is to maximize visibility and conversion. 
        Respond ONLY with JSON: { 
          "title": "keyword-rich 140 char title", 
          "description": "persuasive description with sections (About, Features, Shipping)", 
          "tags": ["13 multi-word tags"], 
          "materials": "comma separated materials",
          "audience": "who is this for?",
          "pinterest_text": "viral pin description", 
          "tiktok_script": "hook, value, CTA" 
        }`,
        messages: [{ role: "user", content: `Design: ${data.prompt}\nNiche: ${data.niche}\nLanguage: ${data.language}` }]
      });

      return JSON.parse(ai.content);
    } catch (e) {
      return {
        title: `${data.prompt} - Unique Handmade Style`,
        description: `Experience the best of ${data.niche} with this custom ${data.prompt} design. Perfect for gifts!`,
        tags: [data.prompt, data.niche, "Gift Idea", "Etsy Shop", "POD"],
        materials: "Digital Print, High Quality Ink",
        audience: "Collectors, Gift Seekers",
        pinterest_text: "Obsessed with this design! #etsyfinds",
        tiktok_script: "Wait until you see the details on this one... Link in bio!"
      };
    }
  });

// 3) AI DESIGN COMPASS (Assistant)
export const suggestPrompts = createServerFn({ method: "POST" })
  .inputValidator((d: { idea: string; niche: string }) => z.object({ idea: z.string(), niche: z.string() }).parse(d))
  .handler(async ({ data }) => {
    try {
      const ai = await callAI({
        systemPrompt: "You are a Master POD Prompt Engineer. Convert vague ideas into winning designs. RESPOND ONLY WITH JSON: { \"suggestions\": [{ \"title\": \"Market Angle\", \"prompt\": \"Detailed Visual Prompt\" }] }",
        messages: [{ role: "user", content: `Concept: ${data.idea} (Niche: ${data.niche})` }]
      });
      return JSON.parse(ai.content);
    } catch (e) {
      return { suggestions: [{ title: "Classic", prompt: `${data.idea} vintage vector illustration` }] };
    }
  });

export const searchEtsyTrends = createServerFn({ method: "POST" })
  .inputValidator((d: { niche: string }) => z.object({ niche: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const fcKey = process.env.FIRECRAWL_API_KEY || "dummy";
    try {
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${fcKey}` },
        body: JSON.stringify({ url: `https://www.etsy.com/search?q=${encodeURIComponent(data.niche + " pod")}`, formats: ["markdown"] })
      });
      const json = await res.json();
      
      const analysis = await callAI({
        systemPrompt: "You are an Etsy Market Analyst. Identify the 'Winner' niche. JSON: { \"summary\": \"...\", \"ideas\": [...] }",
        messages: [{ role: "user", content: `Data: ${data.niche}` }]
      });
      let parsed = { summary: "Analysis complete.", ideas: [] };
      try { parsed = JSON.parse(analysis.content); } catch (e) {}

      return { 
        results: json.data?.metadata?.ogImage ? [{ title: json.data.metadata.title, imageUrl: json.data.metadata.ogImage, url: json.data.url }] : [],
        summary: parsed.summary, 
        ideas: parsed.ideas 
      };
    } catch (e) {
      return { results: [], summary: "Ready to explore.", ideas: ["Funny coffee quotes", "Retro nature art"] };
    }
  });

export const upscaleImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrl: string; prompt: string }) => z.object({ imageUrl: z.string(), prompt: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return { imageUrl: `${data.imageUrl}&enhance=true&width=2048&height=2048` };
  });

export const getUserDesigns = createServerFn({ method: "GET" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: designs } = await getSupabase().from("designs").select("*").eq("user_id", data.userId).order("created_at", { ascending: false });
    return designs || [];
  });

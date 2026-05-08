import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

// Initialize Supabase admin/server client for caching
let _supabase: any;
function getSupabase() {
  if (!_supabase) {
    _supabase = createClient(
      process.env.SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY!
    );
  }
  return _supabase;
}

const FIRECRAWL = "https://api.firecrawl.dev/v2/search";

async function callAI(body: { model: string; messages: any[]; response_format?: any }) {
  const key = process.env.GEMINI_API_KEY || import.meta.env.VITE_GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY missing. Lütfen .env dosyasına ekleyin.");
  
  // Standard Gemini models: gemini-1.5-flash, gemini-1.5-pro
  const modelName = body.model.includes("flash") ? "gemini-1.5-flash" : "gemini-1.5-pro";
  const url = `https://generativelanguage.googleapis.com/v1/models/${modelName}:generateContent?key=${key}`;
  
  const systemMessage = body.messages.find((m: any) => m.role === "system");
  const chatMessages = body.messages.filter((m: any) => m.role !== "system");

  const geminiBody: any = {
    contents: chatMessages.map((m: any) => ({
      role: m.role === "assistant" ? "model" : "user",
      parts: [{ text: m.content }]
    })),
    generation_config: {
      response_mime_type: body.response_format?.type === "json_object" ? "application/json" : "text/plain",
    }
  };

  if (systemMessage) {
    geminiBody.system_instruction = {
      parts: [{ text: systemMessage.content }]
    };
  }

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(geminiBody),
  });

  if (!res.ok) {
    const t = await res.text();
    throw new Error(`Gemini AI ${res.status}: ${t}`);
  }

  const json = await res.json();
  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
  
  // Return in a format similar to what the rest of the code expects
  return {
    choices: [
      {
        message: {
          content: text
        }
      }
    ]
  };
}

// 1) Etsy trend search via Firecrawl + AI summary
export const searchEtsyTrends = createServerFn({ method: "POST" })
  .inputValidator((d: { niche: string }) => z.object({ niche: z.string().min(2).max(100) }).parse(d))
  .handler(async ({ data }) => {
    // 1. Check Cache (Last 24 hours)
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
    const { data: cached } = await getSupabase()
      .from("trend_searches")
      .select("*")
      .eq("niche", data.niche.trim())
      .gt("created_at", yesterday)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (cached) {
      console.log(`Cache hit for niche: ${data.niche}`);
      return { 
        results: (cached.results as any[]) || [], 
        summary: cached.ai_summary || "", 
        ideas: (cached.design_ideas as string[]) || [],
        isCached: true
      };
    }

    const fcKey = process.env.FIRECRAWL_API_KEY || import.meta.env.VITE_FIRECRAWL_API_KEY;
    if (!fcKey) throw new Error("FIRECRAWL_API_KEY missing");

    const query = `best selling ${data.niche} site:etsy.com`;
    const fcRes = await fetch("https://api.firecrawl.dev/v2/search", {
      method: "POST",
      headers: { Authorization: `Bearer ${fcKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        query,
        limit: 10,
        scrapeOptions: { formats: ["markdown"], onlyMainContent: true },
      }),
    });

    if (!fcRes.ok) {
      const t = await fcRes.text();
      return { results: [], summary: `Trend araması başarısız: ${fcRes.status}`, ideas: [], error: t };
    }
    const fcJson = await fcRes.json();
    const raw = fcJson?.data?.web ?? fcJson?.data ?? fcJson?.web ?? [];
    const results = (Array.isArray(raw) ? raw : []).slice(0, 10).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      description: r.description ?? r.snippet ?? "",
      imageUrl:
        r.metadata?.ogImage ??
        r.metadata?.["og:image"] ??
        r.metadata?.twitterImage ??
        r.metadata?.image ??
        r.image ??
        "",
    }));

    const ai = await callAI({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content:
            "Sen bir Etsy POD uzmanısın. Verilen Etsy ürün listesini analiz et ve JSON döndür: {summary: string (Türkçe, 3-4 cümle, neden satıyorlar + hedef kitle), ideas: string[] (5 özgün tasarım fikri, kısa İngilizce prompt formatında)}. Sadece JSON döndür.",
        },
        {
          role: "user",
          content: `Niş: ${data.niche}\n\nÜrünler:\n${results
            .map((r: any, i: number) => `${i + 1}. ${r.title} — ${r.description}`)
            .join("\n")}`,
        },
      ],
      response_format: { type: "json_object" },
    });

    let parsed: { summary: string; ideas: string[] } = { summary: "", ideas: [] };
    try {
      parsed = JSON.parse(ai.choices?.[0]?.message?.content ?? "{}");
    } catch {}

    // Results will be saved to DB in the frontend route (trends.tsx) 
    // to associate with the current user, but this function provides the data.
    return { results, summary: parsed.summary ?? "", ideas: parsed.ideas ?? [] };
  });

// 2) Generate design image
export const generateDesign = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; style: string; referenceImageUrl?: string }) =>
    z
      .object({
        prompt: z.string().min(3).max(500),
        style: z.string().max(80),
        referenceImageUrl: z.string().url().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const flatRules = "flat standalone artwork, graphic only, no product, no mockup, white background, print-ready, high contrast";
    const fullPrompt = `${data.prompt}. Style: ${data.style}. ${flatRules}`;
    const seed = Math.floor(Math.random() * 1000000);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    return { imageUrl };
  });

// 3) Generate Etsy listing + marketing
export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; niche: string; language: "tr" | "en" }) =>
    z
      .object({
        prompt: z.string().min(3).max(500),
        niche: z.string().min(2).max(100),
        language: z.enum(["tr", "en"]),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const lang = data.language === "tr" ? "Türkçe" : "İngilizce";
    const ai = await callAI({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content: `Sen bir Etsy SEO + POD uzmanısın. ${lang} dilinde JSON döndür: {title: string (Etsy başlığı, max 140 karakter, anahtar kelimeler önde), description: string (long-form, 4-6 paragraf, hook + ürün özellikleri + bakım + hediye fikri), tags: string[] (tam 13 adet, her biri max 20 karakter), pinterest_text: string (1 pin başlığı + 2 cümle açıklama), tiktok_script: string (Hook + 3 sahne + CTA, 30 saniye)}. Sadece JSON döndür.`,
        },
        {
          role: "user",
          content: `Niş: ${data.niche}\nTasarım konsepti: ${data.prompt}`,
        },
      ],
      response_format: { type: "json_object" },
    });
    let parsed: any = {};
    try {
      parsed = JSON.parse(ai.choices?.[0]?.message?.content ?? "{}");
    } catch {}
    return {
      title: parsed.title ?? "",
      description: parsed.description ?? "",
      tags: Array.isArray(parsed.tags) ? parsed.tags.slice(0, 13) : [],
      pinterest_text: parsed.pinterest_text ?? "",
      tiktok_script: parsed.tiktok_script ?? "",
    };
  });

// 4) Upscale / Enhance Image
export const upscaleImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrl: string; prompt: string }) => 
    z.object({ imageUrl: z.string().url(), prompt: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    // For a free upscale, we can use Pollinations with a high-res modifier
    const hdPrompt = `Extremely high resolution, 4k, sharp details, vector-like quality, professional print ready, high contrast, clean lines: ${data.prompt}`;
    const seed = Math.floor(Math.random() * 1000000);
    const hdUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(hdPrompt)}?width=2048&height=2048&seed=${seed}&nologo=true&model=flux`;
    return { imageUrl: hdUrl };
  });

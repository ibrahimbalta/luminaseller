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

async function callAI(body: { messages: any[] }) {
  // Use Pollinations AI (100% Free, No Key Required, Fast)
  const url = "https://text.pollinations.ai/";
  
  const systemMessage = body.messages.find((m: any) => m.role === "system")?.content || "";
  const userMessage = body.messages.find((m: any) => m.role === "user")?.content || "";

  const payload = {
    messages: [
      { role: "system", content: systemMessage },
      { role: "user", content: userMessage }
    ],
    model: "openai", // Options: openai, mistral, llama
    jsonMode: true
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    throw new Error(`AI Hatası: ${res.status}`);
  }

  const text = await res.text();
  
  return { choices: [{ message: { content: text } }] };
}

// 1) Etsy trend search via Firecrawl + AI summary
export const searchEtsyTrends = createServerFn({ method: "POST" })
  .inputValidator((d: { niche: string }) => z.object({ niche: z.string().min(2).max(100) }).parse(d))
  .handler(async ({ data }) => {
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
      return { 
        results: (cached.results as any[]) || [], 
        summary: cached.ai_summary || "", 
        ideas: (cached.design_ideas as string[]) || [],
        isCached: true
      };
    }

    const fcKey = process.env.FIRECRAWL_API_KEY || (typeof import.meta !== 'undefined' ? import.meta.env.VITE_FIRECRAWL_API_KEY : undefined);
    if (!fcKey) throw new Error("FIRECRAWL_API_KEY eksik.");

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
      return { results: [], summary: "Etsy verisi alınamadı.", ideas: [] };
    }
    const fcJson = await fcRes.json();
    const raw = fcJson?.data?.web ?? fcJson?.data ?? fcJson?.web ?? [];
    const results = (Array.isArray(raw) ? raw : []).slice(0, 10).map((r: any) => ({
      title: r.title ?? "",
      url: r.url ?? "",
      description: r.description ?? r.snippet ?? "",
      imageUrl: r.metadata?.ogImage ?? r.metadata?.["og:image"] ?? "",
    }));

    const ai = await callAI({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content: "Sen bir Etsy POD uzmanısın. Verilen ürünleri analiz et ve JSON döndür: {summary: string (Türkçe özet), ideas: string[] (5 tasarım promptu)}. Sadece JSON."
        },
        {
          role: "user",
          content: `Niş: ${data.niche}\nÜrünler: ${results.map(r => r.title).join(", ")}`
        }
      ]
    });

    let parsed = { summary: "", ideas: [] };
    try {
      const cleanJson = ai.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch (e) {
      console.error("JSON Parse Error:", e);
    }

    return { results, summary: parsed.summary, ideas: parsed.ideas };
  });

// 2) Generate design image + Save to DB
export const generateDesign = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; style: string; userId: string; niche: string }) => 
    z.object({ prompt: z.string(), style: z.string(), userId: z.string(), niche: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    // Truncate prompt to prevent URL length issues (max ~400 chars for the core prompt)
    const truncatedPrompt = data.prompt.slice(0, 400);
    const fullPrompt = `${truncatedPrompt}. Style: ${data.style}. clean white background, standalone graphic, high contrast.`;
    const seed = Math.floor(Math.random() * 1000000);
    
    // Sanitize prompt for URL
    const safePrompt = encodeURIComponent(fullPrompt.replace(/[\n\r]/g, " "));
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    
    // Save to database
    const { data: saved, error } = await getSupabase()
      .from("designs")
      .insert({ 
        user_id: data.userId, 
        niche: data.niche, 
        style: data.style, 
        prompt: data.prompt, 
        image_url: imageUrl 
      })
      .select()
      .single();

    if (error) {
      console.error("Database save error:", error);
      // We still return the image even if DB save fails
    }

    return { imageUrl, designId: saved?.id };
  });

// 3) Generate Etsy listing
export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; niche: string; language: "tr" | "en" }) => z.object({ prompt: z.string(), niche: z.string(), language: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const ai = await callAI({
      model: "gemini-1.5-flash",
      messages: [
        {
          role: "system",
          content: `Sen bir Etsy SEO uzmanısın. JSON döndür: {title: string, description: string, tags: string[]}. Dil: ${data.language}`
        },
        {
          role: "user",
          content: `Tasarım: ${data.prompt}`
        }
      ]
    });
    let parsed = { title: "", description: "", tags: [] };
    try {
      const cleanJson = ai.choices[0].message.content.replace(/```json/g, "").replace(/```/g, "").trim();
      parsed = JSON.parse(cleanJson);
    } catch {}
    return parsed;
  });

// 4) Upscale
export const upscaleImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrl: string; prompt: string }) => z.object({ imageUrl: z.string(), prompt: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const hdUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(data.prompt + " high resolution 4k")}?width=2048&height=2048&nologo=true`;
    return { imageUrl: hdUrl };
  });

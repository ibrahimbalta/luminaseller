import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";

const getSupabase = () => supabase;

// ULTRA-FAST AI CALLER (Mistral/Llama based for speed)
async function callAI(body: any) {
  const url = "https://text.pollinations.ai/";
  const payload = {
    messages: body.messages,
    model: "mistral", // Mistral is the fastest for JSON and structured tasks
    jsonMode: true,
    cache: true
  };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) throw new Error("Turbo AI Timeout");
  const text = await res.text();
  return { choices: [{ message: { content: text } }] };
}

// 1) DEEP TREND SCAN (Turbo Mode)
export const searchEtsyTrends = createServerFn({ method: "POST" })
  .inputValidator((d: { niche: string }) => z.object({ niche: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const fcKey = process.env.FIRECRAWL_API_KEY || "dummy";
    const queries = [`best selling ${data.niche}`, `${data.niche} trending`];
    const randomQuery = queries[Math.floor(Math.random() * queries.length)];
    
    try {
      // Direct search for speed
      const res = await fetch("https://api.firecrawl.dev/v2/scrape", {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${fcKey}` },
        body: JSON.stringify({
          url: `https://www.etsy.com/search?q=${encodeURIComponent(randomQuery)}`,
          formats: ["markdown"]
        })
      });

      const json = await res.json();
      const results = (json.data?.metadata?.ogImage ? [{
        title: json.data?.metadata?.title || data.niche,
        url: json.data?.url || "",
        imageUrl: json.data?.metadata?.ogImage,
        description: json.data?.metadata?.description || "Market trend"
      }] : []).concat([
        { title: `${data.niche} Best Seller`, url: "#", imageUrl: `https://image.pollinations.ai/prompt/${encodeURIComponent(data.niche + " product photography")}?nologo=true&model=flux`, description: "Top trending item" }
      ]);

      const analysis = await callAI({
        messages: [
          { role: "system", content: "Kısa ve öz Etsy uzmanı ol. JSON: { summary: '...', ideas: ['...'] }" },
          { role: "user", content: `Analiz: ${data.niche}` }
        ]
      });

      let parsed = { summary: "Hızlı analiz tamamlandı.", ideas: [] };
      try {
        const match = analysis.choices[0].message.content.match(/\{[\s\S]*\}/);
        if (match) parsed = JSON.parse(match[0]);
      } catch (e) {}

      return { results: results.slice(0, 8), summary: parsed.summary, ideas: parsed.ideas };
    } catch (e) {
      return { results: [], summary: "Hizmet şu an yoğun.", ideas: [] };
    }
  });

// 2) TURBO FLUX GENERATION
export const generateDesign = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; style: string; userId: string; niche?: string }) => 
    z.object({ prompt: z.string(), style: z.string(), userId: z.string(), niche: z.string().optional() }).parse(d))
  .handler(async ({ data }) => {
    const seed = Math.floor(Math.random() * 1000000);
    const fullPrompt = `professional POD design, ${data.prompt}, ${data.style}, isolated on white background, high resolution, sharp details`;
    const safePrompt = encodeURIComponent(fullPrompt.replace(/[\n\r]/g, " "));
    
    // Using Flux with optimized parameters for speed
    const imageUrl = `https://image.pollinations.ai/prompt/${safePrompt}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
    
    const { data: design } = await getSupabase()
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

    return { imageUrl, designId: design?.id };
  });

export const suggestPrompts = createServerFn({ method: "POST" })
  .inputValidator((d: { idea: string; niche: string }) => z.object({ idea: z.string(), niche: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const ai = await callAI({
      messages: [
        { role: "system", content: "Hızlı prompt asistanı ol. JSON: { \"suggestions\": [{ \"title\": \"Stil\", \"prompt\": \"İngilizce\" }] }" },
        { role: "user", content: `Fikir: ${data.idea}` }
      ]
    });

    try {
      const match = ai.choices[0].message.content.match(/\{[\s\S]*\}/);
      return JSON.parse(match ? match[0] : "{\"suggestions\":[]}");
    } catch (e) {
      return { suggestions: [] };
    }
  });

// REMAINDING FUNCTIONS (Kept for compatibility)
export const generateListing = createServerFn({ method: "POST" })
  .inputValidator((d: { prompt: string; niche: string; language: "tr" | "en" }) => 
    z.object({ prompt: z.string(), niche: z.string(), language: z.enum(["tr", "en"]) }).parse(d))
  .handler(async ({ data }) => {
    const ai = await callAI({
      messages: [
        { role: "system", content: "SEO Uzmanı. JSON: { title: '', description: '', tags: [], pinterest_text: '', tiktok_script: '' }" },
        { role: "user", content: `Tasarım: ${data.prompt}` }
      ]
    });
    const match = ai.choices[0].message.content.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : "{}");
  });

export const upscaleImage = createServerFn({ method: "POST" })
  .inputValidator((d: { imageUrl: string; prompt: string }) => z.object({ imageUrl: z.string(), prompt: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return { imageUrl: `${data.imageUrl}&enhance=true` };
  });

export const getUserDesigns = createServerFn({ method: "GET" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const { data: designs } = await getSupabase()
      .from("designs")
      .select("*")
      .eq("user_id", data.userId)
      .order("created_at", { ascending: false });
    return designs || [];
  });

export const fetchEtsyOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return {
      stats: { totalSales: 42, totalRevenue: "18,450", activeOrders: 3 },
      orders: [
        { id: "ORD-9921", customer: "Alice Johnson", date: "2 saat önce", items: 2, total: "850", status: "Paid" },
      ],
      isDemo: true
    };
  });

export const fetchEtsyListings = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    return {
      listings: [
        { id: "123", title: "Retro Coffee T-Shirt", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400", price: "450", stock: 15, views: 120 },
      ],
      isDemo: true
    };
  });

import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { createClient } from "@supabase/supabase-js";

function getSupabase() {
  const url = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_URL : '');
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' ? import.meta.env?.VITE_SUPABASE_PUBLISHABLE_KEY : '');
  return createClient(url!, key!);
}

function getEtsyConfig() {
  return {
    clientId: process.env.VITE_ETSY_CLIENT_ID || process.env.ETSY_CLIENT_ID || '',
    clientSecret: process.env.ETSY_CLIENT_SECRET || '',
    redirectUri: process.env.VITE_ETSY_REDIRECT_URI || '',
  };
}

// 1) Get Etsy Auth URL
export const getEtsyAuthUrl = createServerFn({ method: "POST" })
  .handler(async () => {
    const crypto = await import('node:crypto');
    const { clientId, redirectUri } = getEtsyConfig();

    const verifier = crypto.randomBytes(32).toString("base64url");
    const challenge = crypto.createHash("sha256").update(verifier).digest("base64url");
    const state = crypto.randomBytes(16).toString("hex");

    const scopes = ["listings_r", "listings_w", "shops_r", "transactions_r"];
    const url = new URL("https://www.etsy.com/oauth/connect");
    url.searchParams.set("response_type", "code");
    url.searchParams.set("client_id", clientId);
    url.searchParams.set("redirect_uri", redirectUri);
    url.searchParams.set("scope", scopes.join(" "));
    url.searchParams.set("state", state);
    url.searchParams.set("code_challenge", challenge);
    url.searchParams.set("code_challenge_method", "S256");

    return { url: url.toString(), verifier, state };
  });

// 2) Handle Callback and Exchange Token
export const handleEtsyCallback = createServerFn({ method: "POST" })
  .inputValidator((d: { code: string; verifier: string; userId: string }) => 
    z.object({ code: z.string(), verifier: z.string(), userId: z.string() }).parse(d)
  )
  .handler(async ({ data }) => {
    const { clientId, redirectUri } = getEtsyConfig();
    
    const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        client_id: clientId,
        redirect_uri: redirectUri,
        code: data.code,
        code_verifier: data.verifier,
      }),
    });

    if (!res.ok) {
      const t = await res.text();
      throw new Error(`Etsy Token Error: ${t}`);
    }

    const tokens = await res.json();

    // Fetch Shop Name
    await fetch(`https://api.etsy.com/v3/application/shops?client_id=${clientId}`, {
       headers: { 
         "Authorization": `Bearer ${tokens.access_token}`,
         "x-api-key": clientId
       }
    });
    
    // Save to DB
    const supabase = getSupabase();
    const { error } = await supabase.from("etsy_shops").upsert({
      user_id: data.userId,
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
      expires_at: new Date(Date.now() + tokens.expires_in * 1000).toISOString(),
      is_active: true,
    }, { onConflict: "user_id" });

    if (error) throw error;
    return { success: true };
  });

// 3) Fetch Shop Listings
export const fetchEtsyListings = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { clientId } = getEtsyConfig();
    
    // Check if shop is connected
    const { data: shop } = await supabase
      .from("etsy_shops")
      .select("*")
      .eq("user_id", data.userId)
      .single();

    if (!shop || !shop.access_token) {
       // Return demo data if not connected
       return { 
         listings: [
           { id: "demo1", title: "Vintage Cat Coffee Mug - Demo", price: "24.99", stock: 12, views: 145, image: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?w=200" },
           { id: "demo2", title: "Retro 70s Sunset T-Shirt - Demo", price: "32.00", stock: 5, views: 890, image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200" }
         ],
         isDemo: true 
       };
    }

    // Actual Etsy API Call
    try {
      const res = await fetch(`https://api.etsy.com/v3/application/shops/${shop.shop_id}/listings/active`, {
        headers: {
          "Authorization": `Bearer ${shop.access_token}`,
          "x-api-key": clientId
        }
      });
      
      if (!res.ok) throw new Error("Etsy API error");
      const json = await res.json();
      
      return { 
        listings: json.results.map((l: any) => ({
          id: l.listing_id,
          title: l.title,
          price: l.price.amount / l.price.divisor,
          stock: l.quantity,
          views: l.views,
          image: l.images?.[0]?.url_170x135 || ""
        })),
        isDemo: false
      };
    } catch (e) {
      return { listings: [], error: "Etsy'den veriler çekilemedi.", isDemo: true };
    }
  });

// 4) Fetch Shop Orders
export const fetchEtsyOrders = createServerFn({ method: "POST" })
  .inputValidator((d: { userId: string }) => z.object({ userId: z.string() }).parse(d))
  .handler(async ({ data }) => {
    const supabase = getSupabase();
    const { clientId } = getEtsyConfig();

    // Check if shop is connected
    const { data: shop } = await supabase
      .from("etsy_shops")
      .select("*")
      .eq("user_id", data.userId)
      .single();

    if (!shop || !shop.access_token) {
       // Return demo data
       return { 
         orders: [
           { id: "1001", customer: "John Doe", total: "45.00", status: "Paid", date: "2024-05-06", items: 2 },
           { id: "1002", customer: "Alice Smith", total: "29.90", status: "Shipped", date: "2024-05-05", items: 1 },
           { id: "1003", customer: "Bob Brown", total: "120.00", status: "Open", date: "2024-05-07", items: 4 }
         ],
         stats: { totalSales: 154, totalRevenue: "3,450.00", activeOrders: 3 },
         isDemo: true 
       };
    }

    try {
      const res = await fetch(`https://api.etsy.com/v3/application/shops/${shop.shop_id}/receipts`, {
        headers: {
          "Authorization": `Bearer ${shop.access_token}`,
          "x-api-key": clientId
        }
      });
      
      if (!res.ok) throw new Error("Etsy API error");
      const json = await res.json();
      
      return { 
        orders: json.results.map((o: any) => ({
          id: o.receipt_id,
          customer: o.name,
          total: o.grandtotal.amount / o.grandtotal.divisor,
          status: o.is_paid ? (o.is_shipped ? "Shipped" : "Paid") : "Unpaid",
          date: new Date(o.created_timestamp * 1000).toISOString().split("T")[0],
          items: o.num_items
        })),
        stats: {
           totalSales: json.count,
           totalRevenue: "TBD",
           activeOrders: json.results.filter((o: any) => !o.is_shipped).length
        },
        isDemo: false
      };
    } catch (e) {
      return { orders: [], stats: { totalSales: 0, totalRevenue: "0", activeOrders: 0 }, isDemo: true };
    }
  });

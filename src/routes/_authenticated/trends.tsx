import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { searchEtsyTrends } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, Wand2, Search, Sparkles, TrendingUp, Star } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trends")({
  component: TrendsPage,
});



const TRENDING_NICHES = [
  { label: "👕 T-Shirts", value: "best selling t-shirts" },
  { label: "☕ Mugs", value: "personalized coffee mugs" },
  { label: "🖼️ Wall Art", value: "minimalist wall art" },
  { label: "💎 Jewelry", value: "handmade gold jewelry" },
  { label: "🧸 Baby", value: "personalized baby gifts" },
  { label: "📅 Planners", value: "digital planners 2024" },
];

function TrendsPage() {
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ results: any[]; summary: string; ideas: string[] } | null>(null);

  const { user } = useAuth();

  const [status, setStatus] = useState("");

  const run = async (term?: string) => {
    const finalTerm = (term || niche).trim();
    if (!finalTerm || !user) return;

    setLoading(true);
    setData(null);
    setStatus("Etsy trendleri taranıyor...");
    try {
      const res = await searchEtsyTrends({ data: { niche: finalTerm } });
      setStatus("AI verileri analiz ediyor...");
      setData(res);
      
      await supabase.from("trend_searches").insert({
        user_id: user.id,
        niche: finalTerm,
        results: res.results,
        ai_summary: res.summary,
        design_ideas: res.ideas,
      });

      toast.success(res.isCached ? "Trendler hafızadan yüklendi" : "Trendler bulundu");
    } catch (e: any) {
      toast.error(e.message ?? "Hata oluştu");
    } finally {
      setLoading(false);
      setStatus("");
    }
  };

  return (
    <div className="space-y-8 pb-10">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Trend Keşfi</h1>
        <p className="text-sm text-muted-foreground mt-1">Etsy'deki en çok satanları analiz edin ve kazandıran nişleri bulun.</p>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="örn: retro style gym t-shirt..."
              className="h-12 pl-10 text-lg"
              value={niche}
              onChange={(e) => setNiche(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && run()}
            />
          </div>
          <Button onClick={() => run()} size="lg" disabled={loading} className="h-12 px-8">
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Trendleri Bul"}
          </Button>
        </div>

        <div className="flex flex-wrap gap-2">
          {TRENDING_NICHES.map((tn) => (
            <button
              key={tn.value}
              onClick={() => {
                setNiche(tn.label.split(" ")[1]);
                run(tn.value);
              }}
              className="rounded-full border border-border bg-card px-4 py-1.5 text-xs font-medium transition-all hover:bg-primary hover:text-primary-foreground hover:scale-105"
            >
              {tn.label}
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="space-y-6">
          <div className="flex flex-col items-center justify-center py-10">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <p className="mt-4 text-sm font-medium animate-pulse">{status}</p>
          </div>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-64 animate-pulse rounded-xl bg-card border border-border" />
            ))}
          </div>
        </div>
      )}

      {data && (
        <div className="grid gap-8 lg:grid-cols-3 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <div className="lg:col-span-2 space-y-6">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" /> Etsy Canlı Sonuçlar
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {data.results?.map((r, i) => (
                <div key={i} className="group relative overflow-hidden rounded-xl border border-border bg-card transition-all hover:shadow-lg hover:border-primary/30">
                  <div className="aspect-[4/3] overflow-hidden bg-muted">
                    {r.imageUrl ? (
                      <img src={r.imageUrl} alt={r.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                    ) : (
                      <div className="flex h-full items-center justify-center text-muted-foreground">Resim yok</div>
                    )}
                  </div>
                  <div className="p-4">
                    <h3 className="line-clamp-1 font-semibold text-sm">{r.title}</h3>
                    <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">{r.description}</p>
                    <div className="mt-4 flex items-center justify-between">
                      <Link
                        to="/generate"
                        search={{ prompt: r.title, niche }}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-primary hover:underline"
                      >
                        <Wand2 className="h-3.5 w-3.5" /> Benzerini Üret
                      </Link>
                      <a href={r.url} target="_blank" rel="noreferrer" className="rounded-full bg-secondary p-1.5 text-secondary-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="rounded-xl border border-primary/20 bg-primary/5 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-4 opacity-10">
                 <Sparkles className="h-20 w-20" />
              </div>
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h2 className="font-bold uppercase tracking-wider text-xs">AI Pazar Analizi</h2>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground/90 font-medium">
                {data.summary}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-card p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-2">
                <Star className="h-4 w-4" /> Tasarım Fikirleri
              </h2>
              <div className="mt-4 space-y-3">
                {data.ideas?.map((idea, i) => (
                  <div key={i} className="group flex flex-col gap-2 rounded-lg border border-border/50 bg-background/50 p-4 transition-all hover:border-primary/50 hover:bg-background">
                    <p className="text-sm font-medium">{idea}</p>
                    <Link
                      to="/generate"
                      search={{ prompt: idea, niche }}
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-primary opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Wand2 className="h-3.5 w-3.5" /> Hemen Tasarla
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {!data && !loading && (
        <div className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-border py-24 text-center">
           <div className="rounded-full bg-primary/10 p-6">
              <TrendingUp className="h-12 w-12 text-primary" />
           </div>
           <h3 className="mt-6 text-xl font-bold">Keşfetmeye Hazır mısınız?</h3>
           <p className="mt-2 max-w-xs text-sm text-muted-foreground">Hemen yukarıdan bir niş girin veya popüler kategorilerden birini seçerek analize başlayın.</p>
        </div>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { searchEtsyTrends } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ExternalLink, Wand2 } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/trends")({
  component: TrendsPage,
});

function TrendsPage() {
  const [niche, setNiche] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ results: any[]; summary: string; ideas: string[] } | null>(null);
  const search = useServerFn(searchEtsyTrends);
  const { user, profile, refreshProfile } = useAuth();

  const run = async () => {
    if (!niche.trim() || !user) return;

    setLoading(true);
    setData(null);
    try {
      const res = await search({ data: { niche: niche.trim() } });
      setData(res);
      
      // Always save to user's history
      await supabase.from("trend_searches").insert({
        user_id: user.id,
        niche: niche.trim(),
        results: res.results,
        ai_summary: res.summary,
        design_ideas: res.ideas,
      });

      toast.success(res.isCached ? "Trendler hafızadan yüklendi" : "Trendler başarıyla bulundu");
    } catch (e: any) {
      toast.error(e.message ?? "Trend araması başarısız");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Etsy Trend Keşfi</h1>
        <p className="text-sm text-muted-foreground">Niş gir, en çok satanları ve AI önerilerini gör.</p>
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="örn: funny gym t-shirt, cat lover mug, teacher tote"
          value={niche}
          onChange={(e) => setNiche(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && run()}
        />
        <Button onClick={run} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Ara"}
        </Button>
      </div>

      {data && (
        <div className="space-y-6">
          {data.summary && (
            <div className="rounded-xl border border-border bg-card p-5">
              <h3 className="mb-2 text-sm font-semibold uppercase tracking-wide text-muted-foreground">AI Özeti</h3>
              <p className="text-sm leading-relaxed">{data.summary}</p>
            </div>
          )}

          {data.ideas?.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Tasarım Fikirleri</h3>
              <div className="grid gap-2 sm:grid-cols-2">
                {data.ideas.map((idea, i) => (
                  <div key={i} className="flex items-start justify-between gap-2 rounded-lg border border-border bg-card p-3">
                    <p className="text-sm">{idea}</p>
                    <Link
                      to="/generate"
                      search={{ prompt: idea, niche }}
                      className="shrink-0 inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                    >
                      <Wand2 className="h-3 w-3" /> Üret
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.results?.length > 0 && (
            <div>
              <h3 className="mb-3 text-lg font-semibold">Etsy Sonuçları</h3>
              <div className="space-y-2">
                {data.results.map((r, i) => (
                  <div
                    key={i}
                    className="flex items-start justify-between gap-3 rounded-lg border border-border bg-card p-3 hover:border-primary/40"
                  >
                    {r.imageUrl && (
                      <img src={r.imageUrl} alt="" className="h-16 w-16 shrink-0 rounded-md object-cover" />
                    )}
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-sm font-medium">{r.title}</div>
                      <div className="line-clamp-2 text-xs text-muted-foreground">{r.description}</div>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <Link
                        to="/generate"
                        search={{
                          prompt: `Similar design to: ${r.title}. ${r.description}`.slice(0, 480),
                          niche,
                          referenceImageUrl: r.imageUrl || "",
                        }}
                        className="inline-flex items-center gap-1 rounded-md bg-primary px-2.5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Wand2 className="h-3 w-3" /> Benzerini üret
                      </Link>
                      <a href={r.url} target="_blank" rel="noreferrer" title="Etsy'de aç" className="text-muted-foreground hover:text-foreground">
                        <ExternalLink className="h-4 w-4" />
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

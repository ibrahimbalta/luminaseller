import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateDesign, generateListing, upscaleImage, suggestPrompts } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Copy, Download, FileText, Sparkles, Image as ImageIcon, ArrowRight, Zap, RefreshCw } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/generate")({
  component: GeneratePage,
  validateSearch: (s: Record<string, unknown>) => ({
    prompt: typeof s.prompt === "string" ? s.prompt : "",
    niche: typeof s.niche === "string" ? s.niche : "",
    referenceImageUrl: typeof s.referenceImageUrl === "string" ? s.referenceImageUrl : "",
  }),
});

const STYLES = [
  "minimal typography",
  "retro / vintage",
  "bold quote",
  "hand-drawn illustration",
  "kawaii cute",
  "y2k aesthetic",
  "line art",
  "watercolor",
];

function GeneratePage() {
  const search = Route.useSearch();
  const { user, profile, refreshProfile } = useAuth();
  const [niche, setNiche] = useState(search.niche || "");
  const [prompt, setPrompt] = useState(search.prompt || "");
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState<"tr" | "en">("en");
  const [referenceImageUrl, setReferenceImageUrl] = useState(search.referenceImageUrl || "");
  const [variations, setVariations] = useState<{ label: string; url: string }[]>([]);
  const [varLoading, setVarLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [mockupMode, setMockupMode] = useState<"none" | "tshirt" | "mug">("none");
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [bulkResults, setBulkResults] = useState<string[]>([]);

  const [assistantOpen, setAssistantOpen] = useState(false);
  const [assistantIdea, setAssistantIdea] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  const genFn = useServerFn(generateDesign);
  const listFn = useServerFn(generateListing);
  const upscaleFn = useServerFn(upscaleImage);
  const suggestFn = useServerFn(suggestPrompts);
  const [upscaleLoading, setUpscaleLoading] = useState(false);

  const handleSuggest = async () => {
    if (!assistantIdea.trim()) return;
    setSuggestLoading(true);
    try {
      const res = await suggestFn({ data: { idea: assistantIdea, niche } });
      setSuggestions(res.suggestions || []);
    } catch (e) {
      toast.error("Öneri alınamadı");
    } finally {
      setSuggestLoading(false);
    }
  };

  const generate = async () => {
    if (!prompt.trim() || !user) return;
    const count = bulkCount || 1;

    setGenLoading(true);
    setImageUrl(null);
    setListing(null);
    setDesignId(null);
    setVariations([]);
    setBulkResults([]);
    setMockupMode("none");

    try {
      const results: string[] = [];
      for (let i = 0; i < count; i++) {
        const res = await genFn({
          data: {
            prompt: prompt.trim(),
            style,
            userId: user.id,
            niche,
          },
        });
        results.push(res.imageUrl);
        if (i === 0) setDesignId(res.designId || null);
      }
      
      setBulkResults(results);
      setImageUrl(results[0]); 
      toast.success(`${count} Tasarım Üretildi!`);
    } catch (e: any) {
      toast.error(e.message ?? "Üretim hatası");
    } finally {
      setGenLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!imageUrl || !prompt) return;
    setUpscaleLoading(true);
    try {
      const res = await upscaleFn({ data: { imageUrl, prompt } });
      setImageUrl(res.imageUrl);
      toast.success("Görsel HD Kaliteye Yükseltildi!");
    } catch (e: any) {
      toast.error("Yükseltme hatası");
    } finally {
      setUpscaleLoading(false);
    }
  };

  const writeListing = async () => {
    if (!designId || !user) return;
    setListLoading(true);
    try {
      const res = await listFn({ data: { prompt, niche: niche || prompt, language } });
      setListing(res);
      await supabase.from("listings").insert({
        user_id: user.id,
        design_id: designId,
        title: res.title,
        description: res.description,
        tags: res.tags,
        pinterest_text: res.pinterest_text,
        tiktok_script: res.tiktok_script,
        language,
      });
      toast.success("SEO Listing Hazır!");
    } catch (e: any) {
      toast.error(e.message ?? "Listing hatası");
    } finally {
      setListLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı");
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Tasarım & SEO Atölyesi</h1>
        <p className="text-sm text-muted-foreground">Fikirlerinizi profesyonel Etsy ürünlerine dönüştürün.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT: FORM */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-5">
              <div className="space-y-2">
                <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Pazar / Niş</Label>
                <Input placeholder="örn: kedi severler, kamp tutkunları" value={niche} onChange={(e) => setNiche(e.target.value)} className="bg-muted/30" />
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tasarım Konusu</Label>
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="h-7 text-[10px] uppercase font-bold text-primary bg-primary/5 hover:bg-primary/10 gap-1.5 rounded-full px-3"
                    onClick={() => setAssistantOpen(!assistantOpen)}
                  >
                    <Sparkles className="h-3 w-3" /> AI Asistanı
                  </Button>
                </div>

                {assistantOpen && (
                  <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4 animate-in slide-in-from-top-2 duration-300">
                    <div className="flex gap-2">
                      <Input 
                        placeholder="Ne tür bir tasarım istersin? (örn: kahve içen astronot)" 
                        value={assistantIdea}
                        onChange={(e) => setAssistantIdea(e.target.value)}
                        className="bg-background"
                      />
                      <Button size="sm" onClick={handleSuggest} disabled={suggestLoading}>
                        {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                      </Button>
                    </div>
                    {suggestions.length > 0 && (
                      <div className="grid gap-2">
                        {suggestions.map((s, i) => (
                          <button 
                            key={i}
                            onClick={() => { setPrompt(s.prompt); setAssistantOpen(false); }}
                            className="text-left p-3 rounded-lg bg-background border border-border/50 hover:border-primary transition-colors group"
                          >
                            <p className="text-[10px] font-bold text-primary uppercase mb-1">{s.title}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 group-hover:text-foreground">{s.prompt}</p>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <Textarea
                  rows={4}
                  placeholder="Tasarımınızı tarif edin veya AI asistanını kullanın..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="bg-muted/30 resize-none leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Stil</Label>
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Üretim Modu</Label>
                  <Select value={bulkCount.toString()} onValueChange={(v) => setBulkCount(parseInt(v))}>
                    <SelectTrigger className="bg-muted/30"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Tekil Tasarım</SelectItem>
                      <SelectItem value="3">Üçlü Paket (Hızlı)</SelectItem>
                      <SelectItem value="5">Beşli Seri (Kapsamlı)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={generate} disabled={genLoading || !prompt.trim()} className="w-full h-12 text-sm font-bold gap-2 shadow-lg shadow-primary/10" size="lg">
                {genLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-4 w-4" /> {bulkCount > 1 ? `${bulkCount} Tasarım Üretiliyor...` : "Tasarımı Üret"}</>}
              </Button>
            </CardContent>
          </Card>

          {referenceImageUrl && (
            <div className="p-4 rounded-xl border border-dashed border-border bg-muted/20 flex items-center justify-between">
              <div className="flex items-center gap-3">
                 <img src={referenceImageUrl} className="h-12 w-12 rounded-lg object-cover border" />
                 <p className="text-xs text-muted-foreground font-medium">Referans görsel aktif.</p>
              </div>
              <Button variant="ghost" size="xs" onClick={() => setReferenceImageUrl("")} className="text-muted-foreground">Kaldır</Button>
            </div>
          )}
        </div>

        {/* RIGHT: PREVIEW & RESULTS */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden min-h-[400px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1 relative aspect-square rounded-xl overflow-hidden bg-muted/30 border border-border/50 group">
                {genLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                     <div className="h-16 w-16 relative">
                        <div className="absolute inset-0 border-4 border-primary/10 border-t-primary rounded-full animate-spin" />
                        <div className="absolute inset-4 bg-primary/10 rounded-full flex items-center justify-center">
                           <Sparkles className="h-6 w-6 text-primary animate-pulse" />
                        </div>
                     </div>
                     <div className="text-center">
                        <p className="text-sm font-bold animate-pulse">Flux Motoru Çalışıyor</p>
                        <p className="text-[10px] text-muted-foreground uppercase tracking-widest mt-1">Yüksek kaliteli tasarım işleniyor...</p>
                     </div>
                  </div>
                ) : imageUrl ? (
                   <img src={imageUrl} alt="Result" className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground opacity-30">
                     <ImageIcon className="h-12 w-12 mb-4" />
                     <p className="text-sm font-medium">Tasarım Önizleme</p>
                  </div>
                )}
              </div>

              {imageUrl && !genLoading && (
                <div className="mt-6 flex flex-wrap gap-2">
                   <Button variant="outline" size="sm" className="gap-2 flex-1 h-10" onClick={() => window.open(imageUrl, '_blank')}>
                      <Download className="h-4 w-4" /> İndir
                   </Button>
                   <Button variant="outline" size="sm" className="gap-2 flex-1 h-10" onClick={handleUpscale} disabled={upscaleLoading}>
                      {upscaleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><RefreshCw className="h-4 w-4" /> Netleştir (HD)</>}
                   </Button>
                   <Button className="gap-2 w-full h-10" onClick={writeListing} disabled={listLoading}>
                      {listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="h-4 w-4" /> Listing & SEO Hazırla</>}
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {bulkResults.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {bulkResults.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImageUrl(url)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-all ${
                    imageUrl === url ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {listing && (
        <Card className="border-border/60 shadow-md animate-in slide-in-from-bottom-4 duration-700">
           <CardHeader className="border-b border-border/40 bg-muted/20 p-6">
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                 <FileText className="h-5 w-5 text-primary" /> Etsy SEO Paketi
              </CardTitle>
           </CardHeader>
           <CardContent className="p-6 space-y-6">
              <div className="grid gap-6 md:grid-cols-2">
                 <Section label="Etsy Başlığı" value={listing.title} onCopy={copy} />
                 <Section label="Etiketler (13 Adet)" value={listing.tags.join(", ")} onCopy={copy} />
              </div>
              <Section label="Ürün Açıklaması" value={listing.description} onCopy={copy} multiline />
              <div className="grid gap-6 md:grid-cols-2 pt-4 border-t border-border/40">
                 <Section label="Pinterest Pin Metni" value={listing.pinterest_text} onCopy={copy} multiline />
                 <Section label="TikTok / Reels Script" value={listing.tiktok_script} onCopy={copy} multiline />
              </div>
           </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ label, value, onCopy, multiline }: { label: string; value: string; onCopy: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
        <Button variant="ghost" size="xs" onClick={() => onCopy(value)} className="h-6 text-[10px] gap-1 hover:text-primary">
          <Copy className="h-3 w-3" /> Kopyala
        </Button>
      </div>
      <div className={`p-4 rounded-xl bg-muted/30 border border-border/40 text-sm leading-relaxed ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>
        {value}
      </div>
    </div>
  );
}

export default GeneratePage;

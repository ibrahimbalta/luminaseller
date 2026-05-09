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
import { Loader2, Wand2, Copy, Download, FileText, Sparkles, Image as ImageIcon, Zap, RefreshCw, Send } from "lucide-react";
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
  const { user } = useAuth();
  const [niche, setNiche] = useState(search.niche || "");
  const [prompt, setPrompt] = useState(search.prompt || "");
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState<"tr" | "en">("en");
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [bulkResults, setBulkResults] = useState<string[]>([]);

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
    setSuggestions([]);
    try {
      const res = await suggestFn({ data: { idea: assistantIdea, niche } });
      setSuggestions(res.suggestions || []);
    } catch (e) {
      toast.error("Hızlı öneri hatası");
    } finally {
      setSuggestLoading(false);
    }
  };

  const generate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || !user) return;

    setGenLoading(true);
    setImageUrl(null);
    setListing(null);
    setBulkResults([]);

    try {
      const res = await genFn({
        data: {
          prompt: finalPrompt.trim(),
          style,
          userId: user.id,
          niche,
        },
      });
      setImageUrl(res.imageUrl);
      setDesignId(res.designId || null);
      toast.success("Tasarım Hazır!");
    } catch (e: any) {
      toast.error("Üretim hatası");
    } finally {
      setGenLoading(false);
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
      toast.success("SEO Hazır!");
    } catch (e: any) {
      toast.error("SEO hatası");
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1">
        <h1 className="text-3xl font-semibold tracking-tight">Turbo Üretim Merkezi</h1>
        <p className="text-sm text-muted-foreground">Yapay zeka ile anında tasarım ve SEO.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* LEFT: TURBO INPUT */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm">
            <CardContent className="p-6 space-y-6">
              {/* Turbo Assistant Input */}
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Zap className="h-3 w-3 fill-current" /> Ne üretelim?
                </Label>
                <div className="relative">
                  <Input 
                    placeholder="örn: kahve içen astronot, kedi deseni..." 
                    value={assistantIdea}
                    onChange={(e) => setAssistantIdea(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                    className="h-12 bg-muted/20 border-none text-base pr-12 focus-visible:ring-primary/30"
                  />
                  <Button 
                    size="sm" 
                    onClick={handleSuggest} 
                    disabled={suggestLoading || !assistantIdea.trim()}
                    className="absolute right-1.5 top-1.5 h-9 w-9 p-0"
                  >
                    {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Instant Suggestions */}
              {suggestions.length > 0 && (
                <div className="grid gap-3 animate-in slide-in-from-top-2 duration-300">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Birini Seç ve Anında Üret:</Label>
                  <div className="space-y-2">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => { setPrompt(s.prompt); generate(s.prompt); setSuggestions([]); }}
                        disabled={genLoading}
                        className="w-full text-left p-3 rounded-xl border border-border/50 bg-muted/10 hover:bg-primary/5 hover:border-primary/30 transition-all flex items-center justify-between group"
                      >
                        <div>
                          <p className="text-[11px] font-bold text-primary mb-0.5">{s.title}</p>
                          <p className="text-xs text-muted-foreground line-clamp-1">{s.prompt}</p>
                        </div>
                        <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/40 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Manuel Müdahale</Label>
                  <Textarea
                    rows={3}
                    placeholder="Kendi promptunuzu buraya yazın..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-muted/10 border-none resize-none text-sm"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="bg-muted/10 border-none h-10 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize text-xs">{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Button 
                    onClick={() => generate()} 
                    disabled={genLoading || !prompt.trim()} 
                    className="h-10 text-xs font-bold gap-2"
                  >
                    {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="h-4 w-4" /> Manuel Üret</>}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: TURBO PREVIEW */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden min-h-[440px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/40 group">
                {genLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-3">
                     <div className="h-12 w-12 border-4 border-primary/20 border-t-primary rounded-full animate-spin" />
                     <p className="text-[11px] font-bold text-primary uppercase tracking-widest animate-pulse">Turbo Flux Aktif...</p>
                  </div>
                ) : imageUrl ? (
                   <img src={imageUrl} alt="Result" className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                     <ImageIcon className="h-10 w-10 mb-3" />
                     <p className="text-xs font-medium uppercase tracking-wider">Tasarım Bekleniyor</p>
                  </div>
                )}
              </div>

              {imageUrl && !genLoading && (
                <div className="mt-6 space-y-3 animate-in slide-in-from-bottom-2 duration-300">
                   <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 gap-2 h-10 text-xs" onClick={() => window.open(imageUrl, '_blank')}>
                         <Download className="h-3.5 w-3.5" /> İndir
                      </Button>
                      <Button variant="outline" className="flex-1 gap-2 h-10 text-xs" onClick={async () => {
                         setUpscaleLoading(true);
                         try {
                           const res = await upscaleFn({ data: { imageUrl, prompt } });
                           setImageUrl(res.imageUrl);
                           toast.success("HD Yapıldı!");
                         } finally { setUpscaleLoading(false); }
                      }} disabled={upscaleLoading}>
                         {upscaleLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <RefreshCw className="h-3.5 w-3.5" />} HD
                      </Button>
                   </div>
                   <Button className="w-full gap-2 h-11 text-xs font-bold shadow-md shadow-primary/10" onClick={writeListing} disabled={listLoading}>
                      {listLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <><FileText className="h-3.5 w-3.5" /> SEO & Listing Hazırla</>}
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {listing && (
        <Card className="border-border/60 shadow-md animate-in slide-in-from-bottom-4 duration-500 overflow-hidden">
           <CardContent className="p-0">
              <div className="p-4 bg-muted/20 border-b border-border/40 flex items-center justify-between">
                 <div className="flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-xs font-bold uppercase tracking-wider">SEO Paketi Hazır</span>
                 </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Section label="Etsy Başlığı" value={listing.title} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} />
                  <Section label="Etiketler" value={listing.tags.join(", ")} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} />
                </div>
                <Section label="Ürün Açıklaması" value={listing.description} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} multiline />
              </div>
           </CardContent>
        </Card>
      )}
    </div>
  );
}

function Section({ label, value, onCopy, multiline }: { label: string; value: string; onCopy: (v: string) => void; multiline?: boolean }) {
  return (
    <div className="space-y-2 group">
      <div className="flex items-center justify-between">
        <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</Label>
        <Button variant="ghost" size="xs" onClick={() => onCopy(value)} className="h-6 text-[10px] opacity-0 group-hover:opacity-100 transition-opacity">
          Kopyala
        </Button>
      </div>
      <div className={`p-4 rounded-xl bg-muted/10 border border-border/40 text-[13px] leading-relaxed ${multiline ? "whitespace-pre-wrap" : "truncate"}`}>
        {value}
      </div>
    </div>
  );
}

export default GeneratePage;

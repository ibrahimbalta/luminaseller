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
import { Loader2, Wand2, Copy, Download, FileText, Sparkles, Image as ImageIcon, Zap, RefreshCw, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/generate")({
  component: GeneratePage,
  validateSearch: (s: Record<string, unknown>) => ({
    prompt: typeof s.prompt === "string" ? s.prompt : "",
    niche: typeof s.niche === "string" ? s.niche : "",
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
      if (res && res.suggestions) {
        setSuggestions(res.suggestions);
      } else {
        toast.error("AI şu an meşgul, lütfen tekrar deneyin.");
      }
    } catch (e) {
      toast.error("Öneri alınamadı. Lütfen manuel deneyin.");
    } finally {
      setSuggestLoading(false);
    }
  };

  const generate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || !user) {
      toast.error("Lütfen bir tasarım konusu belirtin.");
      return;
    }

    setGenLoading(true);
    setImageUrl(null);
    setListing(null);

    try {
      const res = await genFn({
        data: {
          prompt: finalPrompt.trim(),
          style,
          userId: user.id,
          niche,
        },
      });
      if (res && res.imageUrl) {
        setImageUrl(res.imageUrl);
        setDesignId(res.designId || null);
        toast.success("Tasarım başarıyla üretildi!");
      } else {
        throw new Error("Görsel üretilemedi.");
      }
    } catch (e: any) {
      toast.error("Üretim sırasında bir sorun oluştu.");
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
      toast.success("SEO Analizi Tamamlandı!");
    } catch (e: any) {
      toast.error("SEO metinleri oluşturulamadı.");
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Tasarım Üret</h1>
        <p className="text-sm text-muted-foreground mt-1">Fikirlerinizi profesyonel Etsy ürünlerine dönüştürün.</p>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* FORM */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden">
            <CardContent className="p-6 space-y-6">
              <div className="space-y-3">
                <Label className="text-[11px] font-bold uppercase tracking-wider text-primary flex items-center gap-2">
                  <Sparkles className="h-3 w-3" /> AI Asistanı
                </Label>
                <div className="flex gap-2">
                  <Input 
                    placeholder="Bir fikir yazın (örn: kahve içen astronot)" 
                    value={assistantIdea}
                    onChange={(e) => setAssistantIdea(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                    className="h-11 bg-muted/20"
                  />
                  <Button onClick={handleSuggest} disabled={suggestLoading || !assistantIdea.trim()}>
                    {suggestLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {suggestions.length > 0 && (
                <div className="space-y-2 animate-in slide-in-from-top-2">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Önerilen Promptlar</Label>
                    <Button variant="ghost" size="xs" onClick={() => setSuggestions([])}><X className="h-3 w-3" /></Button>
                  </div>
                  <div className="grid gap-2">
                    {suggestions.map((s, i) => (
                      <button 
                        key={i}
                        onClick={() => { setPrompt(s.prompt); generate(s.prompt); setSuggestions([]); }}
                        className="text-left p-3 rounded-lg border border-border/50 bg-primary/5 hover:border-primary transition-all group"
                      >
                        <p className="text-[10px] font-bold text-primary uppercase mb-0.5">{s.title}</p>
                        <p className="text-xs text-muted-foreground line-clamp-1">{s.prompt}</p>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-border/40 space-y-4">
                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Tasarım Detayları</Label>
                  <Textarea
                    rows={4}
                    placeholder="Kendi promptunuzu yazın veya AI asistanını kullanın..."
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="bg-muted/10"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Stil</Label>
                    <Select value={style} onValueChange={setStyle}>
                      <SelectTrigger className="bg-muted/10 h-10"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {STYLES.map((s) => <SelectItem key={s} value={s} className="capitalize">{s}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-end">
                    <Button onClick={() => generate()} disabled={genLoading || !prompt.trim()} className="w-full h-10 font-bold gap-2">
                      {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Zap className="h-4 w-4" /> Üret</>}
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* PREVIEW */}
        <div className="space-y-6">
          <Card className="border-border/60 shadow-sm overflow-hidden min-h-[460px] flex flex-col">
            <CardContent className="p-6 flex-1 flex flex-col">
              <div className="flex-1 relative aspect-square rounded-2xl overflow-hidden bg-muted/20 border border-border/40">
                {genLoading ? (
                  <div className="absolute inset-0 flex flex-col items-center justify-center space-y-4">
                     <Loader2 className="h-10 w-10 animate-spin text-primary" />
                     <p className="text-xs font-bold text-primary uppercase tracking-widest animate-pulse">Görsel Üretiliyor...</p>
                  </div>
                ) : imageUrl ? (
                   <img src={imageUrl} alt="Result" className="w-full h-full object-contain animate-in fade-in zoom-in-95" />
                ) : (
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                     <ImageIcon className="h-12 w-12 mb-3" />
                     <p className="text-xs font-medium uppercase tracking-wider">Tasarım Bekleniyor</p>
                  </div>
                )}
              </div>

              {imageUrl && !genLoading && (
                <div className="mt-6 space-y-3 animate-in slide-in-from-bottom-2">
                   <div className="flex gap-2">
                      <Button variant="outline" className="flex-1 h-10" onClick={() => window.open(imageUrl, '_blank')}>
                         <Download className="h-4 w-4 mr-2" /> İndir
                      </Button>
                      <Button variant="outline" className="flex-1 h-10" onClick={async () => {
                         setUpscaleLoading(true);
                         try {
                           const res = await upscaleFn({ data: { imageUrl, prompt } });
                           setImageUrl(res.imageUrl);
                           toast.success("HD Yapıldı!");
                         } finally { setUpscaleLoading(false); }
                      }} disabled={upscaleLoading}>
                         {upscaleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <RefreshCw className="h-4 w-4 mr-2" />} HD
                      </Button>
                   </div>
                   <Button className="w-full h-11 font-bold" onClick={writeListing} disabled={listLoading}>
                      {listLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <FileText className="h-4 w-4 mr-2" />} SEO & Listing Hazırla
                   </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {listing && (
        <Card className="border-border/60 shadow-md animate-in slide-in-from-bottom-4 overflow-hidden">
           <CardContent className="p-6 space-y-6">
              <div className="flex items-center gap-2 mb-4">
                <Badge className="bg-green-500 hover:bg-green-600">SEO Hazır</Badge>
              </div>
              <div className="grid gap-6 md:grid-cols-2">
                <Section label="Etsy Başlığı" value={listing.title} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} />
                <Section label="Etiketler" value={listing.tags.join(", ")} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} />
              </div>
              <Section label="Ürün Açıklaması" value={listing.description} onCopy={(v) => { navigator.clipboard.writeText(v); toast.success("Kopyalandı"); }} multiline />
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

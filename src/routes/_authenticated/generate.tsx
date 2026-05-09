import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { generateDesign, generateListing, upscaleImage, suggestPrompts } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Copy, Download, FileText, Sparkles, Image as ImageIcon, Zap, RefreshCw, Send, X, Check, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/generate")({
  component: GeneratePage,
  validateSearch: (s: Record<string, unknown>) => ({
    prompt: typeof s.prompt === "string" ? s.prompt : "",
    niche: typeof s.niche === "string" ? s.niche : "",
  }),
});

const STYLES = [
  "Minimalist Typography",
  "Retro / Vintage Illustration",
  "Bold Quote Design",
  "Hand-Drawn Artistic",
  "Kawaii / Cute Style",
  "Y2K Aesthetic",
  "Professional Line Art",
  "Premium Watercolor",
];

function GeneratePage() {
  const search = Route.useSearch();
  const { user } = useAuth();
  
  // State
  const [niche, setNiche] = useState(search.niche || "Etsy POD");
  const [prompt, setPrompt] = useState(search.prompt || "");
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState<"tr" | "en">("en");
  
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  
  const [genLoading, setGenLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [upscaleLoading, setUpscaleLoading] = useState(false);

  const [assistantIdea, setAssistantIdea] = useState("");
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [suggestLoading, setSuggestLoading] = useState(false);

  // 1) Step 1: Brainstorm
  const handleSuggest = async () => {
    if (!assistantIdea.trim()) return;
    setSuggestLoading(true);
    setSuggestions([]);
    try {
      const res = await suggestPrompts({ data: { idea: assistantIdea, niche } });
      setSuggestions(res.suggestions || []);
      if (!res.suggestions?.length) toast.info("AI farklı bir yaklaşım deniyor...");
    } catch (e) {
      toast.error("Öneri alınamadı.");
    } finally {
      setSuggestLoading(false);
    }
  };

  // 2) Step 2: Generate
  const generate = async (customPrompt?: string) => {
    const finalPrompt = customPrompt || prompt;
    if (!finalPrompt.trim() || !user) {
      toast.error("Lütfen bir tasarım konusu belirtin.");
      return;
    }

    setGenLoading(true);
    setImageUrl(null);
    setListing(null);
    setDesignId(null);

    try {
      const res = await generateDesign({
        data: { prompt: finalPrompt.trim(), style, userId: user.id, niche },
      });
      
      setImageUrl(res.imageUrl);
      setDesignId(res.designId);
      toast.success("Tasarım Hazır! 🎨");
    } catch (e: any) {
      console.error(e);
      toast.error("Üretim sırasında bir sorun oluştu.");
    } finally {
      setGenLoading(false);
    }
  };

  // 3) Step 3: SEO Listing
  const writeListing = async () => {
    if (!designId || !user) {
      toast.error("Önce bir tasarım üretmelisiniz.");
      return;
    }
    setListLoading(true);
    try {
      const res = await generateListing({ data: { prompt, niche, language } });
      
      const { error } = await supabase.from("listings").insert({
        user_id: user.id,
        design_id: designId,
        title: res.title,
        description: res.description,
        tags: res.tags,
        pinterest_text: res.pinterest_text,
        tiktok_script: res.tiktok_script,
        language,
      });

      if (error) throw error;
      
      setListing(res);
      toast.success("Derin SEO Analizi Tamamlandı! ✨");
    } catch (e: any) {
      console.error(e);
      toast.error("SEO metinleri kaydedilemedi.");
    } finally {
      setListLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent italic">
            Elite Tasarım Stüdyosu
          </h1>
          <p className="text-muted-foreground mt-2 font-medium">Saniyeler içinde yüksek kaliteli Etsy ürünleri oluşturun.</p>
        </div>
        <div className="flex bg-muted/30 p-1 rounded-full border border-border/40">
           {["en", "tr"].map((l) => (
             <button 
               key={l}
               onClick={() => setLanguage(l as any)}
               className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${language === l ? "bg-primary text-white shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
             >
               {l.toUpperCase()}
             </button>
           ))}
        </div>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr,400px]">
        {/* SOL KOLON: KONTROLLER */}
        <div className="space-y-8">
          {/* AI ASISTAN CARD */}
          <Card className="border-primary/20 shadow-xl shadow-primary/5 bg-gradient-to-br from-card to-muted/20 overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold text-lg">AI Tasarım Pusulası</h3>
                  <p className="text-xs text-muted-foreground font-medium">Aklınızdaki fikri profesyonel bir prompt'a dönüştürün.</p>
                </div>
              </div>

              <div className="flex gap-2 p-1 bg-background border border-border/60 rounded-2xl focus-within:ring-2 focus-within:ring-primary/20 transition-all">
                <Input 
                  placeholder="örn: Vintage kahve dükkanı konsepti..." 
                  value={assistantIdea}
                  onChange={(e) => setAssistantIdea(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSuggest()}
                  className="h-12 border-0 bg-transparent focus-visible:ring-0 px-4 text-base"
                />
                <Button onClick={handleSuggest} disabled={suggestLoading || !assistantIdea.trim()} className="h-12 w-12 rounded-xl">
                  {suggestLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
                </Button>
              </div>

              {suggestions.length > 0 && (
                <div className="grid gap-3 pt-2 animate-in slide-in-from-top-4">
                  {suggestions.map((s, i) => (
                    <button 
                      key={i}
                      onClick={() => { setPrompt(s.prompt); generate(s.prompt); setSuggestions([]); }}
                      className="group flex items-center justify-between p-4 rounded-2xl border border-border/40 bg-background/50 hover:border-primary/50 hover:bg-background transition-all text-left"
                    >
                      <div className="space-y-1">
                        <span className="text-[10px] font-black text-primary uppercase tracking-widest">{s.title}</span>
                        <p className="text-sm font-semibold text-foreground/80 line-clamp-1">{s.prompt}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* MANUEL KONTROLLER */}
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                 <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Kategori (Niş)</Label>
                 <Input value={niche} onChange={(e) => setNiche(e.target.value)} className="h-11 rounded-xl bg-card border-border/60" />
               </div>
               <div className="space-y-2">
                 <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Stil</Label>
                 <Select value={style} onValueChange={setStyle}>
                    <SelectTrigger className="h-11 rounded-xl bg-card border-border/60"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STYLES.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                 </Select>
               </div>
            </div>
            <div className="space-y-2">
              <Label className="text-xs font-bold text-muted-foreground uppercase ml-1">Özel Görsel Tanımı</Label>
              <Textarea 
                value={prompt} 
                onChange={(e) => setPrompt(e.target.value)} 
                rows={3}
                placeholder="Buraya kendi promptunuzu yazabilir veya asistanı kullanabilirsiniz..."
                className="rounded-2xl bg-card border-border/60 p-4 leading-relaxed"
              />
            </div>
            <Button onClick={() => generate()} disabled={genLoading || !prompt.trim()} className="w-full h-14 rounded-2xl text-lg font-bold gap-3 shadow-lg shadow-primary/20">
               {genLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Zap className="h-6 w-6 fill-current" /> Tasarımı Üret</>}
            </Button>
          </div>
        </div>

        {/* SAĞ KOLON: SONUÇLAR */}
        <div className="space-y-8">
           <Card className="border-border/60 shadow-lg overflow-hidden bg-card/50 backdrop-blur-sm">
             <CardContent className="p-0">
                <div className="aspect-square relative group bg-muted/20">
                   {genLoading ? (
                     <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-md z-10">
                        <div className="relative h-20 w-20">
                           <div className="absolute inset-0 border-4 border-primary/20 rounded-full" />
                           <div className="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                           <div className="absolute inset-0 flex items-center justify-center">
                              <Zap className="h-8 w-8 text-primary animate-pulse" />
                           </div>
                        </div>
                        <p className="mt-6 text-xs font-black uppercase tracking-widest text-primary">Masterpiece Hazırlanıyor...</p>
                     </div>
                   ) : imageUrl ? (
                     <img src={imageUrl} alt="AI Design" className="w-full h-full object-contain animate-in zoom-in-95 fade-in duration-500" />
                   ) : (
                     <div className="absolute inset-0 flex flex-col items-center justify-center text-muted-foreground/30">
                        <ImageIcon className="h-16 w-16 mb-4 stroke-[1.5]" />
                        <p className="text-sm font-bold uppercase tracking-widest">Tasarım Bekleniyor</p>
                     </div>
                   )}
                </div>

                {imageUrl && !genLoading && (
                  <div className="p-6 border-t border-border/40 space-y-4 bg-card animate-in slide-in-from-bottom-6">
                    <div className="flex gap-2">
                       <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={() => window.open(imageUrl, '_blank')}>
                         <Download className="h-4 w-4 mr-2" /> İndir
                       </Button>
                       <Button variant="outline" className="flex-1 h-12 rounded-xl font-bold" onClick={async () => {
                          setUpscaleLoading(true);
                          try {
                            const res = await upscaleImage({ data: { imageUrl, prompt } });
                            setImageUrl(res.imageUrl);
                            toast.success("HD Kaliteye Yükseltildi!");
                          } finally { setUpscaleLoading(false); }
                       }} disabled={upscaleLoading}>
                          {upscaleLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Sparkles className="h-4 w-4 mr-2" />} 4K HD
                       </Button>
                    </div>
                    <Button onClick={writeListing} disabled={listLoading} className="w-full h-14 rounded-xl font-black text-base gap-3 border-2 border-primary/10 hover:border-primary/30 transition-all">
                       {listLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <><FileText className="h-5 w-5" /> Derin SEO Analizi & Listeleme</>}
                    </Button>
                  </div>
                )}
             </CardContent>
           </Card>
        </div>
      </div>

      {/* SEO LISTING SECTION */}
      {listing && (
        <Card className="border-primary/30 shadow-2xl shadow-primary/5 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-10 duration-700 bg-gradient-to-br from-card to-background">
          <Tabs defaultValue="etsy" className="w-full">
            <div className="px-8 pt-8 flex items-center justify-between border-b border-border/40 pb-4">
               <div className="flex items-center gap-3">
                 <Badge className="bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 px-3 py-1 text-xs font-bold italic">PRO SEO READY</Badge>
                 <h2 className="text-xl font-black italic">Listeleme Detayları</h2>
               </div>
               <TabsList className="bg-muted/50 rounded-xl p-1">
                 <TabsTrigger value="etsy" className="rounded-lg font-bold">Etsy SEO</TabsTrigger>
                 <TabsTrigger value="marketing" className="rounded-lg font-bold">Pazarlama</TabsTrigger>
               </TabsList>
            </div>

            <TabsContent value="etsy" className="p-8 space-y-8 mt-0">
               <div className="grid gap-8 md:grid-cols-[1fr,300px]">
                  <div className="space-y-6">
                    <DataSection label="Etsy Başlığı (140 Karakter)" value={listing.title} onCopy={() => toast.success("Başlık Kopyalandı")} />
                    <DataSection label="Ürün Açıklaması" value={listing.description} multiline onCopy={() => toast.success("Açıklama Kopyalandı")} />
                  </div>
                  <div className="space-y-6">
                    <DataSection label="Etiketler (13 Adet)" value={listing.tags.join(", ")} onCopy={() => toast.success("Etiketler Kopyalandı")} />
                    <div className="grid grid-cols-1 gap-4">
                       <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Materyaller</p>
                          <p className="text-sm font-bold">{listing.materials || "Digital Print, Eco-Friendly Ink"}</p>
                       </div>
                       <div className="p-4 rounded-2xl bg-muted/20 border border-border/40">
                          <p className="text-[10px] font-black text-muted-foreground uppercase mb-2">Hedef Kitle</p>
                          <p className="text-sm font-bold">{listing.audience || "Art Lovers, Gift Seekers"}</p>
                       </div>
                    </div>
                  </div>
               </div>
            </TabsContent>

            <TabsContent value="marketing" className="p-8 space-y-8 mt-0">
               <div className="grid gap-8 md:grid-cols-2">
                  <DataSection label="Pinterest Viral Pin" value={listing.pinterest_text} multiline onCopy={() => toast.success("Pinterest metni kopyalandı")} />
                  <DataSection label="TikTok / Reels Script" value={listing.tiktok_script} multiline onCopy={() => toast.success("TikTok scripti kopyalandı")} />
               </div>
            </TabsContent>
          </Tabs>
        </Card>
      )}
    </div>
  );
}

function DataSection({ label, value, onCopy, multiline }: { label: string; value: string; onCopy: () => void; multiline?: boolean }) {
  return (
    <div className="space-y-3 group">
      <div className="flex items-center justify-between px-1">
        <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground">{label}</Label>
        <Button variant="ghost" size="xs" onClick={() => { navigator.clipboard.writeText(value); onCopy(); }} className="h-7 px-3 rounded-lg bg-muted hover:bg-primary hover:text-white transition-all gap-2 text-[10px] font-bold">
           <Copy className="h-3 w-3" /> Kopyala
        </Button>
      </div>
      <div className={`p-5 rounded-2xl bg-background border border-border/60 text-sm leading-relaxed font-medium shadow-inner ${multiline ? "whitespace-pre-wrap min-h-[150px]" : ""}`}>
        {value}
      </div>
    </div>
  );
}

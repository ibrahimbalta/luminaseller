import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Instagram, Share2, Pin, Copy, Download, 
  Sparkles, Loader2, Smartphone, Send, Image as ImageIcon
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { generateListing } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const { user } = useAuth();
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [caption, setCaption] = useState("");
  const [pinterestDesc, setPinterestDesc] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const genListing = useServerFn(generateListing);

  // Fetch user's designs
  const { data: designs, isLoading } = useQuery({
    queryKey: ["my_designs", user?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(12);
      return data;
    },
    enabled: !!user,
  });

  const generateSocialContent = async (design: any) => {
    setSelectedDesign(design);
    setIsGenerating(true);
    setCaption("");
    try {
      const res = await genListing({
        data: {
          prompt: design.prompt,
          niche: design.niche || "Etsy",
          language: "tr"
        }
      });
      
      setCaption(res.instagram_text || res.description || "İçerik üretilemedi.");
      setPinterestDesc(res.pinterest_text || res.title || "");
      toast.success("Pazarlama içerikleri hazır!");
    } catch (e: any) {
      toast.error("AI İçerik hatası: " + e.message);
      setCaption(`✨ Yeni Tasarım: ${design.prompt}\n\n🎨 Bu eşsiz parça şimdi dükkanımda!`);
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Metin kopyalandı!");
  };

  const pinToPinterest = (imageUrl: string, title: string) => {
    const pinterestUrl = `https://www.pinterest.com/pin/create/button/?url=${encodeURIComponent("https://www.etsy.com")}&media=${encodeURIComponent(imageUrl)}&description=${encodeURIComponent(title)}`;
    window.open(pinterestUrl, "_blank");
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold">Pazarlama Laboratuvarı</h1>
          <p className="text-sm text-muted-foreground">Tasarımlarınızı tek tıkla dünyaya duyurun.</p>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-2">
        {/* Left: Design Selection */}
        <section className="space-y-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <ImageIcon className="h-5 w-5 text-primary" /> Tasarım Seç
          </h2>
          <div className="grid grid-cols-3 gap-3">
            {isLoading ? (
               Array.from({ length: 6 }).map((_, i) => (
                 <div key={i} className="aspect-square animate-pulse rounded-lg bg-card" />
               ))
            ) : (
              designs?.map((d) => (
                <button
                  key={d.id}
                  onClick={() => generateSocialContent(d)}
                  className={`group relative aspect-square overflow-hidden rounded-xl border-2 transition-all ${
                    selectedDesign?.id === d.id ? "border-primary scale-95 shadow-lg" : "border-transparent hover:border-primary/50"
                  }`}
                >
                  <img src={d.image_url} alt={d.prompt} className="h-full w-full object-cover" />
                  <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Send className="h-6 w-6 text-white" />
                  </div>
                </button>
              ))
            )}
          </div>
        </section>

        {/* Right: Preview & Post */}
        <section className="space-y-6">
          {selectedDesign ? (
            <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <Tabs defaultValue="instagram" className="w-full">
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="instagram" className="flex gap-2">
                    <Instagram className="h-4 w-4" /> Instagram
                  </TabsTrigger>
                  <TabsTrigger value="pinterest" className="flex gap-2">
                    <Pin className="h-4 w-4" /> Pinterest
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="instagram" className="space-y-6">
                  {/* Phone Mockup */}
                  <div className="mx-auto max-w-[280px] rounded-[3rem] border-[8px] border-card bg-card shadow-2xl p-1 relative overflow-hidden ring-1 ring-border">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-24 h-6 bg-card rounded-b-2xl z-20" />
                    <div className="bg-background h-full w-full rounded-[2.5rem] overflow-hidden flex flex-col">
                      <div className="p-3 flex items-center gap-2 border-b border-border/50">
                        <div className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-accent" />
                        <span className="text-[10px] font-bold">mağazam_adresi</span>
                      </div>
                      <img src={selectedDesign.image_url} className="aspect-square w-full object-cover" />
                      <div className="p-3 space-y-2">
                        <div className="flex gap-3">
                          <div className="h-3 w-3 rounded-full border border-foreground/20" />
                          <div className="h-3 w-3 rounded-full border border-foreground/20" />
                        </div>
                        <div className="text-[9px] leading-tight text-foreground/80 line-clamp-3">
                           {caption}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Card className="bg-card/50">
                      <CardContent className="p-4 pt-4">
                        <div className="text-xs font-medium text-muted-foreground mb-2 flex justify-between">
                          <span>Instagram Açıklaması</span>
                          <button onClick={() => copyToClipboard(caption)} className="hover:text-primary transition-colors">
                            <Copy className="h-3.5 w-3.5" />
                          </button>
                        </div>
                        <p className="text-sm italic">{caption}</p>
                      </CardContent>
                    </Card>
                    <div className="flex gap-3">
                      <Button className="flex-1 gap-2" variant="outline" onClick={() => copyToClipboard(caption)}>
                        <Copy className="h-4 w-4" /> Metni Kopyala
                      </Button>
                      <a 
                        href={selectedDesign.image_url} 
                        download="instagram-post.png"
                        className="inline-flex flex-1 items-center justify-center gap-2 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4" /> Görseli İndir
                      </a>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pinterest" className="space-y-6">
                  <div className="flex flex-col items-center gap-4">
                    <div className="aspect-[2/3] w-full max-w-[240px] rounded-2xl overflow-hidden shadow-xl border border-border bg-card">
                      <img src={selectedDesign.image_url} className="h-full w-full object-cover" />
                    </div>
                    <div className="text-center">
                      <h3 className="font-bold text-sm">Pinterest İçin Hazır!</h3>
                      <p className="text-xs text-muted-foreground mt-1">Görsel ve link otomatik olarak eşleştirildi.</p>
                    </div>
                    <Button 
                      className="w-full gap-2 bg-[#E60023] hover:bg-[#E60023]/90 text-white" 
                      onClick={() => pinToPinterest(selectedDesign.image_url, pinterestDesc || selectedDesign.prompt)}
                      disabled={isGenerating}
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pin className="h-4 w-4" />}
                      Pinterest'e Pinle
                    </Button>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <div className="flex h-[500px] flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-card/30 text-center p-10">
              <div className="rounded-full bg-primary/10 p-4 text-primary">
                <Smartphone className="h-10 w-10" />
              </div>
              <h3 className="mt-6 text-lg font-semibold">Post Oluşturucu</h3>
              <p className="mt-2 max-w-[300px] text-sm text-muted-foreground">
                Soldaki galerinden bir tasarım seç, sosyal medya paylaşımını anında hazırlayalım.
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";

import { getUserDesigns, generateMarketingContent } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, Megaphone, Image as ImageIcon, Check,
  Loader2, Send, Wand2, Copy
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const { user } = useAuth();

  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const [aiContent, setAiContent] = useState<string>("");
  const [isGenerating, setIsGenerating] = useState(false);

  const { data: designs, isLoading } = useQuery({
    queryKey: ["user_designs", user?.id],
    queryFn: () => getUserDesigns({ data: { userId: user!.id } }),
    enabled: !!user,
  });

  const handleAiContent = async (platform: string) => {
    if (!selectedDesign) return;
    setIsGenerating(true);
    try {
      const res = await generateMarketingContent({ data: { designId: selectedDesign.id, platform } });
      setAiContent(res.content);
      toast.success("AI içerik hazırladı!");
    } catch {
      toast.error("İçerik üretilemedi.");
    } finally {
      setIsGenerating(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(aiContent);
    toast.success("Kopyalandı!");
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pazarlama Laboratuvarı</h1>
          <p className="text-sm text-muted-foreground mt-1">Tasarımlarınızı sosyal medyada profesyonelce pazarlayın.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 mt-3 sm:mt-0">
          <Link to="/generate"><Wand2 className="h-3.5 w-3.5" /> Yeni Tasarım</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
        {/* Design Grid */}
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tasarım Kütüphanesi</CardTitle>
              <Badge variant="secondary" className="text-[10px]">{designs?.length || 0} tasarım</Badge>
            </div>
          </CardHeader>
          <CardContent className="pb-5">
            {isLoading ? (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                  <div key={i} className="aspect-square rounded-lg bg-muted/50 animate-pulse" />
                ))}
              </div>
            ) : !designs || designs.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <ImageIcon className="h-8 w-8 mx-auto mb-2 opacity-30" />
                <p className="text-sm font-medium">Henüz tasarım yok</p>
                <p className="text-xs mt-1 mb-4">Paylaşmak için önce tasarım oluşturun.</p>
                <Button asChild size="sm"><Link to="/generate">Tasarım Oluştur</Link></Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
                {designs.map((d: any) => (
                  <div
                    key={d.id}
                    onClick={() => { setSelectedDesign(d); setAiContent(""); }}
                    className={`group relative aspect-square rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                      selectedDesign?.id === d.id
                        ? "border-primary ring-2 ring-primary/20"
                        : "border-transparent hover:border-border"
                    }`}
                  >
                    <img src={d.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    {selectedDesign?.id === d.id && (
                      <div className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Share Panel */}
        <div className="space-y-4">
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Send className="h-3.5 w-3.5" /> Paylaşım & İçerik
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5 space-y-4">
              {!selectedDesign ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">Tasarım seçin</p>
                  <p className="text-[11px] mt-1">Soldaki listeden bir tasarım seçin.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                    <img src={selectedDesign.image_url} alt="" className="h-full w-full object-contain" />
                  </div>

                  <div className="space-y-2">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Hızlı Hazırla</p>
                    <div className="grid grid-cols-2 gap-2">
                      <Button size="xs" variant="outline" onClick={() => handleAiContent("Instagram")} disabled={isGenerating}>
                        Instagram
                      </Button>
                      <Button size="xs" variant="outline" onClick={() => handleAiContent("Pinterest")} disabled={isGenerating}>
                        Pinterest
                      </Button>
                    </div>
                  </div>

                  {aiContent && (
                    <div className="space-y-2 animate-in slide-in-from-top-2 duration-300">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] font-bold text-primary uppercase">AI Paylaşım Metni</p>
                        <Button variant="ghost" size="xs" onClick={copyToClipboard} className="h-6 w-6 p-0">
                          <Copy className="h-3 w-3" />
                        </Button>
                      </div>
                      <Textarea 
                        readOnly 
                        value={aiContent} 
                        className="text-xs bg-muted/30 border-none resize-none leading-relaxed h-32"
                      />
                    </div>
                  )}

                  <div className="pt-2">
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 border-none h-10"
                      size="sm"
                      onClick={() => toast.info("Doğrudan paylaşım yakında eklenecek!")}
                    >
                      <Send className="h-3.5 w-3.5" /> Şimdi Yayınla
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="rounded-xl border-border/60 shadow-sm bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">Strateji</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                    Instagram Reels için tasarımlarınızı hareketli mockup'larla gösterin. Etkileşim %30 artıyor.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

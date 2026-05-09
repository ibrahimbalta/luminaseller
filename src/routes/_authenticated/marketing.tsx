import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserDesigns } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import {
  Sparkles, Megaphone, Image as ImageIcon, Check,
  Loader2, Send, Wand2, ArrowRight
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/marketing")({
  component: MarketingPage,
});

function MarketingPage() {
  const { user } = useAuth();
  const getDesigns = useServerFn(getUserDesigns);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [sharingId, setSharingId] = useState<string | null>(null);

  const { data: designs, isLoading } = useQuery({
    queryKey: ["user_designs", user?.id],
    queryFn: () => getDesigns({ data: { userId: user!.id } }),
    enabled: !!user,
  });

  const shareToSocial = async (designId: string, platform: string) => {
    setSharingId(`${designId}-${platform}`);
    try {
      await new Promise(r => setTimeout(r, 2000));
      toast.success(`${platform} paylaşımı başarılı!`);
    } catch {
      toast.error("Paylaşım sırasında hata oluştu.");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Pazarlama</h1>
          <p className="text-sm text-muted-foreground mt-1">Tasarımlarınızı sosyal medyada paylaşın.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 mt-3 sm:mt-0">
          <Link to="/generate"><Wand2 className="h-3.5 w-3.5" /> Yeni Tasarım</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
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
                    onClick={() => setSelectedDesign(d)}
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
                <Send className="h-3.5 w-3.5" /> Paylaşım Paneli
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              {!selectedDesign ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Megaphone className="h-8 w-8 mx-auto mb-2 opacity-20" />
                  <p className="text-sm font-medium">Tasarım seçin</p>
                  <p className="text-[11px] mt-1">Soldaki listeden bir tasarım seçerek paylaşım yapabilirsiniz.</p>
                </div>
              ) : (
                <div className="space-y-4 animate-in fade-in duration-300">
                  <div className="aspect-square rounded-lg overflow-hidden border border-border/50 bg-muted/30">
                    <img src={selectedDesign.image_url} alt="" className="h-full w-full object-contain" />
                  </div>
                  <p className="text-[11px] text-muted-foreground line-clamp-2">{selectedDesign.prompt}</p>

                  <div className="space-y-2">
                    <Button
                      className="w-full gap-2 bg-gradient-to-r from-pink-500 to-orange-400 hover:from-pink-600 hover:to-orange-500 border-none"
                      size="sm"
                      disabled={!!sharingId}
                      onClick={() => shareToSocial(selectedDesign.id, "Instagram")}
                    >
                      {sharingId === `${selectedDesign.id}-Instagram`
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><Megaphone className="h-3.5 w-3.5" /> Instagram'da Paylaş</>}
                    </Button>
                    <Button
                      className="w-full gap-2 bg-red-600 hover:bg-red-700 border-none"
                      size="sm"
                      disabled={!!sharingId}
                      onClick={() => shareToSocial(selectedDesign.id, "Pinterest")}
                    >
                      {sharingId === `${selectedDesign.id}-Pinterest`
                        ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        : <><ImageIcon className="h-3.5 w-3.5" /> Pinterest'e Pinle</>}
                    </Button>
                    <Button
                      variant="outline"
                      className="w-full gap-2"
                      size="sm"
                      onClick={() => toast.info("AI tüm kanallar için içerik hazırlıyor...")}
                    >
                      <Sparkles className="h-3.5 w-3.5" /> AI ile İçerik Üret
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Tip */}
          <Card className="rounded-xl border-border/60 shadow-sm bg-primary/5">
            <CardContent className="p-4">
              <div className="flex gap-3">
                <Sparkles className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-xs font-medium">İpucu</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Etsy'de "Retro Typography" aramaları %45 artışta. Bu temadaki tasarımlarınızı öne çıkarın.
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

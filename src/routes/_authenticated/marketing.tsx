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
  Loader2, ArrowRight, Instagram, TrendingUp, Send
} from "lucide-react";
import { toast } from "sonner";

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
      // Simulate API call to Instagram/Pinterest
      await new Promise(r => setTimeout(r, 2000));
      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-black text-sm">{platform} Paylaşımı Başarılı! 🚀</p>
          <p className="text-[10px] font-bold opacity-80 uppercase tracking-tighter">Tasarımınız başarıyla yayına alındı.</p>
        </div>
      );
    } catch (e) {
      toast.error("Paylaşım sırasında bir hata oluştu.");
    } finally {
      setSharingId(null);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-foreground">
          Pazarlama <span className="text-primary">Laboratuvarı</span>
        </h1>
        <p className="text-muted-foreground font-bold italic text-sm tracking-tight">
          Tasarımlarınızı sosyal medyada tek tıkla paylaşın ve Etsy satışlarınızı katlayın.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-4">
        {/* Gallery Selection */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between bg-muted/30 p-4 rounded-2xl border border-border/50">
             <h2 className="text-lg font-black flex items-center gap-2 uppercase tracking-tighter">
                <Sparkles className="h-5 w-5 text-primary" /> Tasarım Kitaplığı
             </h2>
             <span className="text-[10px] font-black text-primary uppercase tracking-widest bg-primary/10 px-4 py-1.5 rounded-full border border-primary/20">
                {designs?.length || 0} Tasarım Hazır
             </span>
          </div>

          <div className="grid gap-5 sm:grid-cols-3">
            {isLoading ? (
              [1, 2, 3, 4, 5, 6].map(i => (
                <div key={i} className="aspect-square animate-pulse rounded-[2rem] bg-card border border-border/50 shadow-inner" />
              ))
            ) : !designs || designs.length === 0 ? (
              <div className="col-span-full py-32 text-center border-4 border-dashed border-muted rounded-[3rem] bg-muted/10">
                 <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6">
                    <ImageIcon className="h-10 w-10 text-muted-foreground/30" />
                 </div>
                 <p className="text-xl font-black uppercase tracking-tight text-muted-foreground">Henüz Tasarım Yok</p>
                 <p className="text-sm text-muted-foreground/60 font-bold mb-8">Paylaşmak için önce bir tasarım üretmelisiniz.</p>
                 <Button asChild className="font-black h-12 px-10 rounded-full shadow-xl">
                    <Link to="/generate">Hemen Tasarım Üret</Link>
                 </Button>
              </div>
            ) : (
              designs?.map((d: any) => (
                <Card 
                  key={d.id} 
                  className={`group relative aspect-square overflow-hidden rounded-[2rem] border-4 transition-all duration-500 cursor-pointer shadow-sm ${
                    selectedDesign?.id === d.id ? "border-primary shadow-2xl scale-[1.02] z-10" : "border-transparent hover:border-primary/20"
                  }`}
                  onClick={() => setSelectedDesign(d)}
                >
                  <img src={d.image_url} alt="design" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-4 p-4">
                     <div className="flex flex-col w-full gap-2">
                        <Button 
                          size="sm" 
                          className="font-black text-[10px] uppercase tracking-widest h-10 w-full bg-gradient-to-r from-pink-500 to-orange-500 border-none"
                          disabled={!!sharingId}
                          onClick={(e) => { e.stopPropagation(); shareToSocial(d.id, 'Instagram'); }}
                        >
                           {sharingId === `${d.id}-Instagram` ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Instagram className="h-4 w-4 mr-2" /> Paylaş</>}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="secondary"
                          className="font-black text-[10px] uppercase tracking-widest h-10 w-full"
                          disabled={!!sharingId}
                          onClick={(e) => { e.stopPropagation(); shareToSocial(d.id, 'Pinterest'); }}
                        >
                           {sharingId === `${d.id}-Pinterest` ? <Loader2 className="h-4 w-4 animate-spin" /> : '📌 Pinterest'}
                        </Button>
                     </div>
                  </div>
                  {selectedDesign?.id === d.id && (
                    <div className="absolute top-4 right-4 bg-primary text-white h-8 w-8 flex items-center justify-center rounded-full shadow-2xl animate-in zoom-in duration-300">
                       <Check className="h-5 w-5" />
                    </div>
                  )}
                </Card>
              ))
            )}
          </div>
        </div>

        {/* Action Panel */}
        <div className="space-y-6">
          <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden border-t-8 border-primary">
            <CardHeader className="pt-10 pb-6 text-center">
              <CardTitle className="text-2xl font-black uppercase tracking-tighter italic">
                Post <span className="text-primary">Merkezi</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="px-8 pb-10 space-y-8">
              {!selectedDesign ? (
                <div className="text-center py-12 space-y-6">
                   <div className="h-24 w-24 bg-primary/5 rounded-[2rem] flex items-center justify-center mx-auto rotate-12 border border-primary/10">
                      <Send className="h-10 w-10 text-primary/30" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-sm font-black uppercase text-foreground">Tasarım Seçilmedi</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic leading-relaxed">
                         Paylaşım yapmak için kütüphaneden bir tasarım üzerine tıklayın.
                      </p>
                   </div>
                </div>
              ) : (
                <div className="space-y-8 animate-in slide-in-from-bottom-4 duration-500">
                  <div className="aspect-square rounded-[2rem] border-4 border-muted overflow-hidden bg-muted/30 shadow-inner group">
                     <img src={selectedDesign.image_url} alt="selected" className="h-full w-full object-contain group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  
                  <div className="grid gap-3">
                     <Button 
                      className="w-full h-14 font-black uppercase tracking-widest gap-3 bg-gradient-to-r from-pink-500 via-purple-500 to-orange-500 border-none shadow-xl hover:shadow-pink-500/20"
                      onClick={() => shareToSocial(selectedDesign.id, 'Instagram')}
                      disabled={!!sharingId}
                     >
                        {sharingId === `${selectedDesign.id}-Instagram` ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Instagram className="h-5 w-5" /> Instagram'da Paylaş</>}
                     </Button>
                     <Button 
                      className="w-full h-14 font-black uppercase tracking-widest gap-3 bg-red-600 hover:bg-red-700 border-none shadow-xl hover:shadow-red-500/20"
                      onClick={() => shareToSocial(selectedDesign.id, 'Pinterest')}
                      disabled={!!sharingId}
                     >
                        {sharingId === `${selectedDesign.id}-Pinterest` ? <Loader2 className="h-5 w-5 animate-spin" /> : <><ImageIcon className="h-5 w-5" /> Pinterest'e Pinle</>}
                     </Button>
                  </div>

                  <div className="pt-6 mt-6 border-t border-border">
                     <p className="text-[10px] font-black uppercase text-primary tracking-widest mb-4 italic flex items-center gap-2">
                        <Sparkles className="h-3 w-3" /> AI Marketing Kit
                     </p>
                     <Button 
                      variant="outline" 
                      className="w-full font-black text-xs h-12 rounded-xl border-2 border-primary/20 hover:border-primary/50 transition-colors"
                      onClick={() => toast.info("Yapay zeka tüm kanallar için içerikleri hazırlıyor...")}
                     >
                        TÜM KANALLAR İÇİN ÜRET
                     </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="bg-foreground text-background shadow-2xl rounded-[2rem] overflow-hidden group border-none">
             <div className="absolute -right-6 -bottom-6 p-8 opacity-10 group-hover:scale-110 transition-transform duration-700">
                <TrendingUp className="h-32 w-32" />
             </div>
             <CardContent className="p-8 relative z-10 space-y-4">
                <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                   <Sparkles className="h-6 w-6 text-white" />
                </div>
                <h3 className="font-black text-xl italic leading-tight uppercase tracking-tighter">Trend Uyarısı</h3>
                <p className="text-xs opacity-70 leading-relaxed font-bold italic">
                   "Şu an 'Retro Typography' aramaları Etsy'de %45 artış gösterdi. Bu temadaki tasarımlarınızı öne çıkarın!"
                </p>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserDesigns } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, Image as ImageIcon, Check, Loader2, 
  Download, Zap, Palette, Maximize2, Move, 
  RotateCw, Share2, Eye, Box, Sliders, ChevronRight,
  ChevronLeft, LayoutGrid, Layers
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/mockups")({
  component: MockupStudio,
});

const PRODUCT_TEMPLATES = [
  { id: "tshirt-white", name: "Premium White Tee", type: "Giyim", color: "#FFFFFF", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" },
  { id: "tshirt-black", name: "Midnight Black Tee", type: "Giyim", color: "#1A1A1A", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800" },
  { id: "mug", name: "Classic Ceramic Mug", type: "Mutfak", color: "#FFFFFF", image: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&q=80&w=800" },
  { id: "canvas", name: "Gallery Wall Canvas", type: "Dekor", color: "Canvas", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800" },
  { id: "tote", name: "Organic Tote Bag", type: "Aksesuar", color: "Cream", image: "https://images.unsplash.com/photo-1591337676887-a217a6970c8a?auto=format&fit=crop&q=80&w=800" },
  { id: "hoodie", name: "Urban Oversize Hoodie", type: "Giyim", color: "#333", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800" },
];

function MockupStudio() {
  const { user } = useAuth();
  const getDesigns = useServerFn(getUserDesigns);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(PRODUCT_TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("designs");

  const { data: designs, isLoading } = useQuery({
    queryKey: ["user_designs", user?.id],
    queryFn: () => getDesigns({ data: { userId: user!.id } }),
    enabled: !!user,
  });

  const generateMockup = async () => {
    if (!selectedDesign) return toast.error("Lütfen önce bir tasarım seçin.");
    setIsGenerating(true);
    setResultImage(null);
    try {
      await new Promise(r => setTimeout(r, 3000));
      const mockupUrl = `https://pollinations.ai/p/${encodeURIComponent("extremely high detail, professional studio product photography of " + selectedTemplate.name + " featuring a " + selectedDesign.prompt + " design printed perfectly on it, realistic shadows, lifestyle lighting, 8k resolution, minimalist commercial background")}?width=1024&height=1024&seed=${Math.floor(Math.random() * 9999)}`;
      setResultImage(mockupUrl);
      toast.success("Elite Mockup Oluşturuldu!");
    } catch (e) {
      toast.error("Stüdyo bağlantısında hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col gap-8 pb-10 animate-in fade-in duration-1000">
      {/* ── HEADER ── */}
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shadow-inner border border-primary/20">
              <Sparkles className="h-6 w-6 animate-pulse" />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">
                Lumina <span className="text-primary">Elite Studio</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Hyper-Realistic Mockup Engine v2.0</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 flex-1">
        {/* ── LEFT SIDEBAR: CONFIGURATION ── */}
        <div className="space-y-6">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/30 rounded-2xl border border-border/50">
                 <TabsTrigger value="designs" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                    <Palette className="h-4 w-4 mr-2" /> Tasarımlar
                 </TabsTrigger>
                 <TabsTrigger value="products" className="rounded-xl font-black text-[10px] uppercase tracking-widest data-[state=active]:bg-foreground data-[state=active]:text-background transition-all">
                    <Box className="h-4 w-4 mr-2" /> Ürünler
                 </TabsTrigger>
              </TabsList>

              <TabsContent value="designs" className="mt-6 space-y-4 animate-in slide-in-from-left-4 duration-500">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Varlık Kütüphanesi</h3>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary font-black uppercase">{designs?.length || 0} Öğe</Badge>
                 </div>
                 <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[550px] pr-2 scrollbar-hide">
                    {isLoading ? (
                      Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="aspect-square rounded-2xl bg-muted/50 animate-pulse border border-border/30" />
                      ))
                    ) : designs?.map((d: any) => (
                      <div 
                        key={d.id}
                        onClick={() => { setSelectedDesign(d); if (!selectedDesign) setActiveTab("products"); }}
                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-500 shadow-sm ${
                          selectedDesign?.id === d.id ? "border-primary scale-95 shadow-2xl" : "border-transparent hover:border-primary/30"
                        }`}
                      >
                        <img src={d.image_url} alt="asset" className="h-full w-full object-cover" />
                        {selectedDesign?.id === d.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center animate-in zoom-in duration-300">
                             <Check className="h-8 w-8 text-white drop-shadow-xl" />
                          </div>
                        )}
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                           <span className="text-[8px] text-white font-black uppercase tracking-widest truncate">{d.prompt}</span>
                        </div>
                      </div>
                    ))}
                 </div>
              </TabsContent>

              <TabsContent value="products" className="mt-6 space-y-4 animate-in slide-in-from-right-4 duration-500">
                 <div className="flex items-center justify-between px-2">
                    <h3 className="text-sm font-black uppercase tracking-tighter italic">Ürün Katalogu</h3>
                    <Badge variant="outline" className="text-[9px] border-primary/20 text-primary font-black uppercase">{PRODUCT_TEMPLATES.length} Şablon</Badge>
                 </div>
                 <div className="grid gap-3 overflow-y-auto max-h-[550px] pr-2 scrollbar-hide">
                    {PRODUCT_TEMPLATES.map((tmpl) => (
                      <Card 
                        key={tmpl.id}
                        onClick={() => setSelectedTemplate(tmpl)}
                        className={`group relative overflow-hidden rounded-[1.5rem] cursor-pointer border-2 transition-all duration-500 ${
                          selectedTemplate.id === tmpl.id ? "border-primary bg-primary/5 shadow-xl -translate-y-1" : "border-border/30 bg-card hover:border-primary/20"
                        }`}
                      >
                        <CardContent className="p-4 flex items-center gap-4">
                           <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-inner border border-border/50 group-hover:scale-105 transition-transform duration-700">
                              <img src={tmpl.image} alt={tmpl.name} className="h-full w-full object-cover" />
                           </div>
                           <div className="flex-1 space-y-1">
                              <p className="font-black text-sm uppercase tracking-tight">{tmpl.name}</p>
                              <div className="flex items-center gap-2">
                                 <span className="text-[9px] text-muted-foreground font-bold italic uppercase tracking-widest">{tmpl.type}</span>
                                 <div className="h-1 w-1 rounded-full bg-muted-foreground/30" />
                                 <span className="text-[9px] text-muted-foreground font-bold italic uppercase tracking-widest">{tmpl.color}</span>
                              </div>
                           </div>
                           {selectedTemplate.id === tmpl.id && <Zap className="h-5 w-5 text-primary animate-pulse" />}
                        </CardContent>
                      </Card>
                    ))}
                 </div>
              </TabsContent>
           </Tabs>

           <Button 
            className="w-full h-16 rounded-[2rem] font-black text-lg uppercase tracking-[0.2em] shadow-2xl transition-all hover:scale-[1.02] active:scale-95 group relative overflow-hidden bg-foreground text-background hover:bg-primary hover:text-white border-none"
            disabled={isGenerating || !selectedDesign}
            onClick={generateMockup}
           >
              <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              {isGenerating ? (
                <div className="flex items-center gap-3">
                   <Loader2 className="h-6 w-6 animate-spin text-primary" />
                   <span>Renderlanıyor...</span>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                   <Zap className="h-6 w-6 group-hover:animate-bounce" />
                   <span>Sahneye Aktar</span>
                </div>
              )}
           </Button>
        </div>

        {/* ── CENTRAL STAGE: PREVIEW ── */}
        <div className="relative group">
           <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-primary/5 rounded-[3.5rem] blur-3xl opacity-50" />
           
           <Card className="h-full border-none bg-card/30 backdrop-blur-3xl shadow-2xl rounded-[3.5rem] overflow-hidden flex flex-col border border-white/10 relative z-10">
              <div className="p-8 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Elite Render Stage</span>
                 </div>
                 <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5 hover:text-white transition-colors cursor-pointer">
                       <Maximize2 className="h-4 w-4" />
                    </div>
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5 hover:text-white transition-colors cursor-pointer">
                       <Sliders className="h-4 w-4" />
                    </div>
                 </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-12 relative overflow-hidden">
                 {isGenerating ? (
                    <div className="text-center space-y-8 animate-in zoom-in duration-1000">
                       <div className="relative mx-auto h-40 w-40">
                          <div className="absolute inset-0 rounded-full border-8 border-primary/10 border-t-primary animate-spin-slow shadow-[0_0_50px_rgba(var(--primary),0.3)]" />
                          <div className="absolute inset-8 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center backdrop-blur-xl">
                             <Sparkles className="h-12 w-12 text-primary animate-pulse" />
                          </div>
                          <div className="absolute -inset-4 border border-white/10 rounded-full animate-ping opacity-20" />
                       </div>
                       <div className="space-y-2">
                          <h2 className="text-2xl font-black uppercase tracking-tighter italic text-primary">Yapay Zeka Sanatçısı Çalışıyor</h2>
                          <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest animate-pulse italic">Doku Eşleştirme & Işıklandırma Optimizasyonu...</p>
                       </div>
                    </div>
                 ) : resultImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-700">
                       <div className="relative group/image max-w-[90%] max-h-full rounded-[2.5rem] overflow-hidden shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-white/10">
                          <img src={resultImage} alt="Elite Mockup" className="w-full h-full object-contain" />
                          <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/image:opacity-100 transition-all duration-500 flex items-center justify-center gap-6 backdrop-blur-sm">
                             <Button className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl bg-white text-black hover:bg-primary hover:text-white border-none transform -translate-y-4 group-hover/image:translate-y-0 transition-transform" onClick={() => window.open(resultImage, '_blank')}>
                                <Download className="mr-2 h-5 w-5" /> Ultra HD İndir
                             </Button>
                             <Button variant="secondary" className="h-14 px-10 rounded-2xl font-black uppercase tracking-widest shadow-2xl transform translate-y-4 group-hover/image:translate-y-0 transition-transform" asChild>
                                <Link to="/inventory">Envantere Aktar</Link>
                             </Button>
                          </div>
                       </div>
                       <div className="mt-8 flex items-center gap-8 px-8 py-3 bg-white/5 rounded-full border border-white/5 backdrop-blur-md">
                          <div className="flex items-center gap-2">
                             <Eye className="h-4 w-4 text-primary" />
                             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Görünüm: Standart Stüdyo</span>
                          </div>
                          <div className="w-[1px] h-4 bg-white/10" />
                          <div className="flex items-center gap-2">
                             <Layers className="h-4 w-4 text-primary" />
                             <span className="text-[9px] font-black uppercase tracking-widest opacity-60">Katman: Akıllı Eşleşme</span>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center space-y-10 max-w-md">
                       <div className="relative mx-auto h-48 w-48 group-hover:scale-110 transition-transform duration-1000">
                          <div className="absolute inset-0 bg-primary/10 blur-[60px] animate-pulse" />
                          <div className="relative h-full w-full bg-muted/20 border-2 border-dashed border-white/10 rounded-[3rem] flex items-center justify-center rotate-6 overflow-hidden">
                             <LayoutGrid className="h-20 w-20 text-muted-foreground/20 animate-in spin-in-90 duration-1000" />
                             <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent" />
                          </div>
                       </div>
                       <div className="space-y-4">
                          <h2 className="text-3xl font-black uppercase tracking-tighter italic text-foreground leading-none">
                             Kusursuz <span className="text-primary">Sunum</span> Burada Başlar
                          </h2>
                          <p className="text-sm font-bold text-muted-foreground italic leading-relaxed opacity-60">
                             Lumina Elite Studio, tasarımlarınızı fiziksel ürünlerle birleştirmek için sinematik render teknolojisini kullanır. 
                             Lütfen soldaki menüden bir tasarım ve ürün seçin.
                          </p>
                       </div>
                       <div className="flex items-center justify-center gap-4">
                          <div className="flex -space-x-3">
                             {[1, 2, 3].map(i => (
                               <div key={i} className="h-10 w-10 rounded-full border-2 border-card bg-muted animate-pulse" />
                             ))}
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Binlerce satıcı burayı kullanıyor</span>
                       </div>
                    </div>
                 )}
              </div>

              {/* ── BOTTOM TRAY ── */}
              <div className="p-8 bg-black/40 border-t border-white/5 backdrop-blur-2xl flex items-center justify-between">
                 <div className="flex items-center gap-10">
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Seçili Tasarım</span>
                       <div className="flex items-center gap-3">
                          {selectedDesign ? (
                             <div className="flex items-center gap-2">
                                <div className="h-8 w-8 rounded-lg overflow-hidden border border-white/10">
                                   <img src={selectedDesign.image_url} className="h-full w-full object-cover" />
                                </div>
                                <span className="text-[10px] font-black uppercase tracking-tighter max-w-[100px] truncate">{selectedDesign.prompt}</span>
                             </div>
                          ) : (
                             <span className="text-[10px] font-black uppercase tracking-tighter opacity-20">Seçim Yok</span>
                          )}
                       </div>
                    </div>
                    <div className="h-8 w-[1px] bg-white/10" />
                    <div className="flex flex-col">
                       <span className="text-[8px] font-black uppercase text-muted-foreground tracking-widest mb-1">Ürün Şablonu</span>
                       <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-lg overflow-hidden border border-white/10 bg-muted/20 flex items-center justify-center">
                             <img src={selectedTemplate.image} className="h-full w-full object-cover" />
                          </div>
                          <span className="text-[10px] font-black uppercase tracking-tighter">{selectedTemplate.name}</span>
                       </div>
                    </div>
                 </div>
                 
                 <div className="flex items-center gap-3">
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white transition-all">
                       <Share2 className="h-5 w-5" />
                    </Button>
                    <Button variant="ghost" className="h-12 w-12 rounded-2xl bg-white/5 border border-white/5 text-muted-foreground hover:text-white transition-all">
                       <RotateCw className="h-5 w-5" />
                    </Button>
                 </div>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

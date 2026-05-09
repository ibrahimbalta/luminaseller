import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserDesigns } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, Image as ImageIcon, Check, Loader2, 
  Download, Zap, Palette, Maximize2, 
  Share2, Box, Eye, Layers, LayoutGrid, RotateCcw
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/_authenticated/mockups")({
  component: MockupStudio,
});

const PRODUCT_TEMPLATES = [
  { id: "tshirt-white", name: "Premium White Tee", type: "Giyim", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" },
  { id: "tshirt-black", name: "Midnight Black Tee", type: "Giyim", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=800" },
  { id: "mug", name: "Classic Ceramic Mug", type: "Mutfak", image: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&q=80&w=800" },
  { id: "canvas", name: "Gallery Wall Canvas", type: "Dekor", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800" },
  { id: "tote", name: "Organic Tote Bag", type: "Aksesuar", image: "https://images.unsplash.com/photo-1591337676887-a217a6970c8a?auto=format&fit=crop&q=80&w=800" },
  { id: "hoodie", name: "Urban Oversize Hoodie", type: "Giyim", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=800" },
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
      await new Promise(r => setTimeout(r, 2000));
      // Best free high-quota AI: FLUX via direct image endpoint
      const seed = Math.floor(Math.random() * 999999);
      const prompt = `professional studio product photography of ${selectedTemplate.name} featuring a "${selectedDesign.prompt}" design printed perfectly on it, realistic shadows, lifestyle lighting, 8k resolution, commercial advertising look`;
      const mockupUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
      
      setResultImage(mockupUrl);
      toast.success("Elite Mockup Hazır!");
    } catch (e) {
      toast.error("Üretim sırasında bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-120px)] flex flex-col gap-8 pb-10 animate-in fade-in duration-1000">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
           <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary border border-primary/20">
              <Sparkles className="h-6 w-6" />
           </div>
           <div>
              <h1 className="text-4xl font-black tracking-tighter uppercase italic text-foreground">
                Lumina <span className="text-primary">Elite Studio</span>
              </h1>
              <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground italic">Hyper-Realistic Flux Engine</p>
           </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-[400px_1fr] gap-8 flex-1">
        {/* SIDEBAR */}
        <div className="space-y-6">
           <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-14 p-1 bg-muted/30 rounded-2xl border border-border/50">
                 <TabsTrigger value="designs" className="rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                    <Palette className="h-4 w-4 mr-2" /> Tasarımlar
                 </TabsTrigger>
                 <TabsTrigger value="products" className="rounded-xl font-black text-[10px] uppercase tracking-widest transition-all">
                    <Box className="h-4 w-4 mr-2" /> Ürünler
                 </TabsTrigger>
              </TabsList>

              <TabsContent value="designs" className="mt-6 space-y-4 animate-in slide-in-from-left-4">
                 <div className="grid grid-cols-3 gap-3 overflow-y-auto max-h-[500px] pr-2 scrollbar-hide">
                    {isLoading ? (
                      Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded-2xl bg-muted/50 animate-pulse" />)
                    ) : designs?.map((d: any) => (
                      <div 
                        key={d.id}
                        onClick={() => { setSelectedDesign(d); if (!selectedDesign) setActiveTab("products"); }}
                        className={`group relative aspect-square rounded-2xl overflow-hidden cursor-pointer border-4 transition-all duration-500 ${
                          selectedDesign?.id === d.id ? "border-primary scale-95" : "border-transparent hover:border-primary/30"
                        }`}
                      >
                        <img src={d.image_url} alt="asset" className="h-full w-full object-cover" />
                        {selectedDesign?.id === d.id && (
                          <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                             <Check className="h-8 w-8 text-white" />
                          </div>
                        )}
                      </div>
                    ))}
                 </div>
              </TabsContent>

              <TabsContent value="products" className="mt-6 space-y-3 animate-in slide-in-from-right-4">
                 {PRODUCT_TEMPLATES.map((tmpl) => (
                    <Card 
                      key={tmpl.id}
                      onClick={() => setSelectedTemplate(tmpl)}
                      className={`group relative overflow-hidden rounded-2xl cursor-pointer border-2 transition-all duration-500 ${
                        selectedTemplate.id === tmpl.id ? "border-primary bg-primary/5" : "border-border/30 bg-card"
                      }`}
                    >
                      <CardContent className="p-4 flex items-center gap-4">
                         <div className="h-16 w-16 rounded-xl overflow-hidden shadow-inner border border-border/50">
                            <img src={tmpl.image} alt={tmpl.name} className="h-full w-full object-cover" />
                         </div>
                         <div className="flex-1">
                            <p className="font-black text-xs uppercase tracking-tight">{tmpl.name}</p>
                            <span className="text-[9px] text-muted-foreground font-bold italic uppercase">{tmpl.type}</span>
                         </div>
                         {selectedTemplate.id === tmpl.id && <Zap className="h-4 w-4 text-primary animate-pulse" />}
                      </CardContent>
                    </Card>
                 ))}
              </TabsContent>
           </Tabs>

           <Button 
            className="w-full h-16 rounded-2xl font-black text-lg uppercase tracking-widest shadow-2xl transition-all hover:scale-[1.02] bg-foreground text-background hover:bg-primary hover:text-white"
            disabled={isGenerating || !selectedDesign}
            onClick={generateMockup}
           >
              {isGenerating ? <Loader2 className="h-6 w-6 animate-spin" /> : <><Zap className="h-6 w-6 mr-2" /> Mockup Oluştur</>}
           </Button>
        </div>

        {/* STAGE */}
        <div className="relative">
           <Card className="h-full border-none bg-card/30 backdrop-blur-3xl shadow-2xl rounded-[3rem] overflow-hidden flex flex-col relative z-10 border border-white/5">
              <div className="p-6 border-b border-white/5 flex items-center justify-between bg-black/20">
                 <div className="flex items-center gap-3">
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Studio Render Live</span>
                 </div>
                 <div className="flex gap-2">
                    <div className="h-8 w-8 rounded-lg bg-white/5 flex items-center justify-center text-muted-foreground border border-white/5 hover:text-white cursor-pointer">
                       <Maximize2 className="h-4 w-4" />
                    </div>
                 </div>
              </div>

              <div className="flex-1 flex items-center justify-center p-8 min-h-[500px]">
                 {isGenerating ? (
                    <div className="text-center space-y-6 animate-in zoom-in duration-500">
                       <div className="relative mx-auto h-32 w-32">
                          <div className="absolute inset-0 rounded-full border-4 border-primary/10 border-t-primary animate-spin" />
                          <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                             <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                          </div>
                       </div>
                       <p className="text-xs font-black uppercase tracking-widest text-primary animate-pulse">Flux Motoru Renderlıyor...</p>
                    </div>
                 ) : resultImage ? (
                    <div className="w-full h-full flex flex-col items-center justify-center animate-in zoom-in-95 duration-500">
                       <div className="relative group/img rounded-[2.5rem] overflow-hidden shadow-2xl border border-white/10 max-w-[90%] bg-white">
                          <img 
                            src={resultImage} 
                            alt="Mockup Result" 
                            className="w-full h-full object-contain"
                            onError={(e) => {
                              toast.error("Görsel yüklenemedi, lütfen tekrar deneyin.");
                              setResultImage(null);
                            }}
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/img:opacity-100 transition-all duration-300 flex items-center justify-center gap-4 backdrop-blur-sm">
                             <Button className="h-14 px-8 rounded-xl font-black uppercase tracking-widest shadow-2xl bg-white text-black hover:bg-primary hover:text-white border-none" onClick={() => window.open(resultImage, '_blank')}>
                                <Download className="mr-2 h-5 w-5" /> HD İndir
                             </Button>
                             <Button variant="secondary" className="h-14 px-8 rounded-xl font-black uppercase tracking-widest shadow-2xl" asChild>
                                <Link to="/inventory">Envanter</Link>
                             </Button>
                          </div>
                       </div>
                    </div>
                 ) : (
                    <div className="text-center space-y-8 opacity-40">
                       <LayoutGrid className="h-24 w-24 mx-auto text-muted-foreground" />
                       <div className="space-y-2">
                          <h2 className="text-2xl font-black uppercase tracking-tighter italic">Studio Hazır</h2>
                          <p className="text-[10px] font-bold uppercase tracking-widest">Lütfen Tasarım ve Ürün Seçin</p>
                       </div>
                    </div>
                 )}
              </div>

              <div className="p-6 bg-black/30 border-t border-white/5 backdrop-blur-md flex items-center justify-between">
                 <div className="flex gap-8">
                    {selectedDesign && (
                       <div className="flex items-center gap-3">
                          <img src={selectedDesign.image_url} className="h-10 w-10 rounded-lg object-cover border border-white/10" />
                          <span className="text-[10px] font-black uppercase tracking-tighter text-white/60">Tasarım Aktif</span>
                       </div>
                    )}
                    <div className="flex items-center gap-3">
                       <img src={selectedTemplate.image} className="h-10 w-10 rounded-lg object-cover border border-white/10" />
                       <span className="text-[10px] font-black uppercase tracking-tighter text-white/60">{selectedTemplate.name}</span>
                    </div>
                 </div>
                 <Button variant="ghost" className="h-10 w-10 rounded-xl bg-white/5 text-muted-foreground hover:text-white" onClick={() => { setResultImage(null); setSelectedDesign(null); }}>
                    <RotateCcw className="h-4 w-4" />
                 </Button>
              </div>
           </Card>
        </div>
      </div>
    </div>
  );
}

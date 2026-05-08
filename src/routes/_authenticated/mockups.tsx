import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { getUserDesigns } from "@/lib/ai.functions";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { 
  Sparkles, Image as ImageIcon, Check, Loader2, 
  ArrowRight, Box, ShoppingBag, Layers, Download,
  Maximize2, Zap, Palette
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/mockups")({
  component: MockupStudio,
});

const MOCKUP_TEMPLATES = [
  { id: "tshirt", name: "Premium T-Shirt", type: "Giyim", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=800" },
  { id: "mug", name: "Ceramic Mug", type: "Mutfak", image: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&q=80&w=800" },
  { id: "canvas", name: "Wall Canvas", type: "Dekor", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=800" },
  { id: "tote", name: "Eco Tote Bag", type: "Aksesuar", image: "https://images.unsplash.com/photo-1591337676887-a217a6970c8a?auto=format&fit=crop&q=80&w=800" },
];

function MockupStudio() {
  const { user } = useAuth();
  const getDesigns = useServerFn(getUserDesigns);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [selectedTemplate, setSelectedTemplate] = useState(MOCKUP_TEMPLATES[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);

  const { data: designs, isLoading } = useQuery({
    queryKey: ["user_designs", user?.id],
    queryFn: () => getDesigns({ data: { userId: user!.id } }),
    enabled: !!user,
  });

  const generateMockup = async () => {
    if (!selectedDesign) return toast.error("Lütfen bir tasarım seçin.");
    setIsGenerating(true);
    try {
      // Simulation: In a real app, this would send the design + template to an AI/Image processor
      await new Promise(r => setTimeout(r, 2500));
      // Using Pollinations to simulate a product photo with the design's prompt
      const mockupUrl = `https://pollinations.ai/p/${encodeURIComponent("professional studio product photography of a " + selectedTemplate.name + " with " + selectedDesign.prompt + " design printed on it, ultra high quality, commercial look")}?width=1024&height=1024&seed=${Math.floor(Math.random() * 1000)}`;
      setResultImage(mockupUrl);
      toast.success("Mockup başarıyla oluşturuldu!");
    } catch (e) {
      toast.error("Mockup oluşturulurken bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-2">
        <h1 className="text-5xl font-black tracking-tighter uppercase italic text-foreground">
          Mockup <span className="text-primary">Studio</span>
        </h1>
        <p className="text-muted-foreground font-bold italic text-sm tracking-tight">
          Tasarımlarınızı profesyonel ürün görsellerine dönüştürün ve Etsy'de fark yaratın.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-12">
        {/* Step 1: Design Selection */}
        <div className="lg:col-span-4 space-y-6">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
             <Badge className="h-5 w-5 rounded-full flex items-center justify-center p-0">1</Badge> Tasarım Seçin
          </div>
          <div className="grid grid-cols-2 gap-3 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
            {isLoading ? (
              [1, 2, 3, 4].map(i => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-card border border-border/50" />)
            ) : designs?.map((d: any) => (
              <Card 
                key={d.id} 
                className={`group relative aspect-square overflow-hidden rounded-2xl border-4 transition-all cursor-pointer ${
                  selectedDesign?.id === d.id ? "border-primary shadow-lg" : "border-transparent hover:border-primary/20"
                }`}
                onClick={() => setSelectedDesign(d)}
              >
                <img src={d.image_url} alt="design" className="h-full w-full object-cover" />
                {selectedDesign?.id === d.id && (
                  <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                     <Check className="h-8 w-8 text-white drop-shadow-md" />
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {/* Step 2: Template Selection */}
        <div className="lg:col-span-3 space-y-6">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Badge className="h-5 w-5 rounded-full flex items-center justify-center p-0">2</Badge> Ürün Şablonu
           </div>
           <div className="space-y-3">
              {MOCKUP_TEMPLATES.map((tmpl) => (
                <div 
                  key={tmpl.id}
                  onClick={() => setSelectedTemplate(tmpl)}
                  className={`flex items-center gap-4 p-4 rounded-2xl border-2 transition-all cursor-pointer ${
                    selectedTemplate.id === tmpl.id ? "border-primary bg-primary/5 shadow-md" : "border-border/50 hover:border-primary/20 bg-card/50"
                  }`}
                >
                  <div className="h-14 w-14 rounded-xl overflow-hidden shadow-sm">
                     <img src={tmpl.image} alt={tmpl.name} className="h-full w-full object-cover" />
                  </div>
                  <div>
                     <p className="font-black text-xs uppercase tracking-tight">{tmpl.name}</p>
                     <p className="text-[10px] text-muted-foreground font-bold italic">{tmpl.type}</p>
                  </div>
                </div>
              ))}
           </div>
           <Button 
            className="w-full h-14 font-black uppercase tracking-widest gap-2 bg-foreground text-background hover:bg-primary hover:text-white transition-all shadow-xl"
            disabled={isGenerating || !selectedDesign}
            onClick={generateMockup}
           >
              {isGenerating ? <Loader2 className="h-5 w-5 animate-spin" /> : <><Zap className="h-5 w-5" /> Mockup Oluştur</>}
           </Button>
        </div>

        {/* Step 3: Preview Result */}
        <div className="lg:col-span-5 space-y-6">
           <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
              <Badge className="h-5 w-5 rounded-full flex items-center justify-center p-0">3</Badge> Önizleme & İndir
           </div>
           <Card className="border-none bg-card shadow-2xl rounded-[2.5rem] overflow-hidden min-h-[400px] flex items-center justify-center relative">
              {isGenerating ? (
                <div className="text-center space-y-4">
                   <div className="relative mx-auto h-24 w-24">
                      <div className="absolute inset-0 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
                      <div className="absolute inset-4 rounded-full bg-primary/10 flex items-center justify-center">
                         <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                      </div>
                   </div>
                   <p className="text-xs font-black uppercase tracking-widest text-primary italic">AI Mockup Hazırlanıyor...</p>
                </div>
              ) : resultImage ? (
                <div className="w-full h-full animate-in zoom-in-95 duration-500">
                   <img src={resultImage} alt="result" className="w-full h-full object-cover" />
                   <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-3">
                      <Button className="h-12 px-8 font-black uppercase tracking-widest rounded-full shadow-2xl" onClick={() => window.open(resultImage, '_blank')}>
                         <Download className="mr-2 h-4 w-4" /> HD İndir
                      </Button>
                      <Button variant="secondary" className="h-12 px-8 font-black uppercase tracking-widest rounded-full shadow-2xl" asChild>
                         <Link to="/inventory">Envantere Ekle</Link>
                      </Button>
                   </div>
                </div>
              ) : (
                <div className="text-center p-12 space-y-6">
                   <div className="h-32 w-32 bg-muted rounded-[2.5rem] flex items-center justify-center mx-auto rotate-3 opacity-20">
                      <Layers className="h-16 w-16" />
                   </div>
                   <div className="space-y-2">
                      <p className="text-sm font-black uppercase tracking-tight">Henüz Mockup Oluşturulmadı</p>
                      <p className="text-[10px] text-muted-foreground font-bold italic max-w-xs mx-auto">
                         Sol taraftan tasarımınızı ve ürün şablonunu seçip "Mockup Oluştur" butonuna basın.
                      </p>
                   </div>
                </div>
              )}
           </Card>
           
           <Card className="bg-primary text-primary-foreground shadow-xl rounded-[2rem] border-none group overflow-hidden">
              <div className="absolute -right-4 -bottom-4 p-8 opacity-10 group-hover:scale-110 transition-transform">
                 <ShoppingBag className="h-24 w-24" />
              </div>
              <CardContent className="p-8 relative z-10 space-y-2">
                 <h4 className="font-black text-lg italic uppercase tracking-tighter">İpucu: Mockup Kalitesi</h4>
                 <p className="text-xs font-bold opacity-80 leading-relaxed italic">
                    "Etsy müşterileri, gerçekçi ürün fotoğraflarına %40 daha fazla tıklama eğilimindedir. Mockuplarınızı her zaman yüksek çözünürlükte indirin."
                 </p>
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}

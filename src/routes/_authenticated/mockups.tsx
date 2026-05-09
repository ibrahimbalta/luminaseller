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
  Download, Zap, Palette, Box, RotateCcw, Wand2
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/mockups")({
  component: MockupStudio,
});

const PRODUCTS = [
  { id: "tshirt-white", name: "Beyaz Tişört", type: "Giyim", image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=400" },
  { id: "tshirt-black", name: "Siyah Tişört", type: "Giyim", image: "https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?auto=format&fit=crop&q=80&w=400" },
  { id: "mug", name: "Seramik Kupa", type: "Mutfak", image: "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&q=80&w=400" },
  { id: "canvas", name: "Kanvas Tablo", type: "Dekor", image: "https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?auto=format&fit=crop&q=80&w=400" },
  { id: "tote", name: "Tote Çanta", type: "Aksesuar", image: "https://images.unsplash.com/photo-1591337676887-a217a6970c8a?auto=format&fit=crop&q=80&w=400" },
  { id: "hoodie", name: "Hoodie", type: "Giyim", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?auto=format&fit=crop&q=80&w=400" },
];

function MockupStudio() {
  const { user } = useAuth();
  const getDesigns = useServerFn(getUserDesigns);
  const [selectedDesign, setSelectedDesign] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState(PRODUCTS[0]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [resultImage, setResultImage] = useState<string | null>(null);
  const [tab, setTab] = useState<"designs" | "products">("designs");

  const { data: designs, isLoading } = useQuery({
    queryKey: ["user_designs", user?.id],
    queryFn: () => getDesigns({ data: { userId: user!.id } }),
    enabled: !!user,
  });

  const generate = async () => {
    if (!selectedDesign) return toast.error("Lütfen bir tasarım seçin.");
    setIsGenerating(true);
    setResultImage(null);
    try {
      await new Promise(r => setTimeout(r, 2000));
      const seed = Math.floor(Math.random() * 999999);
      const prompt = `professional studio product photography of ${selectedProduct.name} featuring a "${selectedDesign.prompt}" design printed on it, realistic shadows, lifestyle lighting, 8k, commercial look`;
      const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true&model=flux&seed=${seed}`;
      setResultImage(url);
      toast.success("Mockup oluşturuldu!");
    } catch {
      toast.error("Bir hata oluştu.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Mockup Studio</h1>
          <p className="text-sm text-muted-foreground mt-1">Tasarımlarınızı ürün görsellerine dönüştürün.</p>
        </div>
        <Button asChild variant="outline" size="sm" className="gap-2 mt-3 sm:mt-0">
          <Link to="/generate"><Wand2 className="h-3.5 w-3.5" /> Yeni Tasarım</Link>
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-[340px_1fr]">
        {/* Left Panel */}
        <div className="space-y-4">
          {/* Tab Switcher */}
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setTab("designs")}
              className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === "designs" ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              <Palette className="h-3.5 w-3.5" /> Tasarımlar
            </button>
            <button
              onClick={() => setTab("products")}
              className={`flex-1 px-3 py-2 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors ${
                tab === "products" ? "bg-foreground text-background" : "hover:bg-muted"
              }`}
            >
              <Box className="h-3.5 w-3.5" /> Ürünler
            </button>
          </div>

          {/* Designs Tab */}
          {tab === "designs" && (
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">Kütüphane</CardTitle>
                  <Badge variant="secondary" className="text-[10px]">{designs?.length || 0}</Badge>
                </div>
              </CardHeader>
              <CardContent className="pb-4">
                <div className="grid grid-cols-3 gap-2 max-h-[400px] overflow-y-auto">
                  {isLoading ? (
                    Array.from({ length: 9 }).map((_, i) => <div key={i} className="aspect-square rounded-md bg-muted/50 animate-pulse" />)
                  ) : designs?.map((d: any) => (
                    <div
                      key={d.id}
                      onClick={() => { setSelectedDesign(d); setTab("products"); }}
                      className={`relative aspect-square rounded-md overflow-hidden cursor-pointer border-2 transition-all ${
                        selectedDesign?.id === d.id ? "border-primary" : "border-transparent hover:border-border"
                      }`}
                    >
                      <img src={d.image_url} alt="" className="h-full w-full object-cover" />
                      {selectedDesign?.id === d.id && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <Check className="h-5 w-5 text-white" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Products Tab */}
          {tab === "products" && (
            <Card className="rounded-xl border-border/60 shadow-sm">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Ürün Şablonları</CardTitle>
              </CardHeader>
              <CardContent className="pb-4 space-y-2">
                {PRODUCTS.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className={`flex items-center gap-3 p-2.5 rounded-lg cursor-pointer transition-colors ${
                      selectedProduct.id === p.id ? "bg-primary/10 border border-primary/20" : "hover:bg-muted/50 border border-transparent"
                    }`}
                  >
                    <div className="h-10 w-10 rounded-md overflow-hidden border border-border/50 shrink-0">
                      <img src={p.image} alt={p.name} className="h-full w-full object-cover" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">{p.type}</p>
                    </div>
                    {selectedProduct.id === p.id && <Check className="h-4 w-4 text-primary shrink-0" />}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Generate Button */}
          <Button
            className="w-full gap-2"
            disabled={isGenerating || !selectedDesign}
            onClick={generate}
          >
            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
            {isGenerating ? "Oluşturuluyor..." : "Mockup Oluştur"}
          </Button>

          {/* Selection Summary */}
          <div className="text-[11px] text-muted-foreground space-y-1 px-1">
            <div className="flex justify-between">
              <span>Tasarım:</span>
              <span className="font-medium text-foreground">{selectedDesign ? "Seçildi" : "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>Ürün:</span>
              <span className="font-medium text-foreground">{selectedProduct.name}</span>
            </div>
          </div>
        </div>

        {/* Preview */}
        <Card className="rounded-xl border-border/60 shadow-sm overflow-hidden min-h-[500px] flex flex-col">
          <CardHeader className="pb-2 border-b border-border/30">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-green-500" /> Önizleme
              </CardTitle>
              {resultImage && (
                <Button variant="ghost" size="sm" className="h-7 text-xs gap-1" onClick={() => { setResultImage(null); }}>
                  <RotateCcw className="h-3 w-3" /> Sıfırla
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="flex-1 flex items-center justify-center p-6">
            {isGenerating ? (
              <div className="text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
                <div>
                  <p className="text-sm font-medium">Mockup oluşturuluyor</p>
                  <p className="text-[11px] text-muted-foreground mt-1">Flux AI motoru çalışıyor...</p>
                </div>
              </div>
            ) : resultImage ? (
              <div className="w-full space-y-4 animate-in fade-in duration-500">
                <div className="rounded-lg overflow-hidden border border-border/50 bg-white">
                  <img
                    src={resultImage}
                    alt="Mockup"
                    className="w-full h-auto"
                    onError={() => { toast.error("Görsel yüklenemedi, tekrar deneyin."); setResultImage(null); }}
                  />
                </div>
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 gap-2" onClick={() => window.open(resultImage, '_blank')}>
                    <Download className="h-3.5 w-3.5" /> İndir
                  </Button>
                  <Button asChild size="sm" variant="outline" className="flex-1 gap-2">
                    <Link to="/inventory">Envantere Ekle</Link>
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center text-muted-foreground">
                <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
                <p className="text-sm font-medium">Önizleme alanı</p>
                <p className="text-[11px] mt-1">Tasarım ve ürün seçip "Mockup Oluştur" butonuna tıklayın.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

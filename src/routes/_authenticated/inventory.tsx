import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { fetchEtsyListings } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, Search, RefreshCw, ExternalLink, Sparkles, AlertCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/inventory")({
  component: InventoryPage,
});

import { generateListing } from "@/lib/ai.functions";

function InventoryPage() {
  const { user } = useAuth();
  const getListings = useServerFn(fetchEtsyListings);
  const genListing = useServerFn(generateListing);
  const [searchTerm, setSearchTerm] = useState("");
  const [optimizingId, setOptimizingId] = useState<string | null>(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["etsy_listings", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await getListings({ data: { userId: user.id } });
    },
    enabled: !!user,
  });

  const handleOptimize = async (listing: any) => {
    setOptimizingId(listing.id);
    try {
      const res = await genListing({ 
        data: { 
          prompt: listing.title, 
          niche: "Etsy POD", 
          language: "tr" 
        } 
      });
      toast.success(
        <div className="space-y-2">
          <p className="font-bold">✨ SEO Önerisi Hazır!</p>
          <p className="text-xs italic">"{res.title}"</p>
          <Button size="xs" variant="outline" className="w-full text-[10px]" onClick={() => navigator.clipboard.writeText(res.title)}>
             Başlığı Kopyala
          </Button>
        </div>,
        { duration: 6000 }
      );
    } catch (e) {
      toast.error("Optimizasyon hatası");
    } finally {
      setOptimizingId(null);
    }
  };

  const filteredListings = data?.listings?.filter((l: any) => 
    l.title.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Envanter</h1>
          <p className="text-sm text-muted-foreground mt-1">Mağazanızdaki ürünleri yönetin ve SEO optimizasyonu yapın.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => refetch()} disabled={isLoading || isRefetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefetching ? "animate-spin" : ""}`} />
            Yenile
          </Button>
        </div>
      </div>

      {data?.isDemo && (
        <div className="flex items-center gap-3 rounded-lg border border-yellow-500/20 bg-yellow-500/10 p-4 text-yellow-500">
          <AlertCircle className="h-5 w-5" />
          <div className="text-xs">
            <span className="font-bold uppercase">Demo Modu:</span> Henüz dükkanınızı bağlamadığınız için örnek veriler gösteriliyor.
          </div>
        </div>
      )}

      <Card className="border-border/50">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input 
                placeholder="Ürün ara..." 
                className="pl-9 bg-card/50" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex h-40 flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-sm text-muted-foreground">Ürünler yükleniyor...</p>
            </div>
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card/30">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead className="w-[80px]">Görsel</TableHead>
                    <TableHead>Ürün Başlığı</TableHead>
                    <TableHead>SEO Puanı</TableHead>
                    <TableHead>Fiyat / Stok</TableHead>
                    <TableHead className="text-right">İşlem</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredListings.length > 0 ? (
                    filteredListings.map((l: any) => (
                      <TableRow key={l.id} className="hover:bg-muted/30 transition-colors">
                        <TableCell>
                          <img src={l.image} className="h-12 w-12 rounded-lg object-cover border border-border shadow-sm" />
                        </TableCell>
                        <TableCell>
                          <div className="max-w-[300px] truncate font-bold text-sm" title={l.title}>
                            {l.title}
                          </div>
                          <div className="text-[10px] text-muted-foreground">ID: {l.id}</div>
                        </TableCell>
                        <TableCell>
                           <div className="flex items-center gap-2">
                              <div className="h-1.5 w-16 bg-muted rounded-full overflow-hidden">
                                 <div 
                                  className={`h-full rounded-full ${l.views > 100 ? 'bg-green-500' : 'bg-yellow-500'}`} 
                                  style={{ width: `${Math.min(100, (l.views / 2))}%` }} 
                                 />
                              </div>
                              <span className="text-[10px] font-bold">{Math.min(100, (l.views / 2))}%</span>
                           </div>
                        </TableCell>
                        <TableCell>
                           <div className="text-sm font-black">{l.price} TL</div>
                           <div className="text-[10px] text-muted-foreground">{l.stock} stokta</div>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button 
                              size="xs" 
                              variant={optimizingId === l.id ? "secondary" : "default"} 
                              onClick={() => handleOptimize(l)}
                              disabled={!!optimizingId}
                              className="h-8 gap-1.5 font-bold"
                            >
                               {optimizingId === l.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Sparkles className="h-3 w-3" />}
                               {optimizingId === l.id ? "Analiz..." : "İyileştir"}
                            </Button>
                            <Button size="xs" variant="outline" className="h-8 w-8 p-0" asChild>
                              <a href={`https://www.etsy.com/listing/${l.id}`} target="_blank">
                                <ExternalLink className="h-3.5 w-3.5" />
                              </a>
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="h-24 text-center text-muted-foreground">
                        Ürün bulunamadı.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

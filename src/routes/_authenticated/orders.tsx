import { createFileRoute } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { fetchEtsyOrders } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, ShoppingCart, DollarSign, Package, TrendingUp, AlertCircle } from "lucide-react";

export const Route = createFileRoute("/_authenticated/orders")({
  component: OrdersPage,
});

function OrdersPage() {
  const { user } = useAuth();
  const getOrders = useServerFn(fetchEtsyOrders);

  const { data, isLoading } = useQuery({
    queryKey: ["etsy_orders", user?.id],
    queryFn: async () => {
      if (!user) return null;
      return await getOrders({ data: { userId: user.id } });
    },
    enabled: !!user,
  });

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Siparişler & Finans</h1>
        <p className="text-sm text-muted-foreground mt-1">Satış performansınızı ve finansal büyümenizi takip edin.</p>
      </div>

      {data?.isDemo && (
        <div className="flex items-center gap-3 rounded-xl border border-blue-500/20 bg-blue-500/5 p-4 text-blue-600 backdrop-blur-sm">
          <AlertCircle className="h-5 w-5" />
          <div className="text-xs font-medium">
            <span className="font-bold uppercase tracking-wider mr-2">Bilgi:</span> 
            Etsy dükkanınızı bağlayana kadar size ilham verecek örnek veriler gösteriyoruz.
          </div>
        </div>
      )}

      <div className="grid gap-4 sm:grid-cols-3">
        {[
          { label: "Toplam Satış", value: data?.stats?.totalSales || 0, sub: "Tamamlanan sipariş", icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Toplam Gelir", value: `${data?.stats?.totalRevenue || 0} TL`, sub: "Brüt kazanç", icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Aktif Siparişler", value: data?.stats?.activeOrders || 0, sub: "Hazırlanıyor", icon: Package, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((stat, i) => (
          <Card key={i} className="border-none bg-card/50 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{stat.label}</p>
                  <h3 className="mt-1 text-2xl font-black">{stat.value}</h3>
                  <p className="mt-1 text-[10px] text-muted-foreground font-medium">{stat.sub}</p>
                </div>
                <div className={`rounded-2xl p-4 ${stat.bg}`}>
                  <stat.icon className={`h-6 w-6 ${stat.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="border-border/50 bg-card/30 backdrop-blur-sm overflow-hidden">
        <CardHeader className="border-b border-border/50 bg-muted/20">
          <CardTitle className="text-lg font-bold flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Son İşlemler
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex h-60 flex-col items-center justify-center gap-2">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs text-muted-foreground font-bold animate-pulse">VERİLER ÇEKİLİYOR...</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/30">
                  <TableRow>
                    <TableHead className="text-[10px] font-black uppercase">Sipariş</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Müşteri</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Tarih</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-center">Ürün</TableHead>
                    <TableHead className="text-[10px] font-black uppercase">Tutar</TableHead>
                    <TableHead className="text-[10px] font-black uppercase text-right">Durum</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data?.orders?.map((o: any) => (
                    <TableRow key={o.id} className="hover:bg-muted/20 transition-colors">
                      <TableCell className="font-bold text-xs">#{o.id}</TableCell>
                      <TableCell>
                         <div className="font-bold text-sm">{o.customer}</div>
                         <div className="text-[10px] text-muted-foreground">Etsy Verified</div>
                      </TableCell>
                      <TableCell className="text-xs font-medium text-muted-foreground">{o.date}</TableCell>
                      <TableCell className="text-center">
                         <Badge variant="outline" className="text-[10px] font-bold">{o.items} adet</Badge>
                      </TableCell>
                      <TableCell className="text-sm font-black text-primary">{o.total} TL</TableCell>
                      <TableCell className="text-right">
                        <Badge 
                          className={`text-[10px] font-black uppercase px-3 py-1 ${
                            o.status === "Shipped" ? "bg-green-500/10 text-green-600 hover:bg-green-500/20" : 
                            o.status === "Paid" ? "bg-primary/10 text-primary hover:bg-primary/20" : 
                            "bg-orange-500/10 text-orange-600"
                          }`}
                        >
                          {o.status === "Paid" ? "ÖDENDİ" : o.status === "Shipped" ? "GÖNDERİLDİ" : "BEKLEMEDE"}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

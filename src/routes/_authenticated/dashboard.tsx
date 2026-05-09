import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchEtsyOrders } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import {
  TrendingUp, Wand2, Image as ImageIcon, ArrowRight,
  DollarSign, Sparkles, ShoppingBag, Palette, Megaphone,
  Zap, Activity, Target, BarChart3, Eye, Package, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const getOrders = useServerFn(fetchEtsyOrders);
  const [stats, setStats] = useState({ trends: 0, designs: 0, sales: 0, revenue: "0" });
  const [recentDesigns, setRecentDesigns] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      try {
        const [t, d, ordersData] = await Promise.all([
          supabase.from("trend_searches").select("id", { count: "exact", head: true }),
          supabase.from("designs").select("id", { count: "exact", head: true }),
          getOrders({ data: { userId: user.id } }).catch(() => null),
        ]);

        const { data: recent } = await supabase
          .from("designs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(4);

        setStats({
          trends: t.count ?? 0,
          designs: d.count ?? 0,
          sales: ordersData?.stats?.totalSales || 0,
          revenue: ordersData?.stats?.totalRevenue || "0",
        });
        setRecentDesigns(recent ?? []);
      } catch (e) {
        console.error("Dashboard load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return "Günaydın";
    if (h < 18) return "İyi günler";
    return "İyi akşamlar";
  };

  return (
    <div className="space-y-8 pb-16 animate-in fade-in duration-500">

      {/* ── GREETING ── */}
      <section className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{greeting()},</p>
          <h1 className="text-3xl font-semibold tracking-tight">
            {profile?.display_name || user?.email?.split("@")[0] || "Satıcı"}
          </h1>
        </div>
        <div className="flex gap-3 mt-4 sm:mt-0">
          <Button asChild size="sm" className="gap-2 rounded-lg shadow-sm">
            <Link to="/generate"><Wand2 className="h-4 w-4" /> Yeni Tasarım</Link>
          </Button>
          <Button asChild variant="outline" size="sm" className="gap-2 rounded-lg">
            <Link to="/trends"><TrendingUp className="h-4 w-4" /> Trendler</Link>
          </Button>
        </div>
      </section>

      {/* ── KPI CARDS ── */}
      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam Satış", value: stats.sales, icon: ShoppingBag, change: "+12%", positive: true },
          { label: "Net Gelir", value: `₺${stats.revenue}`, icon: DollarSign, change: "+8%", positive: true },
          { label: "Tasarımlar", value: stats.designs, icon: Palette, change: `${stats.designs}`, positive: true },
          { label: "AI Kredisi", value: profile?.credits ?? 0, icon: Zap, change: "Aktif", positive: true },
        ].map((kpi, i) => (
          <Card key={i} className="rounded-xl border-border/60 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm text-muted-foreground font-medium">{kpi.label}</span>
                <kpi.icon className="h-4 w-4 text-muted-foreground/60" />
              </div>
              <div className="flex items-end gap-2">
                <span className="text-2xl font-semibold tracking-tight">{kpi.value}</span>
                <Badge variant="secondary" className="text-[10px] font-medium mb-0.5">
                  {kpi.change}
                </Badge>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-5">

        {/* ── LEFT: CHART + RECENT ── */}
        <div className="lg:col-span-3 space-y-6">

          {/* Revenue Chart */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Haftalık Gelir</CardTitle>
                <Badge variant="outline" className="text-[10px] font-medium">Son 7 Gün</Badge>
              </div>
            </CardHeader>
            <CardContent className="pt-4 pb-6">
              <div className="flex items-end gap-2 h-36">
                {[
                  { day: "Pzt", val: 35 },
                  { day: "Sal", val: 52 },
                  { day: "Çar", val: 28 },
                  { day: "Per", val: 74 },
                  { day: "Cum", val: 60 },
                  { day: "Cmt", val: 90 },
                  { day: "Paz", val: 68 },
                ].map((d, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group">
                    <div className="w-full relative">
                      <div
                        className="w-full bg-primary/15 group-hover:bg-primary/30 rounded-md transition-colors cursor-default"
                        style={{ height: `${d.val * 1.5}px` }}
                      />
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-[10px] font-medium text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity bg-popover border rounded px-1.5 py-0.5 shadow-sm whitespace-nowrap">
                        ₺{d.val * 12}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground font-medium">{d.day}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Designs */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-muted-foreground">Son Tasarımlar</CardTitle>
                <Button asChild variant="ghost" size="sm" className="text-xs text-muted-foreground gap-1 h-7">
                  <Link to="/gallery">Tümünü Gör <ArrowRight className="h-3 w-3" /></Link>
                </Button>
              </div>
            </CardHeader>
            <CardContent className="pb-5">
              {recentDesigns.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {recentDesigns.map((d) => (
                    <div key={d.id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-muted/30 aspect-square">
                      <img src={d.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-2.5 translate-y-full group-hover:translate-y-0 transition-transform">
                        <p className="text-[10px] text-white font-medium line-clamp-2">{d.prompt}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                  <ImageIcon className="h-8 w-8 mb-2 opacity-30" />
                  <p className="text-sm font-medium">Henüz tasarım yok</p>
                  <p className="text-xs mt-1">İlk tasarımınızı oluşturmak için "Yeni Tasarım" butonuna tıklayın.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* ── RIGHT SIDEBAR ── */}
        <div className="lg:col-span-2 space-y-6">

          {/* Quick Actions */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Hızlı Erişim</CardTitle>
            </CardHeader>
            <CardContent className="space-y-1.5 pb-5">
              {[
                { label: "Trend Radar", desc: "Karlı nişleri keşfet", icon: TrendingUp, href: "/trends" },
                { label: "Mockup Studio", desc: "Ürün görselleri oluştur", icon: ImageIcon, href: "/mockups" },
                { label: "Pazarlama", desc: "Sosyal medya paylaşımları", icon: Megaphone, href: "/marketing" },
                { label: "Envanter", desc: "Ürün ve stok yönetimi", icon: Package, href: "/inventory" },
              ].map((item, i) => (
                <Link key={i} to={item.href} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors group">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{item.label}</p>
                    <p className="text-[11px] text-muted-foreground">{item.desc}</p>
                  </div>
                  <ArrowRight className="h-3.5 w-3.5 text-muted-foreground/40 group-hover:text-primary transition-colors" />
                </Link>
              ))}
            </CardContent>
          </Card>

          {/* Profit Calculator */}
          <ProfitCalculator />

          {/* Activity Feed */}
          <Card className="rounded-xl border-border/60 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Activity className="h-3.5 w-3.5" /> Son Aktiviteler
              </CardTitle>
            </CardHeader>
            <CardContent className="pb-5">
              <div className="space-y-3">
                {[
                  { text: "Yeni tasarım oluşturuldu", time: "2 dk önce", icon: Sparkles },
                  { text: "Etsy listeleme güncellendi", time: "1 saat önce", icon: ShoppingBag },
                  { text: "Trend raporu hazır", time: "3 saat önce", icon: BarChart3 },
                ].map((act, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="mt-0.5 h-7 w-7 rounded-md bg-muted flex items-center justify-center shrink-0">
                      <act.icon className="h-3.5 w-3.5 text-muted-foreground" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm">{act.text}</p>
                      <p className="text-[11px] text-muted-foreground">{act.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

/* ── PROFIT CALCULATOR ── */
function ProfitCalculator() {
  const [price, setPrice] = useState(250);
  const [cost, setCost] = useState(100);

  const etsyFees = price * 0.065 + price * 0.04 + 0.20 * 33 + 0.30 * 33;
  const net = price - cost - etsyFees;
  const margin = price > 0 ? (net / price) * 100 : 0;

  return (
    <Card className="rounded-xl border-border/60 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
          <DollarSign className="h-3.5 w-3.5" /> Kâr Hesaplayıcı
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4 pb-5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Satış Fiyatı (₺)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(Number(e.target.value))}
              className="w-full h-9 bg-muted/50 rounded-lg px-3 text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>
          <div>
            <label className="text-[11px] text-muted-foreground font-medium mb-1 block">Maliyet (₺)</label>
            <input
              type="number"
              value={cost}
              onChange={(e) => setCost(Number(e.target.value))}
              className="w-full h-9 bg-muted/50 rounded-lg px-3 text-sm font-medium border border-border/50 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-shadow"
            />
          </div>
        </div>
        <div className="bg-muted/40 rounded-lg p-4 space-y-2">
          <div className="flex justify-between text-[11px] text-muted-foreground">
            <span>Etsy Kesintileri</span>
            <span>₺{etsyFees.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border/60" />
          <div className="flex justify-between items-end">
            <div>
              <p className="text-[11px] text-muted-foreground">Net Kâr</p>
              <p className="text-xl font-semibold tracking-tight">{net > 0 ? "+" : ""}₺{net.toFixed(2)}</p>
            </div>
            <Badge variant={margin > 20 ? "default" : "secondary"} className="text-[10px]">
              %{isNaN(margin) ? 0 : margin.toFixed(0)} marj
            </Badge>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground text-center">
          Etsy %6.5 işlem + %4 ödeme komisyonu dahil
        </p>
      </CardContent>
    </Card>
  );
}

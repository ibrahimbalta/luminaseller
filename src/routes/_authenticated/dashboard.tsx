import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchEtsyOrders } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { 
  TrendingUp, Wand2, Image as ImageIcon, ArrowRight, 
  ShoppingCart, DollarSign, Package, Sparkles, Plus, Search
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: Dashboard,
});

function Dashboard() {
  const { user, profile } = useAuth();
  const getOrders = useServerFn(fetchEtsyOrders);
  const [stats, setStats] = useState({ trends: 0, designs: 0, sales: 0, revenue: "0" });
  const [recent, setRecent] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const [t, d, ordersData] = await Promise.all([
        supabase.from("trend_searches").select("id", { count: "exact", head: true }),
        supabase.from("designs").select("id", { count: "exact", head: true }),
        getOrders({ data: { userId: user.id } }),
      ]);
      
      const { data: recentDesigns } = await supabase
        .from("designs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(6);

      setStats({ 
        trends: t.count ?? 0, 
        designs: d.count ?? 0, 
        sales: ordersData?.stats?.totalSales || 0,
        revenue: ordersData?.stats?.totalRevenue || "0"
      });
      setRecent(recentDesigns ?? []);
      setLoading(false);
    })();
  }, [user]);

  const quickActions = [
    { to: "/trends", icon: Search, label: "Trend Ara", desc: "Yeni nişler keşfet" },
    { to: "/generate", icon: Wand2, label: "Tasarım Üret", desc: "AI ile görsel yarat" },
    { to: "/inventory", icon: Package, label: "SEO İyileştir", desc: "Listing'leri düzenle" },
  ];

  return (
    <div className="space-y-8 pb-10">
      {/* Welcome Section */}
      <section className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Merhaba, {profile?.display_name || "Girişimci"} 👋</h1>
          <p className="text-muted-foreground mt-1">İşte bugün Etsy dükkanında olup bitenler.</p>
        </div>
        <div className="flex gap-2">
          <Button asChild variant="default" size="sm" className="rounded-full shadow-lg shadow-primary/20">
            <Link to="/generate"><Plus className="mr-2 h-4 w-4" /> Yeni Tasarım</Link>
          </Button>
        </div>
      </section>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: "Toplam Satış", value: stats.sales, icon: ShoppingCart, color: "text-blue-500", bg: "bg-blue-500/10" },
          { label: "Tahmini Gelir", value: `${stats.revenue} TL`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10" },
          { label: "Üretilen Tasarım", value: stats.designs, icon: Wand2, color: "text-purple-500", bg: "bg-purple-500/10" },
          { label: "Trend Araması", value: stats.trends, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10" },
        ].map((s, i) => (
          <Card key={i} className="overflow-hidden border-none bg-card/50 shadow-sm backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <h3 className="mt-1 text-2xl font-bold">{s.value}</h3>
                </div>
                <div className={`rounded-xl p-3 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Col: Quick Actions & Trends */}
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-lg font-semibold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Hızlı İşlemler
            </h2>
            <div className="grid gap-4 sm:grid-cols-3">
              {quickActions.map((action) => (
                <Link
                  key={action.to}
                  to={action.to}
                  className="group relative flex flex-col gap-2 rounded-2xl border border-border bg-card p-5 transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl"
                >
                  <div className="w-fit rounded-lg bg-primary/10 p-2 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <action.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <div className="font-semibold">{action.label}</div>
                    <div className="text-xs text-muted-foreground">{action.desc}</div>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Son Tasarımlar</h2>
              <Button asChild variant="ghost" size="sm" className="text-xs">
                <Link to="/gallery">Tümünü Gör <ArrowRight className="ml-1 h-3 w-3" /></Link>
              </Button>
            </div>
            {recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
                <ImageIcon className="mx-auto h-10 w-10 text-muted-foreground/30" />
                <p className="mt-4 text-sm text-muted-foreground">Henüz bir tasarım üretmedin.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/generate">Hemen Başla</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {recent.map((d) => (
                  <Link key={d.id} to="/gallery" className="group aspect-square overflow-hidden rounded-xl border border-border bg-card">
                    <img 
                      src={d.image_url} 
                      alt={d.prompt} 
                      className="h-full w-full object-cover transition-transform group-hover:scale-110" 
                    />
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Col: Trend Radar */}
        <div className="space-y-6">
          <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-background shadow-md">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-primary" /> Trend Radarı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Vintage 90s Streetwear", change: "+45%", status: "Hot" },
                { name: "Custom Pet Portraits", change: "+12%", status: "Rising" },
                { name: "Minimalist Line Art", change: "+28%", status: "Hot" },
              ].map((trend, i) => (
                <div key={i} className="flex items-center justify-between rounded-lg bg-card/50 p-3 border border-border/50">
                  <div className="text-sm font-medium">{trend.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-bold text-green-500">{trend.change}</span>
                    <span className={`rounded-full px-2 py-0.5 text-[8px] font-bold uppercase ${
                      trend.status === "Hot" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {trend.status}
                    </span>
                  </div>
                </div>
              ))}
              <Button asChild variant="outline" className="w-full text-xs" size="sm">
                <Link to="/trends">Daha Fazla Keşfet</Link>
              </Button>
            </CardContent>
          </Card>


        </div>
      </div>
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchEtsyOrders } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { 
  TrendingUp, Wand2, Image as ImageIcon, ArrowRight, 
  ShoppingCart, DollarSign, Package, Sparkles, Search,
  ShoppingBag, Palette, Megaphone, Users, ArrowUpRight, BarChart3
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/dashboard")({
  component: DashboardPage,
});

function DashboardPage() {
  const { user, profile } = useAuth();
  const getOrders = useServerFn(fetchEtsyOrders);
  const [stats, setStats] = useState({ trends: 0, designs: 0, sales: 0, revenue: "0" });
  const [recent, setRecent] = useState<any[]>([]);
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
        
        const { data: recentDesigns } = await supabase
          .from("designs")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(6);

        setStats({ 
          trends: t.count ?? 0, 
          designs: d.count ?? 0, 
          sales: ordersData?.stats?.totalSales || 0,
          revenue: ordersData?.stats?.totalRevenue || "0"
        });
        setRecent(recentDesigns ?? []);
      } catch (e) {
        console.error("Dashboard data load error:", e);
      } finally {
        setLoading(false);
      }
    })();
  }, [user]);

  const QUICK_ACTIONS = [
    { title: "Trend Keşfet", desc: "Satan nişleri bul", icon: TrendingUp, href: "/trends", color: "bg-blue-500/10 text-blue-500" },
    { title: "Tasarım Üret", desc: "AI ile sanat yarat", icon: Palette, href: "/generate", color: "bg-purple-500/10 text-purple-500" },
    { title: "Pazarlama Yap", desc: "Sosyal medyada paylaş", icon: Megaphone, href: "/marketing", color: "bg-orange-500/10 text-orange-500" },
    { title: "Envanter", desc: "Ürünlerini yönet", icon: Package, href: "/inventory", color: "bg-green-500/10 text-green-500" },
  ];

  const statCards = [
    { label: "Toplam Satış", value: stats.sales, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/10", change: "+12%" },
    { label: "Tahmini Gelir", value: `${stats.revenue} TL`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/10", change: "+8%" },
    { label: "Üretilen Tasarım", value: stats.designs, icon: Palette, color: "text-purple-500", bg: "bg-purple-500/10", change: "+5" },
    { label: "Trend Araması", value: stats.trends, icon: TrendingUp, color: "text-orange-500", bg: "bg-orange-500/10", change: "Aktif" },
  ];

  return (
    <div className="space-y-8 pb-10 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Hoş geldin, {profile?.display_name || "Satıcı"} 👋</h1>
          <p className="mt-1 text-muted-foreground">Mağazanın bugünkü performansına ve AI önerilerine göz at.</p>
        </div>
        <Link to="/generate">
           <Button className="gap-2 shadow-lg shadow-primary/20 hover:scale-105 transition-transform">
             <Sparkles className="h-4 w-4" /> Yeni Tasarım Başlat
           </Button>
        </Link>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s, i) => (
          <Card key={i} className="overflow-hidden border-none bg-card/50 shadow-sm backdrop-blur-sm hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
                  <h3 className="mt-1 text-2xl font-bold">{s.value}</h3>
                </div>
                <div className={`rounded-xl p-3 ${s.bg}`}>
                  <s.icon className={`h-5 w-5 ${s.color}`} />
                </div>
              </div>
              <div className="mt-4 flex items-center gap-1 text-[10px] font-bold text-green-500">
                <ArrowUpRight className="h-3 w-3" /> {s.change} <span className="text-muted-foreground ml-1 font-normal">geçen haftaya göre</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-8">
          {/* Quick Actions */}
          <section>
            <h2 className="mb-4 text-lg font-bold flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" /> Hızlı İşlemler
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {QUICK_ACTIONS.map((action, i) => (
                <Link key={i} to={action.href}>
                  <Card className="border-border/50 transition-all hover:scale-[1.02] hover:border-primary/50 hover:shadow-xl cursor-pointer overflow-hidden group">
                    <CardContent className="p-5 flex items-center gap-4">
                      <div className={`rounded-2xl p-4 transition-colors group-hover:bg-primary group-hover:text-primary-foreground ${action.color}`}>
                         <action.icon className="h-7 w-7" />
                      </div>
                      <div>
                         <h3 className="font-bold text-base">{action.title}</h3>
                         <p className="text-xs text-muted-foreground">{action.desc}</p>
                      </div>
                      <ArrowRight className="ml-auto h-5 w-5 text-muted-foreground/30 group-hover:text-primary transition-colors" />
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Recent Designs */}
          <section>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold">Son Tasarımlar</h2>
              <Link to="/gallery" className="text-xs font-bold text-primary hover:underline flex items-center gap-1">
                Tümünü Gör <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
            {loading ? (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {[1, 2, 3, 4, 5, 6].map(i => <div key={i} className="aspect-square animate-pulse rounded-xl bg-card" />)}
              </div>
            ) : recent.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card/30 p-12 text-center">
                <ImageIcon className="mx-auto h-12 w-12 text-muted-foreground/20" />
                <p className="mt-4 text-sm text-muted-foreground">Henüz bir tasarım üretmedin.</p>
                <Button asChild variant="outline" size="sm" className="mt-4">
                  <Link to="/generate">Hemen Başla</Link>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-4 sm:grid-cols-6">
                {recent.map((d) => (
                  <Link key={d.id} to="/gallery" className="group relative aspect-square overflow-hidden rounded-2xl border border-border bg-card shadow-sm hover:shadow-md transition-all">
                    <img src={d.image_url} alt={d.prompt} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                       <Search className="h-6 w-6 text-white" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          <Card className="border-none bg-gradient-to-br from-primary/10 via-background to-background shadow-lg overflow-hidden">
            <CardHeader>
              <CardTitle className="text-md flex items-center gap-2 font-bold">
                <TrendingUp className="h-5 w-5 text-primary" /> Trend Radarı
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { name: "Vintage 90s Streetwear", change: "+45%", status: "Hot" },
                { name: "Custom Pet Portraits", change: "+12%", status: "Rising" },
                { name: "Minimalist Line Art", change: "+28%", status: "Hot" },
                { name: "Eco-Friendly Tote Bags", change: "+19%", status: "Rising" },
              ].map((trend, i) => (
                <div key={i} className="flex items-center justify-between rounded-xl bg-card/50 p-4 border border-border/50 hover:border-primary/30 transition-colors">
                  <div className="text-sm font-bold">{trend.name}</div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-black text-green-500">{trend.change}</span>
                    <span className={`rounded-full px-2.5 py-1 text-[8px] font-black uppercase ${
                      trend.status === "Hot" ? "bg-red-500/10 text-red-500" : "bg-blue-500/10 text-blue-500"
                    }`}>
                      {trend.status}
                    </span>
                  </div>
                </div>
              ))}
              <Link to="/trends">
                <Button variant="outline" className="w-full mt-2 font-bold text-xs">
                  Detaylı Analiz Et
                </Button>
              </Link>
            </CardContent>
          </Card>

          <Card className="bg-primary text-primary-foreground shadow-2xl shadow-primary/20 relative overflow-hidden group">
             <div className="absolute -right-4 -top-4 p-8 opacity-10 group-hover:scale-110 transition-transform">
                <Sparkles className="h-24 w-24" />
             </div>
             <CardContent className="p-6 relative z-10">
                <h3 className="font-bold text-xl leading-tight">Yapay Zeka Uzman Önerisi</h3>
                <p className="mt-4 text-sm opacity-90 leading-relaxed font-medium">
                  "Bugün **Retro Karakter** tasarımları Etsy'de %20 daha fazla aranıyor. Bir adet denemek ister misin?"
                </p>
                <Link to="/generate">
                  <Button variant="secondary" className="mt-6 w-full font-bold shadow-lg">
                     Hemen Üretmeye Başla
                  </Button>
                </Link>
             </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

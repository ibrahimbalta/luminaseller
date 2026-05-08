import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { fetchEtsyOrders } from "@/lib/ai.functions";
import { useServerFn } from "@tanstack/react-start";
import { 
  TrendingUp, Wand2, Image as ImageIcon, ArrowRight, 
  ShoppingCart, DollarSign, Package, Sparkles, Search,
  ShoppingBag, Palette, Megaphone, Users, ArrowUpRight, BarChart3,
  Bell, Zap, Crown, Target, Activity
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
    { title: "Trend Radar", desc: "Karlı nişleri keşfet", icon: TrendingUp, href: "/trends", color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Mockup Studio", desc: "Ürün görselleri üret", icon: ImageIcon, href: "/mockups", color: "text-orange-500", bg: "bg-orange-500/10" },
    { title: "AI Atölye", desc: "Yeni tasarımlar üret", icon: Wand2, href: "/generate", color: "text-purple-500", bg: "bg-purple-500/10" },
    { title: "Marketing", desc: "Sosyal medya otomasyonu", icon: Megaphone, href: "/marketing", color: "text-pink-500", bg: "bg-pink-500/10" },
  ];

  return (
    <div className="space-y-10 pb-20 animate-in fade-in slide-in-from-bottom-4 duration-1000">
      {/* ── TOP HERO SECTION ── */}
      <section className="relative overflow-hidden rounded-[3rem] bg-foreground px-8 py-12 text-background shadow-2xl">
         <div className="absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/10 blur-[100px]" />
         <div className="absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-primary/5 blur-[80px]" />
         
         <div className="relative z-10 flex flex-col gap-8 md:flex-row md:items-center md:justify-between">
            <div className="space-y-4">
               <div className="flex items-center gap-2">
                  <Badge className="bg-primary/20 text-primary border-none font-black text-[10px] uppercase tracking-widest px-3">
                     Elite Satıcı Paneli
                  </Badge>
                  {profile?.plan === 'PRO' && <Crown className="h-4 w-4 text-yellow-500 animate-bounce" />}
               </div>
               <h1 className="text-4xl font-black tracking-tighter sm:text-6xl uppercase italic">
                  Merhaba, <span className="text-primary">{profile?.display_name || "Satıcı"}</span>
               </h1>
               <p className="max-w-md text-sm font-bold opacity-70 italic leading-relaxed">
                  Lumina Seller ile bugün toplam <span className="text-primary font-black underline">₺{stats.revenue}</span> kazandınız. 
                  Yapay zeka mağazanız için 3 yeni trend keşfetti.
               </p>
            </div>
            
            <div className="flex flex-wrap gap-4">
               <Button asChild size="lg" className="h-14 rounded-2xl bg-primary px-8 font-black uppercase tracking-widest shadow-xl shadow-primary/20 hover:scale-105 transition-all">
                  <Link to="/generate"><Sparkles className="mr-2 h-5 w-5" /> Tasarım Başlat</Link>
               </Button>
               <Button variant="outline" size="lg" className="h-14 rounded-2xl border-white/10 bg-white/5 px-8 font-black uppercase tracking-widest text-white hover:bg-white/10">
                  <Link to="/trends">Trendleri Tara</Link>
               </Button>
            </div>
         </div>
      </section>

      {/* ── STATS GRID ── */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
         {[
           { label: "Canlı Satışlar", value: stats.sales, icon: ShoppingBag, color: "text-blue-500", bg: "bg-blue-500/5" },
           { label: "Net Kazanç", value: `₺${stats.revenue}`, icon: DollarSign, color: "text-green-500", bg: "bg-green-500/5" },
           { label: "Aktif Tasarım", value: stats.designs, icon: Palette, color: "text-purple-500", bg: "bg-purple-500/5" },
           { label: "AI Kredi", value: profile?.credits || 0, icon: Zap, color: "text-yellow-500", bg: "bg-yellow-500/5" },
         ].map((s, i) => (
           <Card key={i} className="group border-none bg-card/50 shadow-sm backdrop-blur-md hover:shadow-2xl transition-all duration-500 rounded-[2rem] overflow-hidden">
             <CardContent className="p-8">
                <div className={`mb-6 h-12 w-12 rounded-2xl ${s.bg} flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                   <s.icon className={`h-6 w-6 ${s.color}`} />
                </div>
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{s.label}</p>
                <h3 className="mt-2 text-4xl font-black tracking-tighter">{s.value}</h3>
                <div className="mt-4 h-1 w-full bg-muted rounded-full overflow-hidden">
                   <div className={`h-full ${s.bg.replace('/5', '')} animate-pulse`} style={{ width: '65%' }} />
                </div>
             </CardContent>
           </Card>
         ))}
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
         {/* ── MAIN CONTENT ── */}
         <div className="lg:col-span-2 space-y-10">
            {/* Quick Actions */}
            <section className="space-y-6">
               <div className="flex items-center justify-between">
                  <h2 className="text-xl font-black uppercase tracking-tighter italic flex items-center gap-2">
                     <Target className="h-5 w-5 text-primary" /> Hızlı Erişim
                  </h2>
               </div>
               <div className="grid gap-4 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <Link key={i} to={action.href} className="group">
                       <div className="flex items-center gap-4 rounded-[2rem] border border-border/50 bg-card p-6 transition-all duration-500 hover:border-primary/40 hover:shadow-2xl hover:-translate-y-1">
                          <div className={`h-16 w-16 rounded-[1.5rem] ${action.bg} flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-all`}>
                             <action.icon className="h-8 w-8" />
                          </div>
                          <div className="flex-1">
                             <h3 className="font-black text-lg uppercase tracking-tight">{action.title}</h3>
                             <p className="text-[10px] font-bold text-muted-foreground italic">{action.desc}</p>
                          </div>
                          <ArrowRight className="h-5 w-5 opacity-20 group-hover:opacity-100 group-hover:text-primary transition-all" />
                       </div>
                    </Link>
                  ))}
               </div>
            </section>

            {/* Performance Chart Simulation */}
            <section className="rounded-[3rem] border border-border/50 bg-card/30 p-10 shadow-sm">
               <div className="flex items-center justify-between mb-8">
                  <div className="space-y-1">
                     <h2 className="text-xl font-black uppercase tracking-tighter italic">Satış Performansı</h2>
                     <p className="text-[10px] font-bold text-muted-foreground italic uppercase">Son 7 Günlük Analiz</p>
                  </div>
                  <Badge variant="outline" className="font-black text-[10px] uppercase border-primary/20 text-primary">Canlı Veri</Badge>
               </div>
               
               <div className="flex h-48 items-end gap-3 sm:gap-6">
                  {[45, 65, 32, 85, 55, 95, 75].map((val, i) => (
                    <div key={i} className="group relative flex-1 flex flex-col items-center gap-3">
                       <div className="absolute -top-8 scale-0 opacity-0 group-hover:scale-100 group-hover:opacity-100 transition-all bg-primary text-white text-[10px] font-black px-2 py-1 rounded-md">
                          ₺{val * 10}
                       </div>
                       <div 
                        className="w-full bg-muted rounded-t-xl group-hover:bg-primary transition-all duration-700 cursor-pointer" 
                        style={{ height: `${val}%` }} 
                       />
                       <span className="text-[10px] font-black text-muted-foreground uppercase">{['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}</span>
                    </div>
                  ))}
               </div>
            </section>
         </div>

         {/* ── SIDEBAR ── */}
         <div className="space-y-8">
            <ProfitCalculator />

            {/* AI Insights */}
            <Card className="border-none bg-foreground text-background shadow-2xl rounded-[3rem] overflow-hidden group">
               <div className="absolute -right-6 -top-6 h-32 w-32 bg-primary/20 blur-[50px] group-hover:scale-150 transition-transform duration-1000" />
               <CardContent className="p-10 space-y-6 relative z-10">
                  <div className="flex items-center gap-3">
                     <div className="h-10 w-10 bg-primary rounded-xl flex items-center justify-center">
                        <Zap className="h-6 w-6 text-white" />
                     </div>
                     <span className="text-[10px] font-black uppercase tracking-widest italic opacity-70 text-primary">AI Önerisi</span>
                  </div>
                  <h3 className="text-2xl font-black italic tracking-tighter leading-tight uppercase">
                     Kupa satışlarınızda <span className="text-primary">Retro Vibes</span> rüzgarı esiyor.
                  </h3>
                  <p className="text-xs font-bold opacity-60 leading-relaxed italic">
                     Verilerimiz bu hafta %35 daha fazla dönüşüm öngörüyor. Yeni bir tasarım serisi başlatmak ister misiniz?
                  </p>
                  <Button variant="secondary" className="w-full h-12 font-black uppercase tracking-widest shadow-xl rounded-2xl">
                     <Link to="/generate">Atölyeye Git</Link>
                  </Button>
               </CardContent>
            </Card>

            {/* Recent Activity */}
            <section className="space-y-6">
               <h2 className="text-sm font-black uppercase tracking-[0.2em] italic text-muted-foreground flex items-center gap-2 px-2">
                  <Activity className="h-4 w-4" /> Son Etkinlikler
               </h2>
               <div className="space-y-4">
                  {[
                    { type: 'order', text: 'Yeni sipariş alındı! #ORD-9921', time: '2 dk önce', icon: ShoppingBag, color: 'text-blue-500' },
                    { type: 'design', text: 'Tasarım HD kalitesine yükseltildi', time: '15 dk önce', icon: Sparkles, color: 'text-purple-500' },
                    { type: 'listing', text: 'SEO iyileştirmesi tamamlandı', time: '1 saat önce', icon: Target, color: 'text-green-500' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border/50 hover:border-primary/20 transition-all cursor-pointer group">
                       <div className={`h-10 w-10 rounded-xl bg-muted flex items-center justify-center group-hover:scale-110 transition-transform`}>
                          <act.icon className={`h-4 w-4 ${act.color}`} />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-bold italic">{act.text}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mt-0.5">{act.time}</p>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
         </div>
      </div>
    </div>
  );
}

function ProfitCalculator() {
  const [price, setPrice] = useState<number>(250);
  const [cost, setCost] = useState<number>(100);
  
  const listingFee = 0.20 * 33; // Mock conversion for TL (1 USD = 33 TL approx)
  const transactionFee = price * 0.065;
  const processingFee = (price * 0.04) + (0.30 * 33);
  const totalFees = listingFee + transactionFee + processingFee;
  const netProfit = price - cost - totalFees;
  const margin = (netProfit / price) * 100;

  return (
    <Card className="border-none bg-card shadow-xl rounded-[2.5rem] overflow-hidden">
       <CardHeader className="bg-primary/5 pb-4">
          <CardTitle className="text-sm font-black uppercase tracking-widest flex items-center gap-2 italic">
             <DollarSign className="h-4 w-4 text-primary" /> Etsy Kâr Hesaplayıcı
          </CardTitle>
       </CardHeader>
       <CardContent className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Satış (₺)</label>
                <input 
                  type="number" 
                  value={price} 
                  onChange={(e) => setPrice(Number(e.target.value))}
                  className="w-full h-10 bg-muted/50 rounded-xl px-3 font-black text-sm border-none focus:ring-2 ring-primary/20"
                />
             </div>
             <div className="space-y-1">
                <label className="text-[9px] font-black uppercase text-muted-foreground ml-1">Maliyet (₺)</label>
                <input 
                  type="number" 
                  value={cost} 
                  onChange={(e) => setCost(Number(e.target.value))}
                  className="w-full h-10 bg-muted/50 rounded-xl px-3 font-black text-sm border-none focus:ring-2 ring-primary/20"
                />
             </div>
          </div>

          <div className="p-4 rounded-2xl bg-foreground text-background space-y-3">
             <div className="flex justify-between items-center text-[10px] font-bold opacity-60 uppercase">
                <span>Tahmini Kesinti:</span>
                <span>₺{totalFees.toFixed(2)}</span>
             </div>
             <div className="h-[1px] bg-white/10" />
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black uppercase opacity-60">Net Kâr</p>
                   <p className="text-2xl font-black tracking-tighter text-primary">₺{netProfit.toFixed(2)}</p>
                </div>
                <Badge className="bg-primary/20 text-primary border-none font-black mb-1">
                   %{isNaN(margin) ? 0 : margin.toFixed(0)} Marj
                </Badge>
             </div>
          </div>
          <p className="text-[8px] text-muted-foreground italic text-center leading-tight">
             *Hesaplamalar %6.5 işlem ve %4 + 0.30$ ödeme komisyonu (Etsy Türkiye standartları) baz alınarak yapılmıştır.
          </p>
       </CardContent>
    </Card>
  );
}

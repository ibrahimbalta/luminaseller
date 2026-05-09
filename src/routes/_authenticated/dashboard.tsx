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
  Bell, Zap, Crown, Target, Activity, ZapOff, Globe,
  LayoutDashboard, MousePointer2, PieChart
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
          .limit(8);

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
    { title: "Trend Radar", desc: "Pazarın Nabzı", icon: TrendingUp, href: "/trends", color: "text-cyan-400", bg: "bg-cyan-400/10", border: "border-cyan-400/20" },
    { title: "Mockup Studio", desc: "Elite Sunum", icon: ImageIcon, href: "/mockups", color: "text-orange-400", bg: "bg-orange-400/10", border: "border-orange-400/20" },
    { title: "AI Atölye", desc: "Sanat Üretimi", icon: Wand2, href: "/generate", color: "text-purple-400", bg: "bg-purple-400/10", border: "border-purple-400/20" },
    { title: "Marketing", desc: "Küresel Erişim", icon: Megaphone, href: "/marketing", color: "text-pink-400", bg: "bg-pink-400/10", border: "border-pink-400/20" },
  ];

  return (
    <div className="space-y-12 pb-24 animate-in fade-in slide-in-from-bottom-8 duration-1000">
      {/* ── HYPER-PREMIUM HERO SECTION ── */}
      <section className="relative group perspective-1000">
         {/* Background Glows */}
         <div className="absolute -inset-1 bg-gradient-to-r from-primary/50 to-accent/50 rounded-[4rem] blur-2xl opacity-20 group-hover:opacity-40 transition-opacity duration-1000" />
         
         <div className="relative overflow-hidden rounded-[4rem] bg-[#0A0A0A] border border-white/5 shadow-[0_0_100px_rgba(0,0,0,0.8)]">
            {/* Animated Mesh Background */}
            <div className="absolute inset-0 opacity-20">
               <div className="absolute top-0 -left-20 w-96 h-96 bg-primary/30 rounded-full blur-[120px] animate-pulse" />
               <div className="absolute bottom-0 -right-20 w-96 h-96 bg-accent/20 rounded-full blur-[120px] animate-pulse delay-700" />
            </div>

            <div className="relative z-10 px-12 py-20 flex flex-col lg:flex-row items-center justify-between gap-12">
               <div className="space-y-8 max-w-2xl text-center lg:text-left">
                  <div className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md">
                     <span className="relative flex h-3 w-3">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                        <span className="relative inline-flex rounded-full h-3 w-3 bg-primary"></span>
                     </span>
                     <span className="text-[10px] font-black uppercase tracking-[0.4em] text-white/70">Elite Merchant OS v4.0</span>
                  </div>
                  
                  <div className="space-y-4">
                     <h1 className="text-6xl sm:text-8xl font-black tracking-tighter leading-none italic uppercase">
                        <span className="text-white">MERHABA,</span><br />
                        <span className="bg-gradient-to-r from-primary via-white to-primary bg-clip-text text-transparent animate-gradient-x">{profile?.display_name || "SATICI"}</span>
                     </h1>
                     <p className="text-lg font-bold text-white/40 italic leading-relaxed max-w-lg">
                        Lumina Intelligence bugün mağazanız için <span className="text-white underline decoration-primary decoration-4">7 yeni büyüme sinyali</span> yakaladı. 
                        Pazar payınız son 24 saatte %12 arttı.
                     </p>
                  </div>

                  <div className="flex flex-wrap items-center justify-center lg:justify-start gap-6 pt-4">
                     <Button asChild size="lg" className="h-16 px-12 rounded-2xl bg-primary text-white font-black uppercase tracking-widest shadow-[0_10px_40px_rgba(var(--primary),0.3)] hover:scale-105 transition-all group/btn">
                        <Link to="/generate">
                           <Sparkles className="mr-3 h-6 w-6 group-hover/btn:rotate-12 transition-transform" /> 
                           YENİ SANAT BAŞLAT
                        </Link>
                     </Button>
                     <Button variant="ghost" size="lg" className="h-16 px-12 rounded-2xl border border-white/10 text-white font-black uppercase tracking-widest hover:bg-white/5">
                        <Link to="/trends" className="flex items-center gap-3">
                           <Globe className="h-5 w-5 opacity-50" /> TRENDLERİ TARA
                        </Link>
                     </Button>
                  </div>
               </div>

               {/* Hero Visual: Pulsing Performance Orb */}
               <div className="relative hidden lg:block">
                  <div className="h-80 w-80 rounded-full bg-gradient-to-br from-primary/20 to-transparent border border-white/10 flex items-center justify-center relative animate-float">
                     <div className="absolute inset-0 rounded-full border border-primary/20 animate-ping opacity-20" />
                     <div className="text-center space-y-2">
                        <div className="text-5xl font-black tracking-tighter text-white">₺{stats.revenue}</div>
                        <div className="text-[10px] font-black uppercase tracking-widest text-primary">Günlük Net Akış</div>
                     </div>
                     {/* Floating Orbs */}
                     <div className="absolute -top-4 -right-4 h-16 w-16 rounded-2xl bg-white/5 backdrop-blur-xl border border-white/10 flex items-center justify-center rotate-12 shadow-2xl">
                        <TrendingUp className="h-8 w-8 text-primary" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </section>

      {/* ── THE ORB STATS ── */}
      <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
         {[
           { label: "Canlı Sipariş", value: stats.sales, icon: ShoppingBag, color: "text-cyan-400", bg: "from-cyan-400/20", trend: "+24%" },
           { label: "Net Kazanç", value: `₺${stats.revenue}`, icon: DollarSign, color: "text-emerald-400", bg: "from-emerald-400/20", trend: "+18%" },
           { label: "Üretilen Tasarım", value: stats.designs, icon: Palette, color: "text-violet-400", bg: "from-violet-400/20", trend: "Elite" },
           { label: "AI Gücü", value: profile?.credits || 0, icon: Zap, color: "text-amber-400", bg: "from-amber-400/20", trend: "Aktif" },
         ].map((s, i) => (
           <div key={i} className="group relative overflow-hidden rounded-[2.5rem] bg-white/[0.03] border border-white/5 p-8 transition-all duration-700 hover:bg-white/[0.06] hover:-translate-y-2 hover:shadow-2xl">
              <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-bl ${s.bg} to-transparent blur-3xl opacity-0 group-hover:opacity-100 transition-opacity`} />
              
              <div className="relative z-10 flex flex-col gap-6">
                 <div className="flex items-center justify-between">
                    <div className={`h-14 w-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-12`}>
                       <s.icon className={`h-7 w-7 ${s.color}`} />
                    </div>
                    <Badge variant="outline" className={`text-[10px] font-black border-none ${s.color} bg-white/5`}>
                       {s.trend}
                    </Badge>
                 </div>
                 
                 <div className="space-y-1">
                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/40">{s.label}</p>
                    <h3 className="text-4xl font-black tracking-tighter text-white">{s.value}</h3>
                 </div>

                 {/* Simulated Micro-Graph */}
                 <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className={`h-full bg-gradient-to-r from-transparent via-${s.color.split('-')[1]}-400 to-transparent w-full animate-shimmer`} />
                 </div>
              </div>
           </div>
         ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-[1fr_400px]">
         {/* ── LEFT: ANALYTICS & ACTIONS ── */}
         <div className="space-y-12">
            {/* Quick Actions Grid */}
            <section className="space-y-8">
               <div className="flex items-center gap-4">
                  <h2 className="text-2xl font-black uppercase tracking-tighter italic text-white">Elite Araçlar</h2>
                  <div className="h-[2px] flex-1 bg-gradient-to-r from-white/10 to-transparent" />
               </div>
               <div className="grid gap-6 sm:grid-cols-2">
                  {QUICK_ACTIONS.map((action, i) => (
                    <Link key={i} to={action.href} className="group">
                       <div className={`h-full flex items-center gap-6 rounded-[2.5rem] border ${action.border} bg-white/[0.02] p-8 transition-all duration-500 hover:bg-white/[0.05] hover:shadow-[0_20px_50px_rgba(0,0,0,0.5)]`}>
                          <div className={`h-20 w-20 rounded-[2rem] ${action.bg} flex items-center justify-center group-hover:scale-110 transition-all shadow-inner`}>
                             <action.icon className={`h-10 w-10 ${action.color}`} />
                          </div>
                          <div className="flex-1 space-y-1">
                             <h3 className="font-black text-xl uppercase tracking-tight text-white">{action.title}</h3>
                             <p className="text-[11px] font-bold text-white/40 italic">{action.desc}</p>
                          </div>
                          <div className="h-12 w-12 rounded-full border border-white/5 flex items-center justify-center group-hover:bg-primary group-hover:border-primary transition-all">
                             <ArrowRight className="h-5 w-5 text-white/20 group-hover:text-white" />
                          </div>
                       </div>
                    </Link>
                  ))}
               </div>
            </section>

            {/* Glowing Wave Graph Section */}
            <section className="relative p-12 rounded-[4rem] bg-[#0A0A0A] border border-white/5 overflow-hidden shadow-2xl">
               <div className="absolute top-0 right-0 p-12 opacity-5">
                  <BarChart3 className="h-64 w-64 text-white" />
               </div>
               
               <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-12">
                  <div className="space-y-6">
                     <div className="space-y-2">
                        <h2 className="text-3xl font-black uppercase tracking-tighter italic text-white">Performans Matrisi</h2>
                        <p className="text-xs font-bold text-white/30 italic uppercase tracking-[0.2em]">Haftalık Gelir Dalgalanması</p>
                     </div>
                     <div className="flex items-center gap-8">
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase">En Yüksek</p>
                           <p className="text-2xl font-black text-emerald-400">₺{stats.sales * 150 || 1200}</p>
                        </div>
                        <div className="h-10 w-[1px] bg-white/10" />
                        <div>
                           <p className="text-[10px] font-black text-white/40 uppercase">Dönüşüm</p>
                           <p className="text-2xl font-black text-primary">%8.4</p>
                        </div>
                     </div>
                  </div>

                  {/* The Wave Chart (Simulated with beautiful SVG) */}
                  <div className="flex-1 h-32 flex items-end gap-4 px-4">
                     {[30, 45, 60, 40, 80, 65, 95].map((val, i) => (
                       <div key={i} className="group relative flex-1">
                          <div 
                           className="w-full bg-gradient-to-t from-primary/10 via-primary/40 to-primary rounded-full transition-all duration-1000 group-hover:via-white group-hover:shadow-[0_0_20px_rgba(var(--primary),0.5)]" 
                           style={{ height: `${val}%`, transitionDelay: `${i * 100}ms` }} 
                          />
                          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 text-[9px] font-black text-white/20 uppercase">
                             {['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'][i]}
                          </div>
                       </div>
                     ))}
                  </div>
               </div>
            </section>
         </div>

         {/* ── RIGHT: INTELLIGENCE & ACTIVITY ── */}
         <div className="space-y-12">
            <ProfitCalculator />

            {/* AI Mastermind Card */}
            <Card className="relative border-none bg-gradient-to-br from-primary via-[#1A1A1A] to-black shadow-2xl rounded-[3.5rem] overflow-hidden group">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10" />
               <CardContent className="p-10 space-y-8 relative z-10">
                  <div className="flex items-center gap-4">
                     <div className="h-14 w-14 bg-white/10 backdrop-blur-2xl rounded-[1.5rem] flex items-center justify-center border border-white/20">
                        <Zap className="h-8 w-8 text-primary animate-bounce" />
                     </div>
                     <div>
                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-primary italic">Intelligence Alert</span>
                        <h3 className="text-2xl font-black italic tracking-tighter text-white uppercase">Mastermind</h3>
                     </div>
                  </div>
                  
                  <p className="text-sm font-bold text-white/70 leading-relaxed italic border-l-4 border-primary pl-6">
                     "Kupa kategorisindeki **Cyberpunk Aesthetic** aramaları son 12 saatte küresel çapta %80 patlama yaptı. Bu akıma ilk katılanlardan olun!"
                  </p>

                  <Button variant="secondary" className="w-full h-16 font-black uppercase tracking-widest shadow-2xl rounded-2xl bg-white text-black hover:bg-primary hover:text-white border-none transition-all">
                     <Link to="/generate" className="flex items-center gap-3">
                        <Target className="h-5 w-5" /> ŞİMDİ DOMİNE ET
                     </Link>
                  </Button>
               </CardContent>
            </Card>

            {/* Live Activity Feed */}
            <section className="space-y-8 px-4">
               <div className="flex items-center justify-between">
                  <h2 className="text-sm font-black uppercase tracking-[0.4em] italic text-white/30 flex items-center gap-3">
                     <Activity className="h-4 w-4 text-primary" /> Canlı Sistem Akışı
                  </h2>
               </div>
               <div className="space-y-4">
                  {[
                    { text: 'Yurt dışı siparişi alındı: #US-882', time: '1m', icon: Globe, color: 'text-cyan-400' },
                    { text: 'HD upscale işlemi başarıyla bitti', time: '12m', icon: Sparkles, color: 'text-purple-400' },
                    { text: 'Pinterest API senkronize edildi', time: '1h', icon: MousePointer2, color: 'text-pink-400' },
                    { text: 'Haftalık kâr raporu hazır', time: '3h', icon: PieChart, color: 'text-emerald-400' },
                  ].map((act, i) => (
                    <div key={i} className="flex items-center gap-5 p-5 rounded-[1.5rem] bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all cursor-pointer group">
                       <div className={`h-12 w-12 rounded-xl bg-white/5 flex items-center justify-center transition-transform group-hover:scale-110 group-hover:rotate-6`}>
                          <act.icon className={`h-5 w-5 ${act.color}`} />
                       </div>
                       <div className="flex-1">
                          <p className="text-xs font-bold italic text-white/80">{act.text}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/20 mt-1">{act.time} Önce</p>
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
  
  const listingFee = 0.20 * 33; 
  const transactionFee = price * 0.065;
  const processingFee = (price * 0.04) + (0.30 * 33);
  const totalFees = listingFee + transactionFee + processingFee;
  const netProfit = price - cost - totalFees;
  const margin = (netProfit / price) * 100;

  return (
    <Card className="border-none bg-[#0D0D0D] shadow-2xl rounded-[3rem] overflow-hidden group border border-white/5">
       <CardHeader className="bg-white/5 pb-6 pt-10 px-10 border-b border-white/5">
          <CardTitle className="text-xs font-black uppercase tracking-[0.3em] flex items-center gap-3 italic text-primary">
             <DollarSign className="h-5 w-5 animate-pulse" /> Kâr Analizörü
          </CardTitle>
       </CardHeader>
       <CardContent className="p-10 space-y-8">
          <div className="grid grid-cols-2 gap-6">
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-2">Etiket Fiyatı</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">₺</span>
                   <input 
                     type="number" 
                     value={price} 
                     onChange={(e) => setPrice(Number(e.target.value))}
                     className="w-full h-14 bg-white/5 rounded-2xl pl-10 pr-4 font-black text-lg text-white border border-white/5 focus:ring-2 ring-primary/20 transition-all outline-none"
                   />
                </div>
             </div>
             <div className="space-y-2">
                <label className="text-[9px] font-black uppercase text-white/40 tracking-widest ml-2">Net Maliyet</label>
                <div className="relative">
                   <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/20 font-black">₺</span>
                   <input 
                     type="number" 
                     value={cost} 
                     onChange={(e) => setCost(Number(e.target.value))}
                     className="w-full h-14 bg-white/5 rounded-2xl pl-10 pr-4 font-black text-lg text-white border border-white/5 focus:ring-2 ring-primary/20 transition-all outline-none"
                   />
                </div>
             </div>
          </div>

          <div className="p-8 rounded-[2rem] bg-white text-black space-y-6 shadow-[0_20px_50px_rgba(255,255,255,0.1)]">
             <div className="flex justify-between items-center text-[10px] font-black uppercase opacity-40">
                <span>Tahmini Kesinti Paketi</span>
                <span>₺{totalFees.toFixed(2)}</span>
             </div>
             <div className="h-[1px] bg-black/10" />
             <div className="flex justify-between items-end">
                <div>
                   <p className="text-[10px] font-black uppercase opacity-40 mb-1">PROJEKSİYON</p>
                   <p className="text-4xl font-black tracking-tighter text-black">₺{netProfit.toFixed(2)}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                   <Badge className="bg-black text-white border-none font-black text-[10px] px-3 py-1">
                      %{isNaN(margin) ? 0 : margin.toFixed(0)} MARJ
                   </Badge>
                </div>
             </div>
          </div>
          <p className="text-[9px] text-white/20 italic text-center font-bold tracking-tight">
             Etsy Türkiye %6.5 İşlem + %4 Ödeme komisyonu standartlarına göredir.
          </p>
       </CardContent>
    </Card>
  );
}

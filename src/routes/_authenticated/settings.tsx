import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Shop, CreditCard, User, LogOut, Check, ExternalLink, Loader2, RefreshCw, Megaphone, Crown, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEtsyAuthUrl } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [loading, setLoading] = useState(false);
  const getAuthUrl = useServerFn(getEtsyAuthUrl);

  const { data: shop } = useQuery({
    queryKey: ["etsy_shop", user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await supabase.from("etsy_shops").select("*").eq("user_id", user.id).single();
      return data;
    },
    enabled: !!user,
  });

  const connectEtsy = async () => {
    try {
      const { url, verifier, state } = await getAuthUrl();
      localStorage.setItem("etsy_verifier", verifier);
      localStorage.setItem("etsy_state", state);
      window.location.href = url;
    } catch (e) {
      toast.error("Bağlantı başlatılamadı.");
    }
  };

  const updateProfile = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({ display_name: displayName })
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
      toast.success("Profil güncellendi");
    } catch (e: any) {
      toast.error(e.message || "Hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex h-60 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter uppercase">Ayarlar & Entegrasyonlar</h1>
        <p className="text-muted-foreground font-medium">Hesap profilinizi ve mağaza entegrasyonlarınızı buradan yönetin.</p>
      </div>

      <div className="grid gap-8 md:grid-cols-[280px_1fr]">
        <aside className="space-y-2">
          {[
            { label: "Profil Bilgileri", icon: User, active: true },
            { label: "Mağaza Bağlantısı", icon: SettingsIcon, active: false },
            { label: "Abonelik & Planlar", icon: CreditCard, active: false },
          ].map((item, i) => (
            <button
              key={i}
              className={`flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold transition-all ${
                item.active ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20" : "hover:bg-muted"
              }`}
            >
              <item.icon className="h-4 w-4" />
              {item.label}
            </button>
          ))}
          <div className="pt-4 mt-4 border-t border-border/50">
            <button 
              onClick={() => signOut()}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Oturumu Kapat
            </button>
          </div>
        </aside>

        <div className="space-y-12">
          {/* Section: Profile */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Kişisel Profil
             </div>
             <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden border-l-4 border-l-primary">
                <CardContent className="p-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">E-Posta Adresi</Label>
                      <Input value={user?.email || ""} disabled className="bg-muted font-bold cursor-not-allowed opacity-70" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Görünen Ad Soyad</Label>
                      <Input 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        className="font-bold border-border/50 focus:ring-primary/20 h-11"
                        placeholder="Adınızı girin"
                      />
                    </div>
                  </div>
                  <Button onClick={updateProfile} disabled={loading} className="w-full sm:w-auto px-10 font-bold shadow-lg shadow-primary/20 h-11">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Güncelle
                  </Button>
                </CardContent>
             </Card>
          </section>

          {/* Section: Social Media */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                <div className="h-1.5 w-1.5 rounded-full bg-pink-500 animate-pulse" /> Sosyal Medya Entegrasyonu
             </div>
             <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm">
                <CardContent className="p-8 grid gap-4 sm:grid-cols-2">
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-pink-500/10 to-orange-500/10 border border-pink-500/20">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-pink-500 to-orange-500 flex items-center justify-center text-white">
                            <Megaphone className="h-5 w-5" />
                         </div>
                         <div>
                            <div className="font-bold text-sm">Instagram</div>
                            <div className="text-[10px] text-muted-foreground">Bağlı Değil</div>
                         </div>
                      </div>
                      <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase h-8" onClick={() => toast.info("Instagram API Bağlantısı Çok Yakında!")}>
                         Bağla
                      </Button>
                   </div>
                   <div className="flex items-center justify-between p-5 rounded-2xl bg-gradient-to-br from-red-500/10 to-red-700/10 border border-red-500/20">
                      <div className="flex items-center gap-3">
                         <div className="h-10 w-10 rounded-xl bg-red-600 flex items-center justify-center text-white">
                            <ImageIcon className="h-5 w-5" />
                         </div>
                         <div>
                            <div className="font-bold text-sm">Pinterest</div>
                            <div className="text-[10px] text-muted-foreground">Bağlı Değil</div>
                         </div>
                      </div>
                      <Button variant="outline" size="sm" className="font-bold text-[10px] uppercase h-8" onClick={() => toast.info("Pinterest API Bağlantısı Çok Yakında!")}>
                         Bağla
                      </Button>
                   </div>
                </CardContent>
             </Card>
          </section>

          {/* Section: Etsy */}
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                <div className="h-1.5 w-1.5 rounded-full bg-orange-500 animate-pulse" /> Etsy Mağaza Bağlantısı
             </div>
             <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardContent className="p-8">
                  {shop ? (
                    <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-6 rounded-2xl bg-primary/5 border border-primary/20">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center text-primary">
                           <Check className="h-6 w-6" />
                        </div>
                        <div>
                           <h4 className="font-bold text-base">Etsy Mağazanız Hazır</h4>
                           <p className="text-xs text-muted-foreground font-medium italic">Verileriniz anlık olarak senkronize ediliyor.</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={connectEtsy} className="font-bold gap-2 h-11 px-6">
                         <RefreshCw className="h-4 w-4" /> Bağlantıyı Yenile
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-6">
                      <div className="mx-auto h-20 w-20 rounded-3xl bg-muted flex items-center justify-center rotate-3">
                         <SettingsIcon className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-black uppercase">Mağazanı Bağla</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                           Siparişlerini yönetmek ve SEO optimizasyonu yapmak için Etsy dükkanını Lumina'ya bağlamalısın.
                        </p>
                      </div>
                      <Button onClick={connectEtsy} className="font-bold px-12 h-12 shadow-xl shadow-primary/20 uppercase tracking-wider">
                         Etsy Dükkanını Bağla
                      </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
          </section>

          {/* Section: Subscription */}
          <section className="space-y-4 pb-10">
             <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary bg-primary/5 w-fit px-3 py-1 rounded-full border border-primary/10">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Üyelik & Plan Durumu
             </div>
             <Card className="border-none bg-gradient-to-br from-primary via-primary/90 to-accent text-primary-foreground shadow-2xl relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-125 transition-transform duration-700">
                   <Crown className="h-32 w-32" />
                </div>
                <CardContent className="p-10 flex flex-col sm:flex-row items-center justify-between gap-8">
                  <div className="space-y-2 text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mevcut Üyelik Planınız</p>
                    <h3 className="text-5xl font-black tracking-tighter">{profile?.plan || "FREE"}</h3>
                    <div className="flex items-center gap-2 mt-2">
                       <Badge variant="secondary" className="bg-white/20 text-white border-none font-bold">
                          {profile?.credits || 0} AI Kredisi Kalan
                       </Badge>
                    </div>
                  </div>
                  <Button variant="secondary" size="lg" className="font-black px-12 h-14 shadow-2xl uppercase tracking-tighter text-lg" asChild>
                     <Link to="/pricing">Sınırsıza Geç</Link>
                  </Button>
                </CardContent>
             </Card>
          </section>
        </div>
      </div>
    </div>
  );
}

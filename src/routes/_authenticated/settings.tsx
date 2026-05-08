import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, Shop, CreditCard, User, LogOut, Check, ExternalLink, Loader2, RefreshCw } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEtsyAuthUrl } from "@/lib/etsy.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [loading, setLoading] = useState(false);
  const getAuthUrl = useServerFn(getEtsyAuthUrl);

  const { data: shop } = useQuery({
    queryKey: ["etsy_shop", user?.id],
    queryFn: async () => {
      const { data } = await supabase.from("etsy_shops").select("*").eq("user_id", user?.id).single();
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

  return (
    <div className="mx-auto max-w-5xl space-y-10 pb-10 animate-in fade-in duration-500">
      <div className="flex flex-col gap-2">
        <h1 className="text-4xl font-black tracking-tighter">AYARLAR</h1>
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
              onClick={signOut}
              className="flex w-full items-center gap-3 rounded-xl px-4 py-3 text-sm font-bold text-destructive hover:bg-destructive/10 transition-all"
            >
              <LogOut className="h-4 w-4" />
              Oturumu Kapat
            </button>
          </div>
        </aside>

        <div className="space-y-8">
          <section className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Kişisel Profil
             </div>
             <Card className="border-border/50 bg-card/50 backdrop-blur-sm shadow-sm overflow-hidden">
                <CardContent className="p-8 space-y-6">
                  <div className="grid gap-6 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">E-Posta Adresi</Label>
                      <Input value={user?.email || ""} disabled className="bg-muted font-bold" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Görünen Ad Soyad</Label>
                      <Input 
                        value={displayName} 
                        onChange={(e) => setDisplayName(e.target.value)} 
                        className="font-bold border-border/50 focus:ring-primary/20"
                        placeholder="Adınızı girin"
                      />
                    </div>
                  </div>
                  <Button onClick={updateProfile} disabled={loading} className="w-full sm:w-auto px-10 font-bold shadow-lg shadow-primary/20">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                    Güncelle
                  </Button>
                </CardContent>
             </Card>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Etsy Entegrasyonu
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
                           <p className="text-xs text-muted-foreground font-medium">Verileriniz anlık olarak senkronize ediliyor.</p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={connectEtsy} className="font-bold gap-2">
                         <RefreshCw className="h-4 w-4" /> Bağlantıyı Yenile
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-10 space-y-6">
                      <div className="mx-auto h-20 w-20 rounded-full bg-muted flex items-center justify-center">
                         <SettingsIcon className="h-10 w-10 text-muted-foreground/30" />
                      </div>
                      <div className="space-y-2">
                        <h3 className="text-xl font-bold">Mağazanı Bağla</h3>
                        <p className="text-sm text-muted-foreground max-w-sm mx-auto font-medium">
                           Siparişlerini yönetmek ve SEO optimizasyonu yapmak için Etsy dükkanını Lumina'ya bağlamalısın.
                        </p>
                      </div>
                      <Button onClick={connectEtsy} className="font-bold px-10 h-12 shadow-xl shadow-primary/20">
                         Etsy Dükkanını Bağla
                      </Button>
                    </div>
                  )}
                </CardContent>
             </Card>
          </section>

          <section className="space-y-4">
             <div className="flex items-center gap-2 text-xs font-black uppercase tracking-widest text-primary">
                <div className="h-1.5 w-1.5 rounded-full bg-primary" /> Üyelik & Plan
             </div>
             <Card className="border-none bg-gradient-to-br from-primary to-primary/80 text-primary-foreground shadow-2xl">
                <CardContent className="p-8 flex flex-col sm:flex-row items-center justify-between gap-6">
                  <div className="space-y-1 text-center sm:text-left">
                    <p className="text-[10px] font-black uppercase tracking-widest opacity-80">Mevcut Üyelik Planınız</p>
                    <h3 className="text-4xl font-black">{profile?.plan || "FREE"}</h3>
                    <p className="text-sm font-bold opacity-90">{profile?.credits || 0} AI Kredisi Kullanılabilir</p>
                  </div>
                  <Button variant="secondary" size="lg" className="font-bold px-10 shadow-xl" asChild>
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

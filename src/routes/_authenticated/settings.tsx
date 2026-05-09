import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings as SettingsIcon, CreditCard, User, LogOut, Check, Loader2, RefreshCw, Megaphone, Crown, Image as ImageIcon, ExternalLink } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getEtsyAuthUrl } from "@/lib/etsy.functions";

import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/settings")({
  component: SettingsPage,
});

function SettingsPage() {
  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const [displayName, setDisplayName] = useState(profile?.display_name || "");
  const [loading, setLoading] = useState(false);


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
      const { url, verifier, state } = await getEtsyAuthUrl();
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
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl space-y-8 pb-16 animate-in fade-in duration-500">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Ayarlar</h1>
        <p className="text-sm text-muted-foreground mt-1">Hesap, entegrasyon ve abonelik ayarlarınızı yönetin.</p>
      </div>

      {/* Profile */}
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <User className="h-3.5 w-3.5" /> Profil Bilgileri
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 pb-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1.5 block">E-posta</Label>
              <Input value={user?.email || ""} disabled className="bg-muted/50 text-muted-foreground cursor-not-allowed" />
            </div>
            <div>
              <Label className="text-[11px] text-muted-foreground mb-1.5 block">Görünen Ad</Label>
              <Input
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Adınız"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={updateProfile} disabled={loading} size="sm" className="gap-2">
              {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
              Kaydet
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Etsy Connection */}
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <SettingsIcon className="h-3.5 w-3.5" /> Etsy Mağaza Bağlantısı
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          {shop ? (
            <div className="flex items-center justify-between p-4 bg-green-500/5 border border-green-500/20 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="h-8 w-8 rounded-lg bg-green-500/10 flex items-center justify-center">
                  <Check className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium">Mağaza Bağlı</p>
                  <p className="text-[11px] text-muted-foreground">Veriler otomatik senkronize ediliyor</p>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={connectEtsy} className="gap-2">
                <RefreshCw className="h-3.5 w-3.5" /> Yenile
              </Button>
            </div>
          ) : (
            <div className="text-center py-8 space-y-4">
              <div className="mx-auto h-12 w-12 rounded-xl bg-muted flex items-center justify-center">
                <SettingsIcon className="h-5 w-5 text-muted-foreground/40" />
              </div>
              <div>
                <p className="text-sm font-medium">Etsy mağazanız bağlı değil</p>
                <p className="text-[11px] text-muted-foreground mt-1">Siparişleri yönetmek için mağazanızı bağlayın.</p>
              </div>
              <Button onClick={connectEtsy} size="sm" className="gap-2">
                <ExternalLink className="h-3.5 w-3.5" /> Etsy'yi Bağla
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Social Integrations */}
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <Megaphone className="h-3.5 w-3.5" /> Sosyal Medya
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6 space-y-3">
          {[
            { name: "Instagram", color: "bg-gradient-to-tr from-pink-500 to-orange-400", icon: Megaphone },
            { name: "Pinterest", color: "bg-red-500", icon: ImageIcon },
          ].map((platform) => (
            <div key={platform.name} className="flex items-center justify-between p-3 rounded-lg border border-border/50 hover:bg-muted/30 transition-colors">
              <div className="flex items-center gap-3">
                <div className={`h-8 w-8 rounded-lg ${platform.color} flex items-center justify-center text-white`}>
                  <platform.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-medium">{platform.name}</p>
                  <p className="text-[10px] text-muted-foreground">Bağlı değil</p>
                </div>
              </div>
              <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => toast.info(`${platform.name} entegrasyonu yakında!`)}>
                Bağla
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Plan */}
      <Card className="rounded-xl border-border/60 shadow-sm">
        <CardHeader className="pb-4">
          <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
            <CreditCard className="h-3.5 w-3.5" /> Abonelik
          </CardTitle>
        </CardHeader>
        <CardContent className="pb-6">
          <div className="flex items-center justify-between p-4 bg-muted/30 rounded-lg">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Crown className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">{profile?.plan || "FREE"} Plan</p>
                <p className="text-[11px] text-muted-foreground">{profile?.credits || 0} AI kredisi kalan</p>
              </div>
            </div>
            <Button asChild size="sm" variant="outline" className="gap-2">
              <Link to="/pricing">Yükselt</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Logout */}
      <div className="pt-4 border-t border-border/50">
        <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive hover:bg-destructive/10 gap-2" onClick={() => signOut()}>
          <LogOut className="h-3.5 w-3.5" /> Oturumu Kapat
        </Button>
      </div>
    </div>
  );
}

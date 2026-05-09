import { createFileRoute, Link } from "@tanstack/react-router";
import { Check, Sparkles, Zap, Crown, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/pricing")({
  component: PricingPage,
});

function PricingPage() {
  const { profile } = useAuth();
  const currentPlan = profile?.plan?.toLowerCase() || "free";

  const plans = [
    {
      name: "Starter",
      id: "free",
      price: "₺0",
      description: "Yeni başlayanlar için temel araçlar.",
      features: [
        "10 AI Kredi / Ay",
        "Etsy Trend Analizi",
        "AI Tasarım Üretimi",
        "Standart Kalite",
      ],
      buttonText: currentPlan === "free" ? "Mevcut Planınız" : "Starter'a Dön",
      active: currentPlan === "free",
      highlight: false,
    },
    {
      name: "Pro",
      id: "pro",
      price: "₺599",
      description: "Ciddi satıcılar için profesyonel özellikler.",
      features: [
        "100 AI Kredi / Ay",
        "HD Upscale (Netleştirme)",
        "Toplu Üretim Modu",
        "Pazarlama Laboratuvarı",
        "Öncelikli Destek",
      ],
      buttonText: currentPlan === "pro" ? "Mevcut Planınız" : "Pro'ya Yükselt",
      active: currentPlan === "pro",
      highlight: true,
      checkoutUrl: "https://luminaseller.lemonsqueezy.com/checkout/buy/pro_plan",
    },
    {
      name: "Business",
      id: "business",
      price: "₺1,499",
      description: "Büyük ölçekli POD operasyonları için.",
      features: [
        "500 AI Kredi / Ay",
        "Sınırsız Envanter Yönetimi",
        "Gelişmiş Sipariş Analitiği",
        "Özel SEO Danışmanlığı",
        "API Erişimi",
      ],
      buttonText: currentPlan === "business" ? "Mevcut Planınız" : "Business'a Geç",
      active: currentPlan === "business",
      highlight: false,
      checkoutUrl: "https://luminaseller.lemonsqueezy.com/checkout/buy/business_plan",
    },
  ];

  return (
    <div className="space-y-12 pb-20 animate-in fade-in duration-500">
      <div className="text-center space-y-3">
        <h1 className="text-4xl font-semibold tracking-tight">Planlar & Fiyatlandırma</h1>
        <p className="mx-auto max-w-2xl text-muted-foreground text-sm">
          Mağazanızın ölçeğine uygun planı seçin, tasarımı otomatiğe bağlayın ve satışlarınızı katlayın.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-3 max-w-6xl mx-auto px-4">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative flex flex-col border-border/60 shadow-sm transition-all duration-300 ${
              plan.highlight ? "ring-2 ring-primary border-transparent" : "hover:border-border"
            }`}
          >
            {plan.highlight && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-primary text-white border-none text-[10px] font-bold">
                EN POPÜLER
              </Badge>
            )}
            <CardHeader className="pt-8 pb-4">
              <div className="flex items-center justify-between mb-2">
                <CardTitle className="text-lg font-semibold">{plan.name}</CardTitle>
                <div className={`p-1.5 rounded-md ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {plan.id === "free" && <Zap className="h-4 w-4" />}
                  {plan.id === "pro" && <Sparkles className="h-4 w-4" />}
                  {plan.id === "business" && <Crown className="h-4 w-4" />}
                </div>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-3xl font-bold tracking-tight">{plan.price}</span>
                <span className="text-muted-foreground text-xs font-medium">/ay</span>
              </div>
              <CardDescription className="pt-4 text-xs font-medium leading-relaxed">
                {plan.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-8 pt-4">
              <ul className="space-y-3">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-2.5 text-[13px] font-medium text-foreground/80">
                    <Check className="h-3.5 w-3.5 text-green-500 shrink-0" />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/30">
              <Button 
                className={`w-full font-semibold ${plan.active ? 'bg-muted text-muted-foreground cursor-default' : ''}`} 
                variant={plan.highlight ? "default" : "outline"}
                disabled={plan.active}
                asChild={!plan.active && !!plan.checkoutUrl}
              >
                {!plan.active && plan.checkoutUrl ? (
                  <a href={plan.checkoutUrl} target="_blank" rel="noopener noreferrer">{plan.buttonText}</a>
                ) : (
                  <span>{plan.buttonText}</span>
                )}
              </Button>
            </CardFooter>
          </Card>
        ))}
      </div>

      <section className="rounded-2xl border border-border/60 bg-muted/20 p-8 text-center max-w-4xl mx-auto space-y-6">
        <div className="flex items-center justify-center gap-2 text-sm font-semibold">
           <ShieldCheck className="h-4 w-4 text-primary" />
           Güvenli Ödeme & Global Standartlar
        </div>
        <p className="text-muted-foreground text-[13px] leading-relaxed max-w-2xl mx-auto font-medium">
          Ödemeleriniz <strong className="text-foreground">LemonSqueezy</strong> güvencesiyle korunur. 
          İstediğiniz zaman iptal edebilirsiniz. Kredi kartı bilgileriniz Lumina sunucularında asla saklanmaz.
        </p>
        <div className="flex flex-wrap justify-center items-center gap-6 opacity-40 grayscale hover:grayscale-0 transition-all text-[10px] font-bold tracking-widest uppercase">
          <span>Visa</span>
          <span>Mastercard</span>
          <span>Amex</span>
          <span>PayPal</span>
        </div>
      </section>
    </div>
  );
}

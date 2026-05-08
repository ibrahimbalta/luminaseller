import { createFileRoute } from "@tanstack/react-router";
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
      description: "Yeni başlayanlar için temel özellikler.",
      features: [
        "10 AI Kredi / Ay",
        "Etsy Trend Analizi",
        "AI Tasarım Üretimi (FLUX)",
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
      description: "Satışlarını artırmak isteyen ciddi satıcılar.",
      features: [
        "100 AI Kredi / Ay",
        "HD Upscale (Netleştirme)",
        "Toplu Üretim (Bulk Mode)",
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
      <div className="text-center space-y-4">
        <Badge variant="outline" className="px-5 py-1.5 text-primary border-primary/20 bg-primary/5 font-black tracking-widest uppercase text-[10px]">
          Fiyatlandırma
        </Badge>
        <h1 className="text-4xl font-black tracking-tighter sm:text-6xl text-foreground">
          Geleceğin Mağazasını <span className="text-primary italic">Bugün</span> Kurun
        </h1>
        <p className="mx-auto max-w-2xl text-muted-foreground font-medium">
          Lumina Seller ile zaman kazanın, tasarımlarınızı otomatiğe bağlayın ve Etsy satışlarınızı katlayın.
        </p>
      </div>

      <div className="grid gap-8 lg:grid-cols-3 max-w-6xl mx-auto">
        {plans.map((plan) => (
          <Card 
            key={plan.name} 
            className={`relative flex flex-col border-2 transition-all duration-500 hover:shadow-2xl overflow-hidden ${
              plan.highlight ? "border-primary shadow-xl scale-105 z-10" : "border-border hover:border-primary/20"
            }`}
          >
            {plan.highlight && (
              <div className="absolute -top-0 right-0 rounded-bl-xl bg-primary px-4 py-1.5 text-[10px] font-black text-primary-foreground uppercase tracking-widest shadow-lg">
                EN POPÜLER
              </div>
            )}
            <CardHeader className="pt-8">
              <div className="flex items-center gap-3 mb-4">
                <div className={`p-2.5 rounded-xl ${plan.highlight ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {plan.id === "free" && <Zap className="h-6 w-6" />}
                  {plan.id === "pro" && <Sparkles className="h-6 w-6" />}
                  {plan.id === "business" && <Crown className="h-6 w-6" />}
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">{plan.name}</CardTitle>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                <span className="text-muted-foreground text-sm font-bold">/ay</span>
              </div>
              <CardDescription className="pt-6 font-medium leading-relaxed">{plan.description}</CardDescription>
            </CardHeader>
            <CardContent className="flex-1 pb-8">
              <ul className="space-y-4">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-center gap-3 text-sm font-bold text-foreground/80">
                    <div className="h-5 w-5 rounded-full bg-green-500/10 flex items-center justify-center shrink-0">
                       <Check className="h-3 w-3 text-green-500" />
                    </div>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
            <CardFooter className="pt-4 border-t border-border/50 bg-muted/20">
              <Button 
                className={`w-full font-black py-7 text-lg shadow-lg shadow-primary/10 ${plan.active ? 'bg-muted text-muted-foreground cursor-default' : ''}`} 
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

      <section className="rounded-[2.5rem] bg-card/50 backdrop-blur-sm border border-border/50 p-10 md:p-16 text-center max-w-4xl mx-auto space-y-8 shadow-sm">
        <div className="h-20 w-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto">
           <ShieldCheck className="h-10 w-10 text-primary" />
        </div>
        <div className="space-y-4">
          <h2 className="text-3xl font-black tracking-tight">Güvenli Ödeme & Global Standartlar</h2>
          <p className="text-muted-foreground text-sm font-medium leading-relaxed max-w-2xl mx-auto">
            Ödemeleriniz <strong className="text-foreground">LemonSqueezy</strong> güvencesiyle 256-bit SSL ile korunur. 
            İstediğiniz zaman iptal edebilirsiniz. Kredi kartı bilgileriniz asla sunucularımızda saklanmaz.
          </p>
        </div>
        <div className="flex flex-wrap justify-center items-center gap-8 opacity-40 grayscale hover:grayscale-0 transition-all text-foreground font-black tracking-widest text-[10px]">
          <span>VISA</span>
          <span>MASTERCARD</span>
          <span>AMERICAN EXPRESS</span>
          <span>PAYPAL</span>
        </div>
      </section>
    </div>
  );
}

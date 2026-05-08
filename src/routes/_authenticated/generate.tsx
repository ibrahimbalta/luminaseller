import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { generateDesign, generateListing, upscaleImage } from "@/lib/ai.functions";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Wand2, Copy, Download, FileText, Sparkles, Image as ImageIcon, ArrowRight } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/_authenticated/generate")({
  component: GeneratePage,
  validateSearch: (s: Record<string, unknown>) => ({
    prompt: typeof s.prompt === "string" ? s.prompt : "",
    niche: typeof s.niche === "string" ? s.niche : "",
    referenceImageUrl: typeof s.referenceImageUrl === "string" ? s.referenceImageUrl : "",
  }),
});

const STYLES = [
  "minimal typography",
  "retro / vintage",
  "bold quote",
  "hand-drawn illustration",
  "kawaii cute",
  "y2k aesthetic",
  "line art",
  "watercolor",
];

function GeneratePage() {
  const search = Route.useSearch();
  const { user, profile, refreshProfile } = useAuth();
  const [niche, setNiche] = useState(search.niche || "");
  const [prompt, setPrompt] = useState(search.prompt || "");
  const [style, setStyle] = useState(STYLES[0]);
  const [language, setLanguage] = useState<"tr" | "en">("en");
  const [referenceImageUrl, setReferenceImageUrl] = useState(search.referenceImageUrl || "");
  const [variations, setVariations] = useState<{ label: string; url: string }[]>([]);
  const [varLoading, setVarLoading] = useState(false);

  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [designId, setDesignId] = useState<string | null>(null);
  const [listing, setListing] = useState<any | null>(null);
  const [genLoading, setGenLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [mockupMode, setMockupMode] = useState<"none" | "tshirt" | "mug">("none");
  const [bulkCount, setBulkCount] = useState<number>(1);
  const [bulkResults, setBulkResults] = useState<string[]>([]);

  const genFn = useServerFn(generateDesign);
  const listFn = useServerFn(generateListing);
  const upscaleFn = useServerFn(upscaleImage);
  const [upscaleLoading, setUpscaleLoading] = useState(false);



  const generate = async () => {
    if (!prompt.trim() || !user) return;
    const count = bulkCount || 1;

    setGenLoading(true);
    setImageUrl(null);
    setListing(null);
    setDesignId(null);
    setVariations([]);
    setBulkResults([]);
    setMockupMode("none");

    try {
      const results: string[] = [];
      for (let i = 0; i < count; i++) {
        const res = await genFn({
          data: {
            prompt: prompt.trim(),
            style,
            ...(referenceImageUrl ? { referenceImageUrl } : {}),
          },
        });
        results.push(res.imageUrl);
        
        // Save each to Supabase
        const { data: savedDesign } = await supabase
          .from("designs")
          .insert({ user_id: user.id, niche, style, prompt, image_url: res.imageUrl })
          .select()
          .single();
          
        if (i === 0 && savedDesign) setDesignId(savedDesign.id);
      }
      
      setBulkResults(results);
      setImageUrl(results[0]); // Set first one as main preview
      toast.success(`${count} tasarım üretildi`);
    } catch (e: any) {
      toast.error(e.message ?? "Üretim hatası");
    } finally {
      setGenLoading(false);
    }
  };

  const VARIATIONS = [
    { label: "Farklı renk", extra: "use a completely different bold color palette" },
    { label: "Minimal", extra: "minimalist line art version, fewer details" },
    { label: "Vintage", extra: "vintage retro 70s aesthetic, distressed texture" },
    { label: "Boho", extra: "boho hand-drawn illustrative style" },
  ];

  const generateVariation = async (extra: string, label: string) => {
    if (!prompt.trim() || !user) return;

    setVarLoading(true);
    try {
      const res = await genFn({
        data: {
          prompt: `${prompt.trim()}. Variation: ${extra}`.slice(0, 500),
          style,
          ...(referenceImageUrl ? { referenceImageUrl } : {}),
        },
      });
      setVariations((v) => [...v, { label, url: res.imageUrl }]);
      await supabase
        .from("designs")
        .insert({ user_id: user.id, niche, style, prompt: `${prompt} (${label})`, image_url: res.imageUrl });
      toast.success(`Varyasyon üretildi`);
    } catch (e: any) {
      toast.error(e.message ?? "Varyasyon hatası");
    } finally {
      setVarLoading(false);
    }
  };

  const handleUpscale = async () => {
    if (!imageUrl || !prompt) return;
    setUpscaleLoading(true);
    try {
      const res = await upscaleFn({ data: { imageUrl, prompt } });
      setImageUrl(res.imageUrl);
      toast.success("Görsel HD olarak iyileştirildi!");
    } catch (e: any) {
      toast.error("İyileştirme hatası");
    } finally {
      setUpscaleLoading(false);
    }
  };

  const writeListing = async () => {
    if (!designId || !user) return;
    setListLoading(true);
    try {
      const res = await listFn({ data: { prompt, niche: niche || prompt, language } });
      setListing(res);
      await supabase.from("listings").insert({
        user_id: user.id,
        design_id: designId,
        title: res.title,
        description: res.description,
        tags: res.tags,
        pinterest_text: res.pinterest_text,
        tiktok_script: res.tiktok_script,
        language,
      });
      toast.success("Listing hazır");
    } catch (e: any) {
      toast.error(e.message ?? "Listing hatası");
    } finally {
      setListLoading(false);
    }
  };

  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success("Kopyalandı");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tasarım + Listing Üret</h1>
        <p className="text-sm text-muted-foreground">Niş ve prompt gir, AI tasarım + SEO listing oluştursun.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <div>
            <Label>Niş</Label>
            <Input placeholder="funny gym t-shirt" value={niche} onChange={(e) => setNiche(e.target.value)} />
          </div>
          <div>
            <Label>Tasarım promptu</Label>
            <Textarea
              rows={4}
              placeholder="minimal typography, funny quote about morning workouts"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
            />
          </div>
          <div className="rounded-md border border-border bg-background p-3 space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-xs">Referans görsel (opsiyonel)</Label>
              {referenceImageUrl && (
                <button type="button" onClick={() => setReferenceImageUrl("")} className="text-xs text-muted-foreground hover:text-foreground">Kaldır</button>
              )}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="https://... görsel linki yapıştır"
                value={referenceImageUrl.startsWith("data:") ? "" : referenceImageUrl}
                onChange={(e) => setReferenceImageUrl(e.target.value)}
                className="flex-1"
              />
              <label className="inline-flex h-9 cursor-pointer items-center justify-center rounded-md border border-input bg-background px-3 text-sm hover:bg-accent">
                Yükle
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    if (f.size > 5 * 1024 * 1024) {
                      toast.error("Görsel 5MB'dan küçük olmalı");
                      return;
                    }
                    const r = new FileReader();
                    r.onload = () => setReferenceImageUrl(String(r.result));
                    r.readAsDataURL(f);
                  }}
                />
              </label>
            </div>
            {referenceImageUrl && (
              <div>
                <img src={referenceImageUrl} alt="ref" className="h-24 w-24 rounded object-cover" />
                <p className="mt-1 text-xs text-muted-foreground">AI bu görselden ilham alarak farklı renk/format üretecek.</p>
              </div>
            )}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Stil</Label>
              <Select value={style} onValueChange={setStyle}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {STYLES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Adet (Bulk Mode)</Label>
              <Select value={bulkCount.toString()} onValueChange={(v) => setBulkCount(parseInt(v))}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 Tasarım</SelectItem>
                  <SelectItem value="3">3 Tasarım (Bulk)</SelectItem>
                  <SelectItem value="5">5 Tasarım (Bulk)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={generate} disabled={genLoading || !prompt.trim()} className="w-full" size="lg">
            {genLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Wand2 className="mr-2 h-4 w-4" /> {bulkCount > 1 ? `${bulkCount} Tasarım Üret` : "Tasarım üret"}</>}
          </Button>
        </div>

        <div className="space-y-4">
          <div className="relative aspect-square overflow-hidden rounded-xl border border-border bg-card group">
            {imageUrl ? (
              mockupMode === "none" ? (
                <img src={imageUrl} alt="design" className="h-full w-full object-contain" />
              ) : (
                <div className="relative h-full w-full">
                   {/* Mockup Base */}
                   <img 
                    src={mockupMode === "tshirt" 
                      ? "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&q=80&w=1000" 
                      : "https://images.unsplash.com/photo-1514228742587-6b1558fbed20?auto=format&fit=crop&q=80&w=1000"} 
                    className="h-full w-full object-cover"
                   />
                   {/* Design Overlay */}
                   <div className="absolute inset-0 flex items-center justify-center p-32">
                      <img 
                        src={imageUrl} 
                        className={`max-h-full max-w-full mix-blend-multiply opacity-90 ${mockupMode === "tshirt" ? "mt-4" : "mt-2 rotate-2 scale-75"}`} 
                      />
                   </div>
                </div>
              )
            ) : (
              <div className="grid h-full place-items-center text-sm text-muted-foreground">Tasarım burada görünecek</div>
            )}
            
            {imageUrl && (
              <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-2 p-3 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                <Button size="xs" variant="secondary" onClick={() => setMockupMode(mockupMode === "tshirt" ? "none" : "tshirt")} className="h-7 px-2 text-[10px]">
                  {mockupMode === "tshirt" ? "Tasarımı Gör" : "Tişört"}
                </Button>
                <Button size="xs" variant="secondary" onClick={() => setMockupMode(mockupMode === "mug" ? "none" : "mug")} className="h-7 px-2 text-[10px]">
                   {mockupMode === "mug" ? "Tasarımı Gör" : "Kupa"}
                </Button>
              </div>
            )}
          </div>

          {bulkResults.length > 1 && (
            <div className="grid grid-cols-5 gap-2">
              {bulkResults.map((url, i) => (
                <button
                  key={i}
                  onClick={() => setImageUrl(url)}
                  className={`aspect-square overflow-hidden rounded-md border-2 transition-all ${
                    imageUrl === url ? "border-primary" : "border-transparent opacity-60 hover:opacity-100"
                  }`}
                >
                  <img src={url} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}

          {imageUrl && (
            <div className="flex gap-2">
              <a
                href={imageUrl}
                download={`design-${Date.now()}.png`}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-md border border-input bg-background px-4 py-2 text-sm hover:bg-accent"
              >
                <Download className="h-4 w-4" /> İndir
                <Download className="h-4 w-4" /> İndir
              </a>
              <Button onClick={handleUpscale} disabled={upscaleLoading} variant="outline" className="flex-1">
                {upscaleLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Sparkles className="mr-2 h-4 w-4" /> Netleştir (HD)</>}
              </Button>
            </div>
          )}
          {imageUrl && (
            <div className="flex gap-2">
              <Button onClick={writeListing} disabled={listLoading} className="w-full">
                {listLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <><FileText className="mr-2 h-4 w-4" /> Listing yaz</>}
              </Button>
            </div>
          )}
          {imageUrl && (
            <div className="space-y-2">
              <Label className="text-xs">Varyasyonlar (farklı renk / format)</Label>
              <div className="flex flex-wrap gap-2">
                {VARIATIONS.map((v) => (
                  <Button
                    key={v.label}
                    size="sm"
                    variant="outline"
                    disabled={varLoading}
                    onClick={() => generateVariation(v.extra, v.label)}
                  >
                    {varLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : v.label}
                  </Button>
                ))}
              </div>
              {variations.length > 0 && (
                <div className="grid grid-cols-2 gap-2 pt-2">
                  {variations.map((v, i) => (
                    <a key={i} href={v.url} download={`design-${v.label}-${i}.png`} className="block overflow-hidden rounded-lg border border-border bg-card">
                      <img src={v.url} alt={v.label} className="aspect-square w-full object-contain" />
                      <div className="p-1.5 text-center text-xs">{v.label}</div>
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {listing && (
        <div className="space-y-4 rounded-xl border border-border bg-card p-5">
          <h2 className="text-lg font-semibold">Etsy Listing</h2>

          <Section label="Başlık" value={listing.title} onCopy={copy} />
          <Section label="Açıklama" value={listing.description} onCopy={copy} multiline />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <Label>13 Etiket</Label>
              <Button size="sm" variant="ghost" onClick={() => copy(listing.tags.join(", "))}>
                <Copy className="h-3 w-3" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {listing.tags.map((t: string, i: number) => (
                <span key={i} className="rounded-md bg-accent px-2 py-1 text-xs">{t}</span>
              ))}
            </div>
          </div>
          <Section label="Pinterest Pin" value={listing.pinterest_text} onCopy={copy} multiline />
          <Section label="TikTok Script" value={listing.tiktok_script} onCopy={copy} multiline />
        </div>
      )}
    </div>
  );
}

function Section({ label, value, onCopy, multiline }: { label: string; value: string; onCopy: (v: string) => void; multiline?: boolean }) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <Label>{label}</Label>
        <Button size="sm" variant="ghost" onClick={() => onCopy(value)}>
          <Copy className="h-3 w-3" />
        </Button>
      </div>
      {multiline ? (
        <div className="whitespace-pre-wrap rounded-md border border-border bg-background p-3 text-sm">{value}</div>
      ) : (
        <div className="rounded-md border border-border bg-background p-3 text-sm">{value}</div>
      )}
    </div>
  );
}

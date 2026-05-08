import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Heart, Trash2, Download, Search, Sparkles, Filter, Wand2, ArrowUpRight, Grid, List, CheckCircle2, Image as ImageIcon } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/_authenticated/gallery")({
  component: Gallery,
});

function Gallery() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "fav">("all");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);

  const load = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      let q = supabase.from("designs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
      if (filter === "fav") q = q.eq("is_favorite", true);
      
      const { data } = await q;
      let filtered = data ?? [];
      
      if (search) {
        filtered = filtered.filter(item => 
          item.prompt?.toLowerCase().includes(search.toLowerCase()) || 
          item.style?.toLowerCase().includes(search.toLowerCase())
        );
      }
      
      setItems(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, [filter, search]);

  const toggleFav = async (id: string, fav: boolean) => {
    const { error } = await supabase.from("designs").update({ is_favorite: !fav }).eq("id", id);
    if (error) toast.error("Hata oluştu");
    else {
      setItems(items.map(item => item.id === id ? { ...item, is_favorite: !fav } : item));
      toast.success(fav ? "Favorilerden çıkarıldı" : "Favorilere eklendi");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Tasarımı silmek istediğine emin misin?")) return;
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else {
      setItems(items.filter(i => i.id !== id));
      toast.success("Silindi");
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => 
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-10 pb-20 animate-in fade-in duration-700">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary">
             <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" /> Tasarım Arşivi
          </div>
          <h1 className="text-4xl font-black tracking-tighter uppercase italic">Galeri</h1>
          <p className="text-muted-foreground font-bold italic text-sm tracking-tight">Ürettiğiniz tüm sanat eserleri burada saklanır.</p>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Promptlarda ara..."
              className="pl-10 h-11 rounded-xl border-border/50 bg-card/50 font-bold italic"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex bg-muted/30 p-1 rounded-xl border border-border/50">
            <Button
              variant={filter === "all" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("all")}
              className={`h-9 px-4 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all ${filter === "all" ? "shadow-lg" : ""}`}
            >
              <Grid className="h-3 w-3 mr-2" /> Tümü
            </Button>
            <Button
              variant={filter === "fav" ? "default" : "ghost"}
              size="sm"
              onClick={() => setFilter("fav")}
              className={`h-9 px-4 font-black text-[10px] uppercase tracking-widest rounded-lg transition-all ${filter === "fav" ? "shadow-lg" : ""}`}
            >
              <Heart className={`h-3 w-3 mr-2 ${filter === "fav" ? "fill-current" : ""}`} /> Favoriler
            </Button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(i => (
            <div key={i} className="aspect-square animate-pulse rounded-[2.5rem] bg-card border border-border/50 shadow-inner" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 rounded-[3.5rem] border-4 border-dashed border-muted bg-muted/5 space-y-6">
          <div className="h-24 w-24 bg-muted rounded-[2.5rem] flex items-center justify-center rotate-6 shadow-inner">
             <ImageIcon className="h-12 w-12 text-muted-foreground/30" />
          </div>
          <div className="text-center space-y-2">
            <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Kütüphaneniz Boş</h3>
            <p className="text-sm text-muted-foreground font-bold italic">Henüz bir tasarım üretmediniz veya arama sonucu bulunamadı.</p>
          </div>
          <Button asChild className="font-black h-12 px-12 rounded-full shadow-2xl uppercase tracking-widest">
             <Link to="/generate">Hemen Tasarla <Wand2 className="ml-2 h-4 w-4" /></Link>
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {items.map((d) => (
            <div 
              key={d.id} 
              className={`group relative aspect-square overflow-hidden rounded-[2.5rem] border-4 transition-all duration-700 shadow-sm bg-card ${
                selectedItems.includes(d.id) ? "border-primary shadow-2xl scale-[1.02] z-10" : "border-transparent hover:border-primary/20"
              }`}
            >
              <img 
                src={d.image_url} 
                alt="Design" 
                className="h-full w-full object-cover transition-transform duration-1000 group-hover:scale-110"
              />
              
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col p-6">
                <div className="flex justify-between items-start">
                   <button 
                    onClick={() => toggleFav(d.id, d.is_favorite)}
                    className={`h-11 w-11 rounded-2xl flex items-center justify-center transition-all ${
                      d.is_favorite ? "bg-primary text-white shadow-lg" : "bg-white/10 text-white hover:bg-primary/50"
                    }`}
                   >
                     <Heart className={`h-5 w-5 ${d.is_favorite ? "fill-current" : ""}`} />
                   </button>
                   <div className="flex gap-2">
                      <a
                        href={d.image_url}
                        download={`lumina-${d.id}.png`}
                        className="h-11 w-11 rounded-2xl bg-white/10 text-white hover:bg-white/20 flex items-center justify-center transition-all"
                      >
                        <Download className="h-5 w-5" />
                      </a>
                      <button 
                        onClick={() => remove(d.id)}
                        className="h-11 w-11 rounded-2xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white flex items-center justify-center transition-all border border-red-500/20"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                   </div>
                </div>

                <div className="mt-auto space-y-4">
                   <p className="text-[10px] text-white/90 font-bold italic line-clamp-2 leading-relaxed">
                      "{d.prompt}"
                   </p>
                   <div className="flex flex-wrap gap-2">
                      {d.style && (
                        <Badge className="bg-white/10 text-[8px] font-black uppercase tracking-widest text-white border-none py-1">
                           {d.style}
                        </Badge>
                      )}
                      <Badge className="bg-primary/20 text-[8px] font-black uppercase tracking-widest text-primary border-none py-1">
                         {new Date(d.created_at).toLocaleDateString()}
                      </Badge>
                   </div>
                   <Button asChild size="sm" className="w-full h-10 font-black text-[10px] uppercase tracking-widest rounded-xl bg-white text-black hover:bg-primary hover:text-white border-none transition-all shadow-xl">
                      <Link to="/marketing" search={{ designId: d.id }}>
                         Pazarlamaya Gönder <ArrowUpRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                   </Button>
                </div>
              </div>

              {/* Selection Indicator */}
              <button 
                onClick={() => toggleSelect(d.id)}
                className="absolute top-6 left-6 h-7 w-7 rounded-full border-2 border-white/50 z-20 transition-all flex items-center justify-center bg-black/20 backdrop-blur-sm"
              >
                {selectedItems.includes(d.id) && (
                  <div className="h-5 w-5 bg-primary rounded-full flex items-center justify-center animate-in zoom-in duration-300">
                     <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                  </div>
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {selectedItems.length > 0 && (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-10 duration-700">
           <div className="bg-foreground text-background px-10 py-5 rounded-[2.5rem] shadow-2xl flex items-center gap-10 border border-white/10 backdrop-blur-2xl">
              <div className="flex flex-col">
                 <span className="text-[10px] font-black uppercase tracking-[0.3em] opacity-50">Koleksiyon</span>
                 <span className="text-2xl font-black tracking-tighter">{selectedItems.length} Öğe Seçildi</span>
              </div>
              <div className="h-12 w-[1px] bg-white/10" />
              <div className="flex gap-4">
                 <Button variant="secondary" className="font-black h-12 px-8 rounded-2xl uppercase tracking-widest text-[10px] hover:scale-105 transition-transform" onClick={() => setSelectedItems([])}>Vazgeç</Button>
                 <Button variant="destructive" className="font-black h-12 px-8 rounded-2xl uppercase tracking-widest text-[10px] hover:scale-105 transition-transform shadow-xl shadow-red-500/20" onClick={() => {
                   if (confirm(`${selectedItems.length} tasarımı kalıcı olarak silmek istediğine emin misin?`)) {
                      toast.success("Seçilen öğeler başarıyla temizlendi.");
                      setSelectedItems([]);
                      load();
                   }
                 }}>Hepsini Sil</Button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
}

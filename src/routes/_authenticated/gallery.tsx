import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, Trash2, Download, Search, Wand2, ArrowUpRight, Grid, CheckCircle2, Image as ImageIcon } from "lucide-react";
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

  useEffect(() => { load(); }, [filter, search]);

  const toggleFav = async (id: string, fav: boolean) => {
    const { error } = await supabase.from("designs").update({ is_favorite: !fav }).eq("id", id);
    if (error) toast.error("Hata oluştu");
    else {
      setItems(items.map(item => item.id === id ? { ...item, is_favorite: !fav } : item));
      toast.success(fav ? "Favorilerden çıkarıldı" : "Favorilere eklendi");
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Bu tasarımı silmek istediğinize emin misiniz?")) return;
    const { error } = await supabase.from("designs").delete().eq("id", id);
    if (error) toast.error("Silinemedi");
    else {
      setItems(items.filter(i => i.id !== id));
      setSelectedItems(prev => prev.filter(i => i !== id));
      toast.success("Silindi");
    }
  };

  const bulkDelete = async () => {
    if (!confirm(`${selectedItems.length} tasarımı silmek istediğinize emin misiniz?`)) return;
    for (const id of selectedItems) {
      await supabase.from("designs").delete().eq("id", id);
    }
    setItems(items.filter(i => !selectedItems.includes(i.id)));
    setSelectedItems([]);
    toast.success("Seçilen tasarımlar silindi");
  };

  const toggleSelect = (id: string) => {
    setSelectedItems(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  return (
    <div className="space-y-6 pb-16 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Galeri</h1>
          <p className="text-sm text-muted-foreground mt-1">Tüm tasarımlarınız burada.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Ara..."
              className="pl-9 h-9 w-48 text-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="flex border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => setFilter("all")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "all" ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              Tümü
            </button>
            <button
              onClick={() => setFilter("fav")}
              className={`px-3 py-1.5 text-xs font-medium transition-colors ${filter === "fav" ? "bg-foreground text-background" : "hover:bg-muted"}`}
            >
              <Heart className={`h-3 w-3 inline mr-1 ${filter === "fav" ? "fill-current" : ""}`} />
              Favoriler
            </button>
          </div>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedItems.length > 0 && (
        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border border-border/50 animate-in slide-in-from-top-2 duration-300">
          <span className="text-sm font-medium">{selectedItems.length} tasarım seçildi</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setSelectedItems([])}>Vazgeç</Button>
            <Button variant="destructive" size="sm" className="text-xs h-7" onClick={bulkDelete}>Sil</Button>
          </div>
        </div>
      )}

      {/* Grid */}
      {loading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {Array.from({ length: 10 }).map((_, i) => (
            <div key={i} className="aspect-square rounded-lg bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-muted-foreground">
          <ImageIcon className="h-10 w-10 mx-auto mb-3 opacity-20" />
          <p className="text-sm font-medium">Tasarım bulunamadı</p>
          <p className="text-xs mt-1 mb-4">
            {search ? "Arama kriterlerinize uygun tasarım yok." : "İlk tasarımınızı oluşturun."}
          </p>
          <Button asChild size="sm"><Link to="/generate">Tasarım Oluştur</Link></Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
          {items.map((d) => (
            <div
              key={d.id}
              className={`group relative aspect-square overflow-hidden rounded-lg border-2 transition-all bg-muted/20 ${
                selectedItems.includes(d.id) ? "border-primary ring-2 ring-primary/20" : "border-transparent hover:border-border"
              }`}
            >
              <img src={d.image_url} alt="" className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-500" />

              {/* Hover overlay */}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-3">
                <div className="flex justify-between">
                  <button
                    onClick={() => toggleSelect(d.id)}
                    className="h-7 w-7 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                  >
                    {selectedItems.includes(d.id)
                      ? <CheckCircle2 className="h-4 w-4 text-primary" />
                      : <Grid className="h-3.5 w-3.5" />}
                  </button>
                  <div className="flex gap-1">
                    <button
                      onClick={() => toggleFav(d.id, d.is_favorite)}
                      className="h-7 w-7 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <Heart className={`h-3.5 w-3.5 ${d.is_favorite ? "fill-red-500 text-red-500" : ""}`} />
                    </button>
                    <a
                      href={d.image_url}
                      download
                      className="h-7 w-7 rounded-md bg-white/20 backdrop-blur-sm flex items-center justify-center text-white hover:bg-white/30 transition-colors"
                    >
                      <Download className="h-3.5 w-3.5" />
                    </a>
                    <button
                      onClick={() => remove(d.id)}
                      className="h-7 w-7 rounded-md bg-red-500/30 backdrop-blur-sm flex items-center justify-center text-white hover:bg-red-500/50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] text-white/80 line-clamp-2 mb-2">{d.prompt}</p>
                  <div className="flex gap-1.5">
                    {d.style && <Badge variant="secondary" className="text-[9px] bg-white/20 text-white border-none">{d.style}</Badge>}
                    <Badge variant="secondary" className="text-[9px] bg-white/20 text-white border-none">
                      {new Date(d.created_at).toLocaleDateString("tr")}
                    </Badge>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

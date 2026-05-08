import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Heart, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/gallery")({
  component: Gallery,
});

function Gallery() {
  const { user } = useAuth();
  const [items, setItems] = useState<any[]>([]);
  const [filter, setFilter] = useState<"all" | "fav">("all");

  const load = async () => {
    if (!user?.id) return;
    let q = supabase.from("designs").select("*").eq("user_id", user.id).order("created_at", { ascending: false });
    if (filter === "fav") q = q.eq("is_favorite", true);
    const { data } = await q;
    setItems(data ?? []);
  };

  useEffect(() => {
    load();
  }, [filter]);

  const toggleFav = async (id: string, fav: boolean) => {
    await supabase.from("designs").update({ is_favorite: !fav }).eq("id", id);
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Tasarımı silmek istediğine emin misin?")) return;
    await supabase.from("designs").delete().eq("id", id);
    toast.success("Silindi");
    load();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold">Galeri</h1>
          <p className="text-sm text-muted-foreground">Tüm üretilen tasarımların.</p>
        </div>
        <div className="flex gap-1 rounded-md border border-border bg-card p-1">
          <button
            onClick={() => setFilter("all")}
            className={`rounded px-3 py-1 text-xs ${filter === "all" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Tümü
          </button>
          <button
            onClick={() => setFilter("fav")}
            className={`rounded px-3 py-1 text-xs ${filter === "fav" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}
          >
            Favoriler
          </button>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-10 text-center text-sm text-muted-foreground">
          Henüz tasarım yok.
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {items.map((d) => (
            <div key={d.id} className="group overflow-hidden rounded-xl border border-border bg-card">
              <div className="aspect-square bg-muted flex items-center justify-center relative overflow-hidden">
                <img 
                  src={d.image_url} 
                  alt="Tasarım" 
                  className="h-full w-full object-cover transition-opacity duration-300"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://placehold.co/600x600/1a1a1a/ffffff?text=Resim+Yuklenemedi";
                  }}
                />
              </div>
              <div className="p-3">
                <p className="line-clamp-2 text-xs text-muted-foreground">{d.prompt}</p>
                {d.style && <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{d.style}</p>}
                <div className="mt-2 flex justify-between">
                  <Button size="sm" variant="ghost" onClick={() => toggleFav(d.id, d.is_favorite)}>
                    <Heart className={`h-4 w-4 ${d.is_favorite ? "fill-primary text-primary" : ""}`} />
                  </Button>
                  <a
                    href={d.image_url}
                    download={`design-${d.id}.png`}
                    className="inline-flex h-8 w-8 items-center justify-center rounded-md hover:bg-accent"
                  >
                    <Download className="h-4 w-4" />
                  </a>
                  <Button size="sm" variant="ghost" onClick={() => remove(d.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

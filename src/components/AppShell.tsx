import { Link, useRouter } from "@tanstack/react-router";
import { Sparkles, TrendingUp, Wand2, Image as ImageIcon, LogOut, Settings, Box, ShoppingCart, Megaphone } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

const nav = [
  { to: "/dashboard", label: "Panel", icon: Sparkles },
  { to: "/trends", label: "Trendler", icon: TrendingUp },
  { to: "/generate", label: "Üret", icon: Wand2 },
  { to: "/mockups", label: "Mockup Studio", icon: ImageIcon },
  { to: "/inventory", label: "Envanter", icon: Box },
  { to: "/orders", label: "Siparişler", icon: ShoppingCart },
  { to: "/marketing", label: "Pazarlama", icon: Megaphone },
  { to: "/gallery", label: "Galeri", icon: ImageIcon },
  { to: "/settings", label: "Ayarlar", icon: Settings },
  { to: "/pricing", label: "Planlar", icon: Sparkles },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const { user, profile, signOut } = useAuth();
  const router = useRouter();

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-30 border-b border-border bg-background/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link to="/dashboard" className="flex items-center gap-2 font-semibold">
            <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-accent text-primary-foreground">
              <Sparkles className="h-4 w-4" />
            </span>
            <span>Lumina Seller</span>
          </Link>
          <nav className="hidden gap-1 md:flex">
            {nav.map((n) => (
              <Link
                key={n.to}
                to={n.to}
                className="rounded-md px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                activeProps={{ className: "rounded-md px-3 py-1.5 text-sm bg-accent text-foreground" }}
              >
                {n.label}
              </Link>
            ))}
          </nav>
          <div className="flex items-center gap-2">

            <span className="hidden text-xs text-muted-foreground sm:inline">{user?.email}</span>
            <Button
              variant="ghost"
              size="sm"
              onClick={async () => {
                await signOut();
                router.navigate({ to: "/" });
              }}
            >
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto border-t border-border px-2 py-2 md:hidden">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent"
              activeProps={{ className: "flex items-center gap-1.5 rounded-md px-3 py-1.5 text-xs bg-accent text-foreground" }}
            >
              <n.icon className="h-3.5 w-3.5" />
              {n.label}
            </Link>
          ))}
        </nav>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
    </div>
  );
}

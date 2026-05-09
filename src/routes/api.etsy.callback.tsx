import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useAuth } from "@/lib/auth";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/api/etsy/callback")({
  component: EtsyCallbackPage,
  validateSearch: (s: Record<string, unknown>) => ({
    code: typeof s.code === "string" ? s.code : "",
    state: typeof s.state === "string" ? s.state : "",
  }),
});

function EtsyCallbackPage() {
  const { code, state } = Route.useSearch();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    if (!user || processing) return;

    const savedState = localStorage.getItem("etsy_state");
    const verifier = localStorage.getItem("etsy_verifier");

    if (!code || state !== savedState || !verifier) {
      toast.error("Bağlantı doğrulaması başarısız.");
      navigate({ to: "/settings" });
      return;
    }

    setProcessing(true);

    // Dynamic import to avoid code-splitter issues with server functions in route files
    import("@/lib/etsy.functions").then(({ handleEtsyCallback }) => {
      return handleEtsyCallback({ data: { code, verifier, userId: user.id } });
    })
      .then(() => {
        toast.success("Etsy dükkanınız başarıyla bağlandı!");
        localStorage.removeItem("etsy_state");
        localStorage.removeItem("etsy_verifier");
        navigate({ to: "/settings" });
      })
      .catch((e: any) => {
        toast.error("Hata: " + (e?.message || "Bilinmeyen hata"));
        navigate({ to: "/settings" });
      })
      .finally(() => setProcessing(false));
  }, [code, state, user]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center space-y-4">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
      <p className="text-sm font-medium">Etsy dükkanınız bağlanıyor, lütfen bekleyin...</p>
    </div>
  );
}

import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useProducts, Product } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { useInvestments } from "@/hooks/useInvestments";
import { formatMoney, getCountry } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Products() {
  const { data, loading } = useProducts();
  const { profile, refetchProfile } = useAuth();
  const { reload } = useInvestments();
  const cur = getCountry(profile?.country).currency;
  const [target, setTarget] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (!target || !profile) return;
    if (profile.balance < target.price) {
      toast.error("Solde insuffisant. Effectuez un dépôt.");
      setTarget(null);
      return;
    }
    setBusy(true);
    const currentBalance = Number(profile.balance ?? 0);
    const nextBalance = currentBalance - Number(target.price);
    const { error: debitError } = await supabase
      .from("users")
      .update({ balance: nextBalance })
      .eq("id", profile.id);
    if (debitError) {
      toast.error("Erreur lors du débit : " + debitError.message);
      setBusy(false);
      return;
    }
    const end = new Date(
      Date.now() + target.duration_days * 86400000,
    ).toISOString();
    const { error: e1 } = await supabase.from("investments").insert({
      user_id: profile.id,
      product_id: target.id,
      amount: target.price,
      daily_revenue: target.daily_revenue,
      total_revenue: target.total_revenue,
      end_date: end,
    });
    if (e1) {
      await supabase
        .from("users")
        .update({ balance: currentBalance })
        .eq("id", profile.id);
      toast.error(e1.message);
      setBusy(false);
      return;
    }
    setBusy(false);
    setTarget(null);
    toast.success(`${target.name} acheté !`);
    refetchProfile();
    reload();
  };

  return (
    <PageWrapper>
      <AppHeader />
      <div className="px-3 grid grid-cols-2 gap-3 pb-4">
        {loading &&
          Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-72 w-full rounded-md" />
          ))}
        {data.map((p) => (
          <article key={p.id} className="luxury-card flex flex-col">
            <h3 className="text-center py-2 font-serif font-semibold text-sm">
              {p.name}
            </h3>
            <div className="h-40 bg-secondary">
              {p.image_url && (
                <img
                  src={p.image_url}
                  alt={p.name}
                  loading="lazy"
                  decoding="async"
                  className="w-full h-full object-cover"
                />
              )}
            </div>
            <div className="p-3 space-y-1 flex-1">
              <p className="text-base font-serif font-semibold">
                {formatMoney(p.price, cur)}
              </p>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Somme du produit
              </p>
              <p className="text-sm font-semibold text-destructive pt-1">
                {formatMoney(p.daily_revenue, cur)}
              </p>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Revenu quotidien
              </p>
              <p className="text-sm font-semibold text-destructive pt-1">
                {formatMoney(p.total_revenue, cur)}
              </p>
              <p className="text-[11px] text-muted-foreground -mt-1">
                Revenu total
              </p>
            </div>
            <div className="px-3 pb-3 flex justify-end">
              <button onClick={() => setTarget(p)} className="btn-luxury">
                Acheter
              </button>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-xs bg-card">
          <DialogHeader>
            <DialogTitle className="font-serif">Confirmer l'achat</DialogTitle>
          </DialogHeader>
          {target && (
            <div className="space-y-1 text-sm">
              <p>
                Produit : <strong>{target.name}</strong>
              </p>
              <p>
                Prix :{" "}
                <strong className="text-panel-dark">
                  {formatMoney(target.price, cur)}
                </strong>
              </p>
              <p>
                Revenu quotidien :{" "}
                <strong className="text-panel-dark">
                  {formatMoney(target.daily_revenue, cur)}
                </strong>
              </p>
              <p>
                Solde actuel :{" "}
                <strong>{formatMoney(profile?.balance ?? 0, cur)}</strong>
              </p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>
              Annuler
            </Button>
            <button onClick={buy} disabled={busy} className="btn-luxury">
              {busy ? "..." : "Confirmer"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

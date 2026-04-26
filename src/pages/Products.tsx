import { useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useProducts, Product } from "@/hooks/useProducts";
import { useAuth } from "@/context/AuthContext";
import { useInvestments } from "@/hooks/useInvestments";
import { formatMoney, getCountry } from "@/lib/countries";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Products() {
  const { data, loading } = useProducts();
  const { profile, refetchProfile } = useAuth();
  const { data: invs, reload } = useInvestments();
  const cur = getCountry(profile?.country).currency;
  const [target, setTarget] = useState<Product | null>(null);
  const [busy, setBusy] = useState(false);

  const buy = async () => {
    if (!target || !profile) return;
    if (profile.balance < target.price) { toast.error("Solde insuffisant. Effectuez un dépôt."); setTarget(null); return; }
    setBusy(true);
    const end = new Date(Date.now() + target.duration_days * 86400000).toISOString();
    const { error: e1 } = await supabase.from("investments").insert({
      user_id: profile.id, product_id: target.id, amount: target.price,
      daily_revenue: target.daily_revenue, total_revenue: target.total_revenue, end_date: end,
    });
    if (e1) { toast.error(e1.message); setBusy(false); return; }
    const { error: e2 } = await supabase.from("users").update({ balance: profile.balance - target.price }).eq("id", profile.id);
    setBusy(false); setTarget(null);
    if (e2) toast.error(e2.message);
    else { toast.success(`${target.name} acheté !`); refetchProfile(); reload(); }
  };

  const totalProducts = invs.length;
  const totalProfit = invs.reduce((s, i) => s + Number(i.earned), 0);

  return (
    <PageWrapper>
      <div className="relative h-44 overflow-hidden">
        <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=60" alt="" loading="eager" className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 to-primary/50" />
        <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
          <div className="bg-white/15 backdrop-blur rounded-lg p-3 w-32">
            <div className="text-white text-xl font-bold">{totalProducts}</div>
            <div className="text-white/80 text-[11px]">Total des produits</div>
          </div>
          <div className="bg-white/15 backdrop-blur rounded-lg p-3 w-32 mt-12">
            <div className="text-white text-lg font-bold">{formatMoney(totalProfit, cur)}</div>
            <div className="text-white/80 text-[11px]">Bénéfice du produit</div>
          </div>
        </div>
        <h2 className="absolute bottom-3 left-4 text-white text-3xl font-black tracking-wider">RÉFRIGÉRATEURS</h2>
      </div>

      <AppHeader />

      <div className="px-3 space-y-3">
        {loading && Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-40 w-full rounded-xl" />)}
        {data.map(p => (
          <article key={p.id} className="bg-secondary rounded-xl p-3 flex gap-3">
            <img src={p.image_url ?? ""} alt={p.name} loading="lazy" decoding="async"
                 className="w-32 h-32 rounded-lg object-cover bg-white shrink-0" />
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-accent font-bold text-lg">{p.name}</h3>
                  <p className="text-xs"><span className="text-foreground">Prix: </span><span className="text-accent font-bold">{formatMoney(p.price, cur)}</span></p>
                  <p className="text-xs"><span className="text-foreground">Validité: </span><span className="text-accent font-bold">{p.duration_days} jours</span></p>
                  <p className="text-xs"><span className="text-foreground">Revenu/jour: </span><span className="text-accent font-bold">{formatMoney(p.daily_revenue, cur)}</span></p>
                  <p className="text-xs"><span className="text-foreground">Total: </span><span className="text-accent font-bold">{formatMoney(p.total_revenue, cur)}</span></p>
                </div>
                <Button size="sm" onClick={() => setTarget(p)} className="rounded-pill bg-accent hover:bg-accent/90 text-accent-foreground h-8 px-4 text-xs font-semibold">Acheter</Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">Après l'achat, le profit sera automatiquement crédité dans les 24 heures.</p>
            </div>
          </article>
        ))}
      </div>

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent className="max-w-xs">
          <DialogHeader><DialogTitle>Confirmer l'achat</DialogTitle></DialogHeader>
          {target && (
            <div className="space-y-1 text-sm">
              <p>Produit : <strong>{target.name}</strong></p>
              <p>Prix : <strong className="text-accent">{formatMoney(target.price, cur)}</strong></p>
              <p>Revenu quotidien : <strong className="text-accent">{formatMoney(target.daily_revenue, cur)}</strong></p>
              <p>Solde actuel : <strong>{formatMoney(profile?.balance ?? 0, cur)}</strong></p>
            </div>
          )}
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setTarget(null)}>Annuler</Button>
            <Button onClick={buy} disabled={busy} className="bg-accent hover:bg-accent/90 text-accent-foreground">{busy ? "..." : "Confirmer"}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

import { Refrigerator } from "lucide-react";
import { AppHeader } from "@/components/layout/AppHeader";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useInvestments } from "@/hooks/useInvestments";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, getCountry } from "@/lib/countries";

export default function MyProducts() {
  const { data, loading } = useInvestments();
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const totalEarned = data.reduce((s, i) => s + Number(i.earned), 0);

  return (
    <PageWrapper>
      <AppHeader />
      <div className="px-4 space-y-4">
        {/* Vitrine hero */}
        <div className="rounded-md overflow-hidden aspect-[16/9]">
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=70" loading="lazy" alt="" className="w-full h-full object-cover" />
        </div>

        {/* 2 stats taupe */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-panel text-panel-foreground rounded-md p-4">
            <p className="text-xs opacity-80 font-serif">Quantité achetée</p>
            <p className="text-2xl font-serif font-semibold mt-2">{data.length}</p>
          </div>
          <div className="bg-panel text-panel-foreground rounded-md p-4">
            <p className="text-xs opacity-80 font-serif">Mes revenus</p>
            <p className="text-2xl font-serif font-semibold mt-2">{formatMoney(totalEarned, cur)}</p>
          </div>
        </div>

        <div className="space-y-3 pt-2">
          {loading && <p className="text-center text-muted-foreground">Chargement...</p>}
          {!loading && data.length === 0 && (
            <div className="text-center py-16">
              <Refrigerator className="w-14 h-14 mx-auto text-muted-foreground/40" strokeWidth={1.2} />
              <p className="text-foreground mt-4 font-serif">Vous n'avez pas acheté de produit</p>
            </div>
          )}
          {data.map(inv => {
            const total = Number(inv.total_revenue);
            const earned = Number(inv.earned);
            const pct = total ? Math.min(100, (earned / total) * 100) : 0;
            return (
              <div key={inv.id} className="bg-card border border-border/40 rounded-md p-4">
                <div className="flex justify-between text-sm font-serif font-semibold">
                  <span>Investissement</span>
                  <span className={inv.status === "active" ? "text-success" : "text-muted-foreground"}>{inv.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Fin : {new Date(inv.end_date).toLocaleDateString("fr-FR")}</p>
                <div className="flex justify-between text-xs mt-2">
                  <span>Gains : <strong className="text-panel-dark">{formatMoney(earned, cur)}</strong></span>
                  <span>Total : <strong>{formatMoney(total, cur)}</strong></span>
                </div>
                <div className="h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-panel-dark" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </PageWrapper>
  );
}

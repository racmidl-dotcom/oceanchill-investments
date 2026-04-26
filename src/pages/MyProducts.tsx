import { Refrigerator } from "lucide-react";
import { BackHeader } from "@/components/layout/BackHeader";
import { useInvestments } from "@/hooks/useInvestments";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, getCountry } from "@/lib/countries";

export default function MyProducts() {
  const { data, loading } = useInvestments();
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const totalEarned = data.reduce((s, i) => s + Number(i.earned), 0);

  return (
    <div className="app-shell">
      <BackHeader title="Mon produit" />
      <div className="px-4 mt-4">
        <div className="bg-secondary rounded-xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-sm">Revenus des produits</p>
            <p className="text-2xl font-bold mt-1">{formatMoney(totalEarned, cur)}</p>
          </div>
          <div className="border-l border-border pl-4">
            <p className="font-semibold text-sm">Mon produit</p>
            <p className="text-2xl font-bold mt-1">{data.length}</p>
          </div>
          <div className="text-primary font-extrabold text-lg">Ocean<span className="text-accent">P</span></div>
        </div>

        <div className="mt-8 space-y-3">
          {loading && <p className="text-center text-muted-foreground">Chargement...</p>}
          {!loading && data.length === 0 && (
            <div className="text-center py-20">
              <Refrigerator className="w-16 h-16 mx-auto text-muted-foreground/40" />
              <p className="text-muted-foreground mt-4">Vous n'avez pas encore de produits.</p>
            </div>
          )}
          {data.map(inv => {
            const total = Number(inv.total_revenue);
            const earned = Number(inv.earned);
            const pct = total ? Math.min(100, (earned / total) * 100) : 0;
            return (
              <div key={inv.id} className="bg-secondary rounded-xl p-4">
                <div className="flex justify-between text-sm font-semibold">
                  <span>Investissement</span>
                  <span className={inv.status === "active" ? "text-success" : "text-muted-foreground"}>{inv.status}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">Fin : {new Date(inv.end_date).toLocaleDateString("fr-FR")}</p>
                <div className="flex justify-between text-xs mt-2">
                  <span>Gains : <strong className="text-accent">{formatMoney(earned, cur)}</strong></span>
                  <span>Total : <strong>{formatMoney(total, cur)}</strong></span>
                </div>
                <div className="h-1.5 bg-border rounded-full mt-2 overflow-hidden">
                  <div className="h-full bg-accent" style={{ width: `${pct}%` }} />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { Link } from "react-router-dom";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, getCountry } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const PRESETS = [5000, 8000, 12500, 15000, 20000];
const RULES = [
  "Le dépôt minimum est de 500 XOF.",
  "Paiement instantané et sécurisé via MoneyFusion.",
  "Votre solde est crédité automatiquement après confirmation du paiement.",
  "Conservez votre référence de transaction.",
  "Ne partagez jamais vos identifiants.",
  "En cas de problème, contactez le service client.",
];

export default function Deposit() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [amount, setAmount] = useState<number>(5000);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile || amount < 500) return toast.error("Minimum 500 FCFA");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke("moneyfusion-create-payment", {
      body: { amount },
    });
    setBusy(false);
    if (error || !data?.url) {
      toast.error(error?.message || data?.error || "Erreur de paiement");
      return;
    }
    // Redirige vers la page de paiement MoneyFusion
    window.location.href = data.url;
  };

  return (
    <div className="app-shell">
      <BackHeader title="Recharger via MoneyFusion" right={<Link to="/history"><HistoryIcon className="w-5 h-5" /></Link>} />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-xl overflow-hidden relative h-32">
          <img src="https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=600&q=60" loading="lazy" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/70 flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-xs opacity-80">Solde actuel</p>
              <p className="text-2xl font-bold">{formatMoney(profile?.balance ?? 0, cur)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Montant à recharger</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(p)} className={`py-2 rounded-lg border text-sm font-medium ${amount === p ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border"}`}>
                {p.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-12" />
        </div>

        <div className="bg-secondary rounded-xl p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-bold">MF</div>
          <div>
            <p className="font-semibold text-sm">MoneyFusion</p>
            <p className="text-xs text-muted-foreground">Orange, MTN, Moov, Wave, Airtel...</p>
          </div>
        </div>

        <Button onClick={submit} disabled={busy} className="w-full h-12 rounded-pill bg-stat hover:bg-stat/90 text-stat-foreground font-semibold">
          {busy ? "Redirection..." : "Payer maintenant"}
        </Button>

        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4 pt-2">
          {RULES.map(r => <li key={r}>{r}</li>)}
        </ol>
      </div>
    </div>
  );
}

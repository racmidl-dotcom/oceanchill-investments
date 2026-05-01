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

const PRESETS = [4000, 5000, 10000, 20000, 50000, 100000];
const RULES = [
  "Le dépôt minimum est de 4 000 XOF.",
  "Paiement instantané et sécurisé via MoneyFusion.",
  "Votre solde est crédité automatiquement après confirmation du paiement.",
  "Conservez votre référence de transaction.",
  "Ne partagez jamais vos identifiants.",
  "En cas de problème, contactez le service client.",
];

export default function Deposit() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [amount, setAmount] = useState<number>(4000);
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile || amount < 4000) return toast.error("Minimum 4 000 FCFA");
    setBusy(true);
    const { data, error } = await supabase.functions.invoke(
      "moneyfusion-create-payment",
      {
        body: { amount },
      },
    );
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
      <BackHeader
        title="Recharger via MoneyFusion"
        right={
          <Link to="/history">
            <HistoryIcon className="w-5 h-5" />
          </Link>
        }
      />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-md overflow-hidden relative h-32 bg-panel">
          <div className="absolute inset-0 flex items-center justify-center text-panel-foreground">
            <div className="text-center">
              <p className="text-xs opacity-80 font-serif">Solde actuel</p>
              <p className="text-2xl font-serif font-bold">
                {formatMoney(profile?.balance ?? 0, cur)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-serif font-semibold mb-2">
            Montant à recharger
          </p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map((p) => (
              <button
                key={p}
                onClick={() => setAmount(p)}
                className={`py-2 rounded-sm border text-sm font-medium transition ${amount === p ? "bg-panel-dark text-panel-foreground border-panel-dark" : "bg-card border-border hover:border-panel"}`}
              >
                {p.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-12 bg-card"
          />
        </div>

        <div className="bg-card border border-border/50 rounded-md p-4 flex items-center gap-3">
          <div className="w-12 h-12 rounded-sm bg-panel text-panel-foreground flex items-center justify-center font-bold">
            MF
          </div>
          <div>
            <p className="font-serif font-semibold text-sm">MoneyFusion</p>
            <p className="text-xs text-muted-foreground">
              Orange, MTN, Moov, Wave, Airtel...
            </p>
          </div>
        </div>

        <Button
          onClick={submit}
          disabled={busy}
          className="w-full h-12 rounded-sm bg-panel-dark hover:bg-panel text-panel-foreground font-serif font-semibold tracking-widest uppercase text-sm"
        >
          {busy ? "Redirection..." : "Payer maintenant"}
        </Button>

        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4 pt-2">
          {RULES.map((r) => (
            <li key={r}>{r}</li>
          ))}
        </ol>
      </div>
    </div>
  );
}

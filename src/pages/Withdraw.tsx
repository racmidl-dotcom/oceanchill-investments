import { useState } from "react";
import { History as HistoryIcon } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { formatMoney, getCountry } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const FEE = 0.18;
const MIN = 1500;
const RULES = [
  "Retrait minimum : 1 500 XOF.",
  "Frais de retrait : 18%.",
  "Un produit actif est requis pour retirer.",
  "Compte bancaire mobile money obligatoire.",
  "Délais : 5 minutes à 24 heures.",
  "Vérifiez le numéro avant de valider.",
  "Frais non remboursables en cas d'erreur.",
];

export default function Withdraw() {
  const { profile, refetchProfile } = useAuth();
  const c = getCountry(profile?.country);
  const nav = useNavigate();
  const [amount, setAmount] = useState<number>(MIN);
  const [operator, setOperator] = useState(c.operators[0]);
  const fee = Math.round(amount * FEE);
  const net = amount - fee;
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile) return;
    if (amount < MIN) return toast.error(`Minimum ${MIN} FCFA`);
    if ((profile.balance ?? 0) < amount)
      return toast.error("Solde insuffisant");

    const { data: bank } = await supabase
      .from("bank_accounts")
      .select("*")
      .eq("user_id", profile.id)
      .maybeSingle();
    if (!bank) return toast.error("Enregistrez d'abord un compte bancaire");

    setBusy(true);

    const newBalance = Number(profile.balance ?? 0) - Number(amount);
    const { error: debitError } = await supabase
      .from("users")
      .update({ balance: newBalance })
      .eq("id", profile.id);

    if (debitError) {
      setBusy(false);
      return toast.error("Erreur lors du débit : " + debitError.message);
    }

    const { error: withdrawError } = await supabase.from("withdrawals").insert({
      user_id: profile.id,
      amount,
      fee,
      net_amount: net,
      operator,
      phone: bank.phone,
    });

    if (withdrawError) {
      await supabase
        .from("users")
        .update({ balance: Number(profile.balance ?? 0) })
        .eq("id", profile.id);
      setBusy(false);
      return toast.error("Erreur : " + withdrawError.message);
    }

    await refetchProfile();

    setBusy(false);
    toast.success("Demande de retrait envoyée !");
    nav("/history");
  };

  return (
    <div className="app-shell">
      <BackHeader
        title="Retirer de l'argent"
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
              <p className="text-xs opacity-80 font-serif">Solde disponible</p>
              <p className="text-2xl font-serif font-bold">
                {formatMoney(profile?.balance ?? 0, c.currency)}
              </p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-serif font-semibold mb-2">
            Banque de retrait
          </p>
          <select
            value={operator}
            onChange={(e) => setOperator(e.target.value)}
            className="w-full bg-card border border-border rounded-sm h-12 px-3"
          >
            {c.operators.map((o) => (
              <option key={o}>{o}</option>
            ))}
          </select>
        </div>

        <div>
          <p className="text-sm font-serif font-semibold mb-2">Montant</p>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="h-12 bg-card"
          />
          <div className="flex justify-between text-sm mt-2">
            <span>
              Impôt : <strong className="text-destructive">18%</strong>
            </span>
            <span>
              Reçu :{" "}
              <strong className="text-success">
                {formatMoney(net, c.currency)}
              </strong>
            </span>
          </div>
        </div>

        <Button
          onClick={submit}
          disabled={busy}
          className="w-full h-12 rounded-sm bg-panel-dark hover:bg-panel text-panel-foreground font-serif font-semibold tracking-widest uppercase text-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? (
            <span className="flex items-center gap-2 justify-center">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Traitement...
            </span>
          ) : (
            "Retirer maintenant"
          )}
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

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
  const { profile } = useAuth();
  const c = getCountry(profile?.country);
  const nav = useNavigate();
  const [amount, setAmount] = useState<number>(MIN);
  const [operator, setOperator] = useState(c.operators[0]);
  const fee = Math.round(amount * FEE);
  const net = amount - fee;
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile) return;
    if (amount < MIN) return toast.error(`Minimum ${MIN}`);
    if ((profile.balance ?? 0) < amount) return toast.error("Solde insuffisant");
    const { data: bank } = await supabase.from("bank_accounts").select("*").eq("user_id", profile.id).maybeSingle();
    if (!bank) return toast.error("Enregistrez d'abord un compte bancaire");
    setBusy(true);
    const { error } = await supabase.from("withdrawals").insert({
      user_id: profile.id, amount, fee, net_amount: net, operator, phone: bank.phone,
    });
    if (!error) await supabase.from("users").update({ balance: profile.balance - amount }).eq("id", profile.id);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Demande de retrait envoyée"); nav("/history"); }
  };

  return (
    <div className="app-shell">
      <BackHeader title="Retirer de l'argent" right={<Link to="/history"><HistoryIcon className="w-5 h-5" /></Link>} />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-xl overflow-hidden relative h-32">
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=600&q=60" loading="lazy" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/70 flex items-center justify-center text-white">
            <div className="text-center">
              <p className="text-xs opacity-80">Solde disponible</p>
              <p className="text-2xl font-bold">{formatMoney(profile?.balance ?? 0, c.currency)}</p>
            </div>
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Banque de retrait</p>
          <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full bg-secondary rounded-lg h-12 px-3">
            {c.operators.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Montant</p>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-12" />
          <div className="flex justify-between text-sm mt-2">
            <span>Impôt : <strong className="text-destructive">18%</strong></span>
            <span>Reçu : <strong className="text-success">{formatMoney(net, c.currency)}</strong></span>
          </div>
        </div>

        <Button onClick={submit} disabled={busy} className="w-full h-12 rounded-pill bg-stat hover:bg-stat/90 text-stat-foreground font-semibold">
          {busy ? "..." : "Retirer de l'argent maintenant"}
        </Button>

        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4 pt-2">
          {RULES.map(r => <li key={r}>{r}</li>)}
        </ol>
      </div>
    </div>
  );
}

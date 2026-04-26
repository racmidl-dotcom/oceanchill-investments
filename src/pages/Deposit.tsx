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

const PRESETS = [5000, 8000, 12500, 15000, 20000];
const RULES = [
  "Le dépôt minimum est de 5 000 XOF.",
  "Vérifiez le canal actif avant de procéder.",
  "Le crédit s'effectue après confirmation par notre équipe (max 30 min).",
  "Conservez votre référence de transaction.",
  "Ne partagez jamais vos identifiants.",
  "En cas de problème, contactez le service client.",
];

export default function Deposit() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const nav = useNavigate();
  const [amount, setAmount] = useState<number>(5000);
  const [channel, setChannel] = useState("channel_1");
  const [busy, setBusy] = useState(false);

  const submit = async () => {
    if (!profile || amount < 5000) return toast.error("Minimum 5 000");
    setBusy(true);
    const { error } = await supabase.from("deposits").insert({ user_id: profile.id, amount, channel, reference: `DEP-${Date.now()}` });
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Demande de dépôt envoyée"); nav("/history"); }
  };

  return (
    <div className="app-shell">
      <BackHeader title="Dépôt en ligne" right={<Link to="/history"><HistoryIcon className="w-5 h-5" /></Link>} />
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
          <p className="text-sm font-semibold mb-2">Montant</p>
          <div className="grid grid-cols-3 gap-2 mb-3">
            {PRESETS.map(p => (
              <button key={p} onClick={() => setAmount(p)} className={`py-2 rounded-lg border text-sm font-medium ${amount === p ? "bg-accent text-accent-foreground border-accent" : "bg-secondary border-border"}`}>
                {p.toLocaleString("fr-FR")}
              </button>
            ))}
          </div>
          <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="h-12" />
        </div>

        <div>
          <p className="text-sm font-semibold mb-2">Canal de dépôt</p>
          <div className="grid grid-cols-2 gap-2">
            <button onClick={() => setChannel("channel_1")} className={`py-3 rounded-lg border text-sm font-medium ${channel === "channel_1" ? "bg-primary text-primary-foreground border-primary" : "bg-secondary border-border"}`}>Canal 1 (actif)</button>
            <button disabled className="py-3 rounded-lg border border-border text-sm bg-muted text-muted-foreground">Canal 2 (inactif)</button>
          </div>
        </div>

        <Button onClick={submit} disabled={busy} className="w-full h-12 rounded-pill bg-stat hover:bg-stat/90 text-stat-foreground font-semibold">
          {busy ? "..." : "Déposez maintenant"}
        </Button>

        <ol className="text-xs text-muted-foreground space-y-1 list-decimal pl-4 pt-2">
          {RULES.map(r => <li key={r}>{r}</li>)}
        </ol>
      </div>
    </div>
  );
}

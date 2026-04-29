import { useEffect, useState } from "react";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCountry } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function BankAccount() {
  const { profile } = useAuth();
  const c = getCountry(profile?.country);
  const [operator, setOperator] = useState(c.operators[0]);
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!profile) return;
    supabase.from("bank_accounts").select("*").eq("user_id", profile.id).maybeSingle().then(({ data }) => {
      if (data) { setOperator(data.operator); setPhone(data.phone); }
    });
  }, [profile]);

  const save = async () => {
    if (!profile) return;
    if (!phone) return toast.error("Numéro requis");
    setBusy(true);
    const { error } = await supabase.from("bank_accounts").upsert({ user_id: profile.id, operator, phone }, { onConflict: "user_id" });
    setBusy(false);
    if (error) toast.error(error.message); else toast.success("Compte enregistré");
  };

  return (
    <div className="app-shell">
      <BackHeader title="Compte bancaire" />
      <div className="px-4 mt-6 space-y-4">
        <div>
          <label className="text-sm font-serif font-semibold mb-1 block">Opérateur</label>
          <select value={operator} onChange={(e) => setOperator(e.target.value)} className="w-full bg-card border border-border rounded-sm h-12 px-3">
            {c.operators.map(o => <option key={o}>{o}</option>)}
          </select>
        </div>
        <div>
          <label className="text-sm font-serif font-semibold mb-1 block">Numéro de téléphone</label>
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder={c.dial + " XX XX XX XX"} className="h-12 bg-card" />
        </div>
        <Button onClick={save} disabled={busy} className="w-full h-12 rounded-sm bg-panel-dark hover:bg-panel text-panel-foreground font-serif font-semibold tracking-widest uppercase text-sm">
          {busy ? "..." : "Enregistrer"}
        </Button>
      </div>
    </div>
  );
}

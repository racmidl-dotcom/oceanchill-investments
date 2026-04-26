import { useEffect, useState } from "react";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { formatMoney, getCountry } from "@/lib/countries";

type Row = { id: string; amount: number; status: string; created_at: string; ref?: string; extra?: string };
const STATUS_COLOR: Record<string, string> = { pending: "text-warning", approved: "text-success", confirmed: "text-success", rejected: "text-destructive", active: "text-success" };

const List = ({ rows, cur }: { rows: Row[]; cur: "XOF" | "XAF" }) => (
  <div className="space-y-2">
    {rows.length === 0 && <p className="text-center text-sm text-muted-foreground py-8">Aucune entrée</p>}
    {rows.map(r => (
      <div key={r.id} className="bg-secondary rounded-lg p-3 flex justify-between items-center">
        <div>
          <p className="font-bold text-sm">{formatMoney(r.amount, cur)}</p>
          <p className="text-xs text-muted-foreground">{r.ref ?? r.extra ?? ""}</p>
          <p className="text-[10px] text-muted-foreground">{new Date(r.created_at).toLocaleString("fr-FR")}</p>
        </div>
        <span className={`text-xs font-bold uppercase ${STATUS_COLOR[r.status] ?? "text-muted-foreground"}`}>{r.status}</span>
      </div>
    ))}
  </div>
);

export default function History() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [deposits, setDeposits] = useState<Row[]>([]);
  const [withdrawals, setWithdrawals] = useState<Row[]>([]);
  const [referrals, setReferrals] = useState<Row[]>([]);
  const [investments, setInvestments] = useState<Row[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase.from("deposits").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).then(({ data }) =>
      setDeposits((data ?? []).map((d: any) => ({ id: d.id, amount: d.amount, status: d.status, created_at: d.created_at, ref: d.reference }))));
    supabase.from("withdrawals").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).then(({ data }) =>
      setWithdrawals((data ?? []).map((d: any) => ({ id: d.id, amount: d.amount, status: d.status, created_at: d.created_at, extra: `${d.operator} · ${d.phone}` }))));
    supabase.from("referrals").select("*").eq("referrer_id", profile.id).order("created_at", { ascending: false }).then(({ data }) =>
      setReferrals((data ?? []).map((d: any) => ({ id: d.id, amount: d.commission, status: `niv${d.level}`, created_at: d.created_at }))));
    supabase.from("investments").select("*").eq("user_id", profile.id).order("created_at", { ascending: false }).then(({ data }) =>
      setInvestments((data ?? []).map((d: any) => ({ id: d.id, amount: d.amount, status: d.status, created_at: d.created_at }))));
  }, [profile]);

  return (
    <div className="app-shell">
      <BackHeader title="Historique" />
      <div className="px-4 mt-4">
        <Tabs defaultValue="dep">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="dep">Dépôts</TabsTrigger>
            <TabsTrigger value="wd">Retraits</TabsTrigger>
            <TabsTrigger value="ref">Commissions</TabsTrigger>
            <TabsTrigger value="inv">Invest.</TabsTrigger>
          </TabsList>
          <TabsContent value="dep" className="mt-3"><List rows={deposits} cur={cur} /></TabsContent>
          <TabsContent value="wd" className="mt-3"><List rows={withdrawals} cur={cur} /></TabsContent>
          <TabsContent value="ref" className="mt-3"><List rows={referrals} cur={cur} /></TabsContent>
          <TabsContent value="inv" className="mt-3"><List rows={investments} cur={cur} /></TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, getCountry } from "@/lib/countries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type Row = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  ref?: string;
  extra?: string;
};

const List = ({ rows, cur }: { rows: Row[]; cur: "XOF" | "XAF" | "CDF" }) => (
  <div className="space-y-2">
    {rows.length === 0 && (
      <p className="text-center text-sm text-muted-foreground py-8">
        Aucune entrée
      </p>
    )}
    {rows.map((r) => (
      <div
        key={r.id}
        className="bg-secondary rounded-lg p-3 flex justify-between items-center"
      >
        <div>
          <p className="font-bold text-sm">{formatMoney(r.amount, cur)}</p>
          <p className="text-xs text-muted-foreground">
            {r.ref ?? r.extra ?? ""}
          </p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(r.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <span className="text-xs font-bold uppercase text-muted-foreground">
          {r.status}
        </span>
      </div>
    ))}
  </div>
);

export default function AccountDetails() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [deposits, setDeposits] = useState<Row[]>([]);
  const [withdrawals, setWithdrawals] = useState<Row[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("deposits")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setDeposits(
          (data ?? []).map((d: any) => ({
            id: d.id,
            amount: d.amount,
            status: d.status,
            created_at: d.created_at,
            ref: d.reference,
          })),
        ),
      );
    supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setWithdrawals(
          (data ?? []).map((d: any) => ({
            id: d.id,
            amount: d.amount,
            status: d.status,
            created_at: d.created_at,
            extra: `${d.operator} · ${d.phone}`,
          })),
        ),
      );
  }, [profile]);

  return (
    <div className="app-shell">
      <BackHeader title="Détails du compte" />
      <div className="px-4 mt-4 space-y-3">
        <div className="bg-card border border-border/40 rounded-md p-4">
          <Tabs defaultValue="dep">
            <TabsList className="w-full grid grid-cols-2">
              <TabsTrigger value="dep">Dépôts</TabsTrigger>
              <TabsTrigger value="wd">Retraits</TabsTrigger>
            </TabsList>
            <TabsContent value="dep" className="mt-3">
              <List rows={deposits} cur={cur} />
            </TabsContent>
            <TabsContent value="wd" className="mt-3">
              <List rows={withdrawals} cur={cur} />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}

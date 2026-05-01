import { useEffect, useMemo, useState } from "react";
import { BackHeader } from "@/components/layout/BackHeader";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, getCountry } from "@/lib/countries";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

type Row = {
  id: string;
  amount: number;
  status: string;
  created_at: string;
  extra?: string;
};

const STATUS_LABELS: Record<string, string> = {
  pending: "En attente",
  approved: "Validé",
  rejected: "Échoué",
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
          <p className="text-xs text-muted-foreground">{r.extra ?? ""}</p>
          <p className="text-[10px] text-muted-foreground">
            {new Date(r.created_at).toLocaleString("fr-FR")}
          </p>
        </div>
        <span className="text-xs font-bold uppercase text-muted-foreground">
          {STATUS_LABELS[r.status] ?? r.status}
        </span>
      </div>
    ))}
  </div>
);

export default function WithdrawalsHistory() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [rows, setRows] = useState<Row[]>([]);

  useEffect(() => {
    if (!profile) return;
    supabase
      .from("withdrawals")
      .select("*")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .then(({ data }) =>
        setRows(
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

  const grouped = useMemo(() => {
    return {
      all: rows,
      pending: rows.filter((r) => r.status === "pending"),
      approved: rows.filter((r) => r.status === "approved"),
      rejected: rows.filter((r) => r.status === "rejected"),
    };
  }, [rows]);

  return (
    <div className="app-shell">
      <BackHeader title="Registres de retrait" />
      <div className="px-4 mt-4">
        <Tabs defaultValue="all">
          <TabsList className="w-full grid grid-cols-4">
            <TabsTrigger value="all">Tous</TabsTrigger>
            <TabsTrigger value="pending">En attente</TabsTrigger>
            <TabsTrigger value="approved">Validés</TabsTrigger>
            <TabsTrigger value="rejected">Échoués</TabsTrigger>
          </TabsList>
          <TabsContent value="all" className="mt-3">
            <List rows={grouped.all} cur={cur} />
          </TabsContent>
          <TabsContent value="pending" className="mt-3">
            <List rows={grouped.pending} cur={cur} />
          </TabsContent>
          <TabsContent value="approved" className="mt-3">
            <List rows={grouped.approved} cur={cur} />
          </TabsContent>
          <TabsContent value="rejected" className="mt-3">
            <List rows={grouped.rejected} cur={cur} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

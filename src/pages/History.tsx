import { useEffect, useState } from "react";
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
  ref?: string;
  extra?: string;
};
const statusConfig: Record<string, { label: string; className: string }> = {
  pending: {
    label: "En attente",
    className: "bg-yellow-100 text-yellow-800 border-yellow-300",
  },
  confirmed: {
    label: "Confirmé",
    className: "bg-green-100 text-green-800 border-green-300",
  },
  rejected: {
    label: "Échoué",
    className: "bg-red-100 text-red-800 border-red-300",
  },
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
        {(() => {
          const config = statusConfig[r.status] ?? statusConfig.pending;
          return (
            <span
              className={`text-xs px-2 py-0.5 rounded-full border font-medium ${config.className}`}
            >
              {config.label}
            </span>
          );
        })()}
      </div>
    ))}
  </div>
);

export default function History() {
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
      <BackHeader title="Historique des recharges" />
      <div className="px-4 mt-4">
        <Tabs defaultValue="success">
          <TabsList className="w-full grid grid-cols-3">
            <TabsTrigger value="success">Réussies</TabsTrigger>
            <TabsTrigger value="pending">En cours</TabsTrigger>
            <TabsTrigger value="failed">Échouées</TabsTrigger>
          </TabsList>
          <TabsContent value="success" className="mt-3">
            <List
              rows={deposits.filter((d) =>
                ["confirmed", "approved"].includes(d.status),
              )}
              cur={cur}
            />
          </TabsContent>
          <TabsContent value="pending" className="mt-3">
            <List
              rows={deposits.filter((d) => d.status === "pending")}
              cur={cur}
            />
          </TabsContent>
          <TabsContent value="failed" className="mt-3">
            <List
              rows={deposits.filter((d) => d.status === "rejected")}
              cur={cur}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function AdminWithdrawals() {
  const [rows, setRows] = useState<any[]>([]);
  const load = async () => {
    const { data: wdRows, error: wdError } = await supabase
      .from("withdrawals")
      .select("*")
      .order("created_at", { ascending: false });
    if (wdError) {
      toast.error(wdError.message);
      setRows([]);
      return;
    }

    const userIds = Array.from(
      new Set((wdRows ?? []).map((r: any) => r.user_id)),
    );
    const { data: users, error: usersError } = userIds.length
      ? await supabase
          .from("users")
          .select("id, phone, country, balance")
          .in("id", userIds)
      : { data: [] as any[], error: null };
    if (usersError) toast.error(usersError.message);

    const userMap = new Map((users ?? []).map((u: any) => [u.id, u]));
    setRows(
      (wdRows ?? []).map((r: any) => ({ ...r, user: userMap.get(r.user_id) })),
    );
  };
  useEffect(() => {
    load();
  }, []);

  const update = async (id: string, status: string) => {
    const { error } = await supabase
      .from("withdrawals")
      .update({ status })
      .eq("id", id);
    if (error) return toast.error(error.message);
    toast.success("Mis à jour");
    load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Retraits ({rows.length})</h1>
      <Tabs defaultValue="all">
        <TabsList className="w-full grid grid-cols-4">
          <TabsTrigger value="all">Tous</TabsTrigger>
          <TabsTrigger value="approved">Validés</TabsTrigger>
          <TabsTrigger value="rejected">Rejetés</TabsTrigger>
          <TabsTrigger value="pending">En attente</TabsTrigger>
        </TabsList>
        {[
          { key: "all", list: rows },
          {
            key: "approved",
            list: rows.filter((r) => r.status === "approved"),
          },
          {
            key: "rejected",
            list: rows.filter((r) => r.status === "rejected"),
          },
          { key: "pending", list: rows.filter((r) => r.status === "pending") },
        ].map(({ key, list }) => (
          <TabsContent key={key} value={key} className="mt-3">
            <div className="bg-card rounded-xl overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted text-left">
                  <tr>
                    <th className="p-3">Utilisateur</th>
                    <th className="p-3">Pays</th>
                    <th className="p-3">Montant</th>
                    <th className="p-3">Frais</th>
                    <th className="p-3">Net</th>
                    <th className="p-3">Opérateur</th>
                    <th className="p-3">Numéro</th>
                    <th className="p-3">Statut</th>
                    <th className="p-3">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {list.map((r) => (
                    <tr key={r.id} className="border-t border-border">
                      <td className="p-3 font-mono text-xs">
                        {r.user?.phone ?? "—"}
                      </td>
                      <td className="p-3">{r.user?.country ?? "—"}</td>
                      <td className="p-3">{formatMoney(Number(r.amount))}</td>
                      <td className="p-3 text-destructive">
                        {formatMoney(Number(r.fee))}
                      </td>
                      <td className="p-3 text-success font-bold">
                        {formatMoney(Number(r.net_amount))}
                      </td>
                      <td className="p-3">{r.operator}</td>
                      <td className="p-3 font-mono text-xs">{r.phone}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-xs ${r.status === "approved" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}
                        >
                          {r.status}
                        </span>
                      </td>
                      <td className="p-3 flex gap-1">
                        {r.status === "pending" && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => update(r.id, "approved")}
                            >
                              OK
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => update(r.id, "rejected")}
                            >
                              Rejet
                            </Button>
                          </>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminWithdrawals() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("withdrawals").select("*, users(phone, country, balance)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const update = async (id: string, status: string, refund?: any) => {
    const { error } = await supabase.from("withdrawals").update({ status }).eq("id", id);
    if (error) return toast.error(error.message);
    if (status === "rejected" && refund) {
      await supabase.from("users").update({ balance: Number(refund.users.balance) + Number(refund.amount) }).eq("id", refund.user_id);
    }
    toast.success("Mis à jour"); load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Retraits ({rows.length})</h1>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Utilisateur</th><th className="p-3">Pays</th><th className="p-3">Montant</th>
            <th className="p-3">Frais</th><th className="p-3">Net</th><th className="p-3">Opérateur</th>
            <th className="p-3">Numéro</th><th className="p-3">Statut</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{r.users?.phone}</td>
              <td className="p-3">{r.users?.country}</td>
              <td className="p-3">{formatMoney(Number(r.amount))}</td>
              <td className="p-3 text-destructive">{formatMoney(Number(r.fee))}</td>
              <td className="p-3 text-success font-bold">{formatMoney(Number(r.net_amount))}</td>
              <td className="p-3">{r.operator}</td>
              <td className="p-3 font-mono text-xs">{r.phone}</td>
              <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${r.status === "approved" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{r.status}</span></td>
              <td className="p-3 flex gap-1">
                {r.status === "pending" && <>
                  <Button size="sm" onClick={() => update(r.id, "approved")}>OK</Button>
                  <Button size="sm" variant="destructive" onClick={() => update(r.id, "rejected", r)}>Rejet</Button>
                </>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

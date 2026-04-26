import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminDeposits() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("deposits").select("*, users(phone, country, balance)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);

  const confirm = async (r: any) => {
    const { error } = await supabase.from("deposits").update({ status: "confirmed" }).eq("id", r.id);
    if (error) return toast.error(error.message);
    await supabase.from("users").update({ balance: Number(r.users.balance) + Number(r.amount) }).eq("id", r.user_id);
    toast.success("Dépôt confirmé"); load();
  };
  const reject = async (id: string) => {
    const { error } = await supabase.from("deposits").update({ status: "rejected" }).eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  const totalConfirmed = rows.filter(r => r.status === "confirmed").reduce((s, r) => s + Number(r.amount), 0);
  const totalPending = rows.filter(r => r.status === "pending").reduce((s, r) => s + Number(r.amount), 0);
  const totalRejected = rows.filter(r => r.status === "rejected").reduce((s, r) => s + Number(r.amount), 0);
  const countConfirmed = rows.filter(r => r.status === "confirmed").length;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Dépôts ({rows.length})</h1>

      <div className="grid grid-cols-4 gap-4 mb-4">
        <div className="bg-card p-4 rounded-xl">
          <p className="text-xs text-muted-foreground">Total confirmé</p>
          <p className="text-xl font-bold text-success">{formatMoney(totalConfirmed)}</p>
          <p className="text-[10px] text-muted-foreground mt-1">{countConfirmed} dépôt(s)</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-xs text-muted-foreground">En attente</p>
          <p className="text-xl font-bold text-warning">{formatMoney(totalPending)}</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-xs text-muted-foreground">Rejeté</p>
          <p className="text-xl font-bold text-destructive">{formatMoney(totalRejected)}</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-xs text-muted-foreground">Total transactions</p>
          <p className="text-xl font-bold">{rows.length}</p>
        </div>
      </div>

      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Utilisateur</th><th className="p-3">Pays</th><th className="p-3">Montant</th>
            <th className="p-3">Canal</th><th className="p-3">Référence</th><th className="p-3">Statut</th><th className="p-3">Date</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{r.users?.phone}</td>
              <td className="p-3">{r.users?.country}</td>
              <td className="p-3 font-bold">{formatMoney(Number(r.amount))}</td>
              <td className="p-3">{r.channel}</td>
              <td className="p-3 text-xs">{r.reference}</td>
              <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${r.status === "confirmed" ? "bg-success/20 text-success" : r.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-warning/20 text-warning"}`}>{r.status}</span></td>
              <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
              <td className="p-3 flex gap-1">
                {r.status === "pending" && <>
                  <Button size="sm" onClick={() => confirm(r)}>OK</Button>
                  <Button size="sm" variant="destructive" onClick={() => reject(r.id)}>Rejet</Button>
                </>}
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminUsers() {
  const [users, setUsers] = useState<any[]>([]);
  const [edit, setEdit] = useState<{ id: string; balance: number } | null>(null);

  const load = () => supabase.from("users").select("*").order("created_at", { ascending: false }).then(({ data }) => setUsers(data ?? []));
  useEffect(() => { load(); }, []);

  const updateBalance = async () => {
    if (!edit) return;
    const { error } = await supabase.from("users").update({ balance: edit.balance }).eq("id", edit.id);
    if (error) toast.error(error.message); else { toast.success("Solde mis à jour"); setEdit(null); load(); }
  };
  const toggleStatus = async (u: any) => {
    const { error } = await supabase.from("users").update({ status: u.status === "active" ? "blocked" : "active" }).eq("id", u.id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Utilisateurs ({users.length})</h1>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Téléphone</th><th className="p-3">Pays</th><th className="p-3">Code</th>
            <th className="p-3">Solde</th><th className="p-3">Revenu</th><th className="p-3">Statut</th><th className="p-3">Date</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>
            {users.map(u => (
              <tr key={u.id} className="border-t border-border">
                <td className="p-3 font-mono text-xs">{u.phone}</td>
                <td className="p-3">{u.country}</td>
                <td className="p-3 font-bold">{u.ref_code}</td>
                <td className="p-3">{edit?.id === u.id ? (
                  <Input type="number" value={edit.balance} onChange={(e) => setEdit({ id: u.id, balance: Number(e.target.value) })} className="h-8 w-28" />
                ) : formatMoney(Number(u.balance))}</td>
                <td className="p-3">{formatMoney(Number(u.total_revenue))}</td>
                <td className="p-3"><span className={`px-2 py-0.5 rounded text-xs ${u.status === "active" ? "bg-success/20 text-success" : "bg-destructive/20 text-destructive"}`}>{u.status}</span></td>
                <td className="p-3 text-xs">{new Date(u.created_at).toLocaleDateString("fr-FR")}</td>
                <td className="p-3 flex gap-2">
                  {edit?.id === u.id
                    ? <><Button size="sm" onClick={updateBalance}>OK</Button><Button size="sm" variant="outline" onClick={() => setEdit(null)}>X</Button></>
                    : <Button size="sm" variant="outline" onClick={() => setEdit({ id: u.id, balance: Number(u.balance) })}>Solde</Button>}
                  <Button size="sm" variant="outline" onClick={() => toggleStatus(u)}>{u.status === "active" ? "Bloquer" : "Débloquer"}</Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

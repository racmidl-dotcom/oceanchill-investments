import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminUserProducts() {
  const [rows, setRows] = useState<any[]>([]);
  const load = () => supabase.from("investments").select("*, users(phone), products(name)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  useEffect(() => { load(); }, []);
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("investments").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };
  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Investissements ({rows.length})</h1>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Utilisateur</th><th className="p-3">Produit</th><th className="p-3">Montant</th>
            <th className="p-3">Début</th><th className="p-3">Fin</th><th className="p-3">Gains</th><th className="p-3">Statut</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{r.users?.phone}</td>
              <td className="p-3 font-bold">{r.products?.name}</td>
              <td className="p-3">{formatMoney(Number(r.amount))}</td>
              <td className="p-3 text-xs">{new Date(r.start_date).toLocaleDateString("fr-FR")}</td>
              <td className="p-3 text-xs">{new Date(r.end_date).toLocaleDateString("fr-FR")}</td>
              <td className="p-3">{formatMoney(Number(r.earned))}</td>
              <td className="p-3">{r.status}</td>
              <td className="p-3"><Button size="sm" variant="destructive" onClick={() => del(r.id)}>Suppr</Button></td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

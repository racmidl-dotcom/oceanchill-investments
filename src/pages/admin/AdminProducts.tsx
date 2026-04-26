import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatMoney } from "@/lib/countries";

export default function AdminProducts() {
  const [items, setItems] = useState<any[]>([]);
  const load = () => supabase.from("products").select("*").order("sort_order").then(({ data }) => setItems(data ?? []));
  useEffect(() => { load(); }, []);

  const toggle = async (p: any) => {
    const { error } = await supabase.from("products").update({ active: !p.active }).eq("id", p.id);
    if (error) toast.error(error.message); else load();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message); else load();
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Produits ({items.length})</h1>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Image</th><th className="p-3">Nom</th><th className="p-3">Prix</th>
            <th className="p-3">Durée</th><th className="p-3">Rev/jour</th><th className="p-3">Total</th><th className="p-3">Actif</th><th className="p-3">Actions</th>
          </tr></thead>
          <tbody>{items.map(p => (
            <tr key={p.id} className="border-t border-border">
              <td className="p-3"><img src={p.image_url ?? ""} alt="" className="w-12 h-12 object-cover rounded" /></td>
              <td className="p-3 font-bold text-accent">{p.name}</td>
              <td className="p-3">{formatMoney(Number(p.price))}</td>
              <td className="p-3">{p.duration_days}j</td>
              <td className="p-3">{formatMoney(Number(p.daily_revenue))}</td>
              <td className="p-3">{formatMoney(Number(p.total_revenue))}</td>
              <td className="p-3">{p.active ? "✅" : "❌"}</td>
              <td className="p-3 flex gap-2">
                <Button size="sm" variant="outline" onClick={() => toggle(p)}>{p.active ? "Désactiver" : "Activer"}</Button>
                <Button size="sm" variant="destructive" onClick={() => del(p.id)}>Suppr</Button>
              </td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

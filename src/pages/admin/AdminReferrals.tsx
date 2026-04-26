import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/countries";

export default function AdminReferrals() {
  const [rows, setRows] = useState<any[]>([]);
  useEffect(() => {
    supabase.from("referrals").select("*, ref:users!referrals_referrer_id_fkey(phone), red:users!referrals_referred_id_fkey(phone)").order("created_at", { ascending: false }).then(({ data }) => setRows(data ?? []));
  }, []);

  const total = rows.reduce((s, r) => s + Number(r.commission), 0);

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Parrainages</h1>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Total relations</p><p className="text-2xl font-bold">{rows.length}</p></div>
        <div className="bg-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Commissions versées</p><p className="text-2xl font-bold text-accent">{formatMoney(total)}</p></div>
        <div className="bg-card p-4 rounded-xl"><p className="text-sm text-muted-foreground">Niveau 1</p><p className="text-2xl font-bold">{rows.filter(r => r.level === 1).length}</p></div>
      </div>
      <div className="bg-card rounded-xl overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted text-left"><tr>
            <th className="p-3">Parrain</th><th className="p-3">Filleul</th><th className="p-3">Niveau</th><th className="p-3">Commission</th><th className="p-3">Date</th>
          </tr></thead>
          <tbody>{rows.map(r => (
            <tr key={r.id} className="border-t border-border">
              <td className="p-3 font-mono text-xs">{r.ref?.phone}</td>
              <td className="p-3 font-mono text-xs">{r.red?.phone}</td>
              <td className="p-3">N{r.level}</td>
              <td className="p-3 font-bold text-accent">{formatMoney(Number(r.commission))}</td>
              <td className="p-3 text-xs">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
            </tr>
          ))}</tbody>
        </table>
      </div>
    </div>
  );
}

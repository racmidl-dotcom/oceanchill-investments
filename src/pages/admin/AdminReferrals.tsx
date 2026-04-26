import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/countries";
import { Input } from "@/components/ui/input";
import { ChevronRight, ChevronDown, Users } from "lucide-react";

type RefRow = { id: string; level: number; commission: number; created_at: string; referred_id: string; red?: { phone?: string } };
type Group = { referrer_id: string; phone: string; ref_code: string; total: number; refs: RefRow[] };

export default function AdminReferrals() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [search, setSearch] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());

  useEffect(() => {
    (async () => {
      const { data: rows } = await supabase
        .from("referrals")
        .select("*, red:users!referrals_referred_id_fkey(phone)")
        .order("created_at", { ascending: false });

      const list = rows ?? [];
      const refIds = Array.from(new Set(list.map((r: any) => r.referrer_id)));
      const { data: parents } = refIds.length
        ? await supabase.from("users").select("id, phone, ref_code").in("id", refIds)
        : { data: [] as any[] };

      const map = new Map<string, Group>();
      (parents ?? []).forEach((p: any) => {
        map.set(p.id, { referrer_id: p.id, phone: p.phone, ref_code: p.ref_code, total: 0, refs: [] });
      });
      list.forEach((r: any) => {
        const g = map.get(r.referrer_id);
        if (g) {
          g.refs.push(r);
          g.total += Number(r.commission);
        }
      });

      setGroups(Array.from(map.values()).sort((a, b) => b.total - a.total));
    })();
  }, []);

  const totalAll = useMemo(() => groups.reduce((s, g) => s + g.total, 0), [groups]);
  const totalRefs = useMemo(() => groups.reduce((s, g) => s + g.refs.length, 0), [groups]);

  const filtered = groups.filter(g =>
    !search || g.phone?.toLowerCase().includes(search.toLowerCase()) || g.ref_code?.toLowerCase().includes(search.toLowerCase())
  );

  const toggle = (id: string) => {
    setOpen(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Parrainages</h1>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Parrains actifs</p>
          <p className="text-2xl font-bold">{groups.length}</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total filleuls</p>
          <p className="text-2xl font-bold">{totalRefs}</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Commissions versées</p>
          <p className="text-2xl font-bold text-accent">{formatMoney(totalAll)}</p>
        </div>
      </div>

      <Input
        placeholder="Rechercher un parrain..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="bg-card rounded-xl divide-y divide-border">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">Aucun parrain</p>
        )}
        {filtered.map(g => {
          const isOpen = open.has(g.referrer_id);
          return (
            <div key={g.referrer_id}>
              <button
                onClick={() => toggle(g.referrer_id)}
                className="w-full flex items-center gap-3 p-4 hover:bg-muted transition text-left"
              >
                {isOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                <div className="w-9 h-9 rounded-full bg-accent/20 text-accent flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <p className="font-mono text-sm font-semibold">{g.phone}</p>
                  <p className="text-xs text-muted-foreground">Code : {g.ref_code} · {g.refs.length} filleul(s)</p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-accent">{formatMoney(g.total)}</p>
                  <p className="text-[10px] text-muted-foreground">commissions</p>
                </div>
              </button>
              {isOpen && (
                <div className="bg-muted/30 px-4 pb-3">
                  <table className="w-full text-xs">
                    <thead className="text-muted-foreground">
                      <tr>
                        <th className="text-left p-2">Filleul</th>
                        <th className="text-left p-2">Niveau</th>
                        <th className="text-left p-2">Commission</th>
                        <th className="text-left p-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {g.refs.map(r => (
                        <tr key={r.id} className="border-t border-border">
                          <td className="p-2 font-mono">{r.red?.phone ?? "—"}</td>
                          <td className="p-2">N{r.level}</td>
                          <td className="p-2 font-bold text-accent">{formatMoney(Number(r.commission))}</td>
                          <td className="p-2">{new Date(r.created_at).toLocaleDateString("fr-FR")}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

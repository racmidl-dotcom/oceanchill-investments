import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/countries";
import { Input } from "@/components/ui/input";

type RefRow = {
  id: string;
  referrer_id: string;
  referred_id: string;
  level: number;
  commission: number;
  created_at: string;
  referrer_phone?: string;
  referred_phone?: string;
};

export default function AdminReferrals() {
  const [rows, setRows] = useState<RefRow[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    (async () => {
      const { data: refRows, error: rowsError } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id, level, commission, created_at")
        .order("created_at", { ascending: false });
      if (rowsError) {
        setRows([]);
        return;
      }

      const list = refRows ?? [];
      const userIds = Array.from(
        new Set(list.flatMap((r) => [r.referrer_id, r.referred_id])),
      );
      const { data: users } = userIds.length
        ? await supabase.from("users").select("id, phone").in("id", userIds)
        : { data: [] as any[] };
      const userMap = new Map((users ?? []).map((u: any) => [u.id, u.phone]));

      setRows(
        list.map((r) => ({
          ...r,
          referrer_phone: userMap.get(r.referrer_id),
          referred_phone: userMap.get(r.referred_id),
        })),
      );
    })();
  }, []);

  const totalAll = useMemo(
    () => rows.reduce((s, r) => s + Number(r.commission), 0),
    [rows],
  );
  const totalRefs = useMemo(
    () => new Set(rows.map((r) => r.referred_id)).size,
    [rows],
  );

  const filtered = rows.filter(
    (r) =>
      !search ||
      r.referrer_phone?.toLowerCase().includes(search.toLowerCase()) ||
      r.referred_phone?.toLowerCase().includes(search.toLowerCase()) ||
      r.referrer_id.toLowerCase().includes(search.toLowerCase()) ||
      r.referred_id.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Parrainages</h1>

      <div className="grid grid-cols-3 gap-4 mb-4">
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Parrains actifs</p>
          <p className="text-2xl font-bold">
            {new Set(rows.map((r) => r.referrer_id)).size}
          </p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Total filleuls</p>
          <p className="text-2xl font-bold">{totalRefs}</p>
        </div>
        <div className="bg-card p-4 rounded-xl">
          <p className="text-sm text-muted-foreground">Commissions versées</p>
          <p className="text-2xl font-bold text-accent">
            {formatMoney(totalAll)}
          </p>
        </div>
      </div>

      <Input
        placeholder="Rechercher parrain/filleul..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      <div className="bg-card rounded-xl divide-y divide-border">
        {filtered.length === 0 && (
          <p className="p-6 text-center text-muted-foreground">
            Aucun parrainage
          </p>
        )}
        {filtered.map((r) => (
          <div key={r.id} className="p-4 border-b border-border">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground">Parrain</p>
                <p className="font-mono text-sm font-semibold">
                  {r.referrer_phone ?? r.referrer_id}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Filleul</p>
                <p className="font-mono text-sm font-semibold">
                  {r.referred_phone ?? r.referred_id}
                </p>
              </div>
            </div>
            <div className="mt-2 flex items-center gap-4 text-xs text-muted-foreground">
              <span>Niveau: N{r.level}</span>
              <span>Commission: {formatMoney(Number(r.commission))}</span>
              <span>{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

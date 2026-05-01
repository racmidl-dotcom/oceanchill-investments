import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney } from "@/lib/countries";
import { Input } from "@/components/ui/input";
import { ChevronDown, ChevronRight, Users, Gift } from "lucide-react";

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

type Referrer = {
  id: string;
  phone: string;
  filleuls: {
    level: number;
    referred_id: string;
    referred_phone: string;
    commission: number;
    created_at: string;
  }[];
  totalCommission: number;
  totalFilleuls: number;
};

export default function AdminReferrals() {
  const [rows, setRows] = useState<RefRow[]>([]);
  const [search, setSearch] = useState("");
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      setLoading(true);
      const { data: refRows, error } = await supabase
        .from("referrals")
        .select("id, referrer_id, referred_id, level, commission, created_at")
        .order("created_at", { ascending: false });

      if (error) {
        setRows([]);
        setLoading(false);
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
          referrer_phone: userMap.get(r.referrer_id) ?? r.referrer_id,
          referred_phone: userMap.get(r.referred_id) ?? r.referred_id,
        })),
      );
      setLoading(false);
    })();
  }, []);

  const referrers = useMemo(() => {
    const map = new Map<string, Referrer>();

    rows.forEach((r) => {
      if (!map.has(r.referrer_id)) {
        map.set(r.referrer_id, {
          id: r.referrer_id,
          phone: r.referrer_phone ?? r.referrer_id,
          filleuls: [],
          totalCommission: 0,
          totalFilleuls: 0,
        });
      }
      const referrer = map.get(r.referrer_id)!;
      referrer.filleuls.push({
        level: r.level,
        referred_id: r.referred_id,
        referred_phone: r.referred_phone ?? r.referred_id,
        commission: Number(r.commission),
        created_at: r.created_at,
      });
      referrer.totalCommission += Number(r.commission);
    });

    map.forEach((referrer) => {
      referrer.totalFilleuls = new Set(
        referrer.filleuls.map((f) => f.referred_id),
      ).size;
    });

    return Array.from(map.values()).sort(
      (a, b) => b.totalCommission - a.totalCommission,
    );
  }, [rows]);

  const totalCommission = useMemo(
    () => rows.reduce((s, r) => s + Number(r.commission), 0),
    [rows],
  );

  const filtered = referrers.filter(
    (r) =>
      !search ||
      r.phone.toLowerCase().includes(search.toLowerCase()) ||
      r.filleuls.some((f) =>
        f.referred_phone.toLowerCase().includes(search.toLowerCase()),
      ),
  );

  const toggle = (id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const levelColors: Record<number, string> = {
    1: "bg-yellow-100 text-yellow-800 border-yellow-300",
    2: "bg-orange-100 text-orange-800 border-orange-300",
    3: "bg-blue-100 text-blue-800 border-blue-300",
  };

  const levelLabels: Record<number, string> = {
    1: "🥇 Niveau 1",
    2: "🥈 Niveau 2",
    3: "💎 Niveau 3",
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Parrainages</h1>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Parrains actifs</p>
          <p className="text-2xl font-bold">{referrers.length}</p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">Total filleuls</p>
          <p className="text-2xl font-bold">
            {new Set(rows.map((r) => r.referred_id)).size}
          </p>
        </div>
        <div className="bg-card p-4 rounded-xl border border-border">
          <p className="text-xs text-muted-foreground mb-1">
            Commissions verses
          </p>
          <p className="text-2xl font-bold text-accent">
            {formatMoney(totalCommission)}
          </p>
        </div>
      </div>

      <Input
        placeholder="Rechercher un parrain ou filleul..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="mb-4 max-w-sm"
      />

      {loading ? (
        <p className="text-center text-muted-foreground py-8">Chargement...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center text-muted-foreground py-8">
          Aucun parrainage trouve
        </p>
      ) : (
        <div className="space-y-3">
          {filtered.map((referrer) => {
            const isOpen = expanded.has(referrer.id);

            const byLevel = new Map<number, typeof referrer.filleuls>();
            referrer.filleuls.forEach((f) => {
              if (!byLevel.has(f.level)) byLevel.set(f.level, []);
              byLevel.get(f.level)!.push(f);
            });

            return (
              <div
                key={referrer.id}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <div
                  className="flex items-center justify-between p-4 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => toggle(referrer.id)}
                >
                  <div className="flex items-center gap-3">
                    {isOpen ? (
                      <ChevronDown className="w-4 h-4 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    )}
                    <div>
                      <p className="font-semibold font-mono text-sm">
                        {referrer.phone}
                      </p>
                      <p className="text-xs text-muted-foreground">Parrain</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 text-right">
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Users className="w-3 h-3 text-muted-foreground" />
                        <p className="text-sm font-bold">
                          {referrer.totalFilleuls}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">filleuls</p>
                    </div>
                    <div>
                      <div className="flex items-center gap-1 justify-end">
                        <Gift className="w-3 h-3 text-accent" />
                        <p className="text-sm font-bold text-accent">
                          {formatMoney(referrer.totalCommission)}
                        </p>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        commissions
                      </p>
                    </div>
                  </div>
                </div>

                {isOpen && (
                  <div className="border-t border-border bg-muted/20 p-4 space-y-4">
                    {[1, 2, 3].map((level) => {
                      const filleuls = byLevel.get(level) ?? [];
                      if (filleuls.length === 0) return null;

                      const unique = Array.from(
                        new Map(
                          filleuls.map((f) => [f.referred_id, f]),
                        ).values(),
                      );

                      const levelCommission = filleuls.reduce(
                        (s, f) => s + f.commission,
                        0,
                      );

                      return (
                        <div key={level}>
                          <div className="flex items-center justify-between mb-2">
                            <span
                              className={`text-xs font-semibold px-2 py-1 rounded-full border ${levelColors[level]}`}
                            >
                              {levelLabels[level]}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {unique.length} filleul(s) {" "}
                              {formatMoney(levelCommission)}
                            </span>
                          </div>

                          <div className="bg-card rounded-lg overflow-hidden border border-border">
                            <table className="w-full text-xs">
                              <thead>
                                <tr className="bg-muted text-muted-foreground">
                                  <th className="text-left p-2 pl-3">
                                    Filleul
                                  </th>
                                  <th className="text-right p-2">Commission</th>
                                  <th className="text-right p-2 pr-3">Date</th>
                                </tr>
                              </thead>
                              <tbody>
                                {unique.map((f) => (
                                  <tr
                                    key={f.referred_id}
                                    className="border-t border-border hover:bg-muted/30"
                                  >
                                    <td className="p-2 pl-3 font-mono font-semibold">
                                      {f.referred_phone}
                                    </td>
                                    <td className="p-2 text-right font-bold text-accent">
                                      {formatMoney(f.commission)}
                                    </td>
                                    <td className="p-2 pr-3 text-right text-muted-foreground">
                                      {new Date(
                                        f.created_at,
                                      ).toLocaleDateString("fr-FR")}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

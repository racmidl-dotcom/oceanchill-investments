import { useCallback, useEffect, useMemo, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, getCountry } from "@/lib/countries";

const LEVELS = [
  {
    name: "GOLD",
    color: "from-yellow-400 to-yellow-600",
    rate: "15%",
    level: 1,
  },
  {
    name: "PLATINUM",
    color: "from-orange-300 to-orange-500",
    rate: "3%",
    level: 2,
  },
  { name: "DIAMOND", color: "from-cyan-300 to-blue-500", rate: "2%", level: 3 },
];

export default function Team() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const link = `https://www.whirlpolrefrigerateur.site/register?ref=${profile?.ref_code ?? ""}`;
  const [refs, setRefs] = useState<any[]>([]);
  const [investedMap, setInvestedMap] = useState<Record<string, number>>({});
  const [stats, setStats] = useState<{
    teamSize: number;
    totalRev: number;
    perLevel: Record<number, { count: number; rev: number }>;
  }>({ teamSize: 0, totalRev: 0, perLevel: {} });

  const load = useCallback(async () => {
    if (!profile) return;

    const { data: rows, error } = await supabase
      .from("referrals")
      .select("id, level, commission, created_at, referred_id, referrer_id")
      .eq("referrer_id", profile.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Erreur referrals:", error);
      return;
    }

    const list = rows ?? [];

    const referredIds = Array.from(
      new Set(list.map((r: any) => r.referred_id)),
    );

    let usersMap: Record<string, string> = {};
    if (referredIds.length > 0) {
      const { data: usersData } = await supabase
        .from("users")
        .select("id, phone")
        .in("id", referredIds);

      (usersData ?? []).forEach((u: any) => {
        usersMap[u.id] = u.phone;
      });
    }

    const enrichedList = list.map((r: any) => ({
      ...r,
      red: { phone: usersMap[r.referred_id] ?? null },
    }));

    setRefs(enrichedList);

    if (referredIds.length > 0) {
      const { data: invRows } = await supabase
        .from("investments")
        .select("user_id, amount")
        .in("user_id", referredIds);

      const map: Record<string, number> = {};
      (invRows ?? []).forEach((r: any) => {
        map[r.user_id] = (map[r.user_id] ?? 0) + Number(r.amount);
      });
      setInvestedMap(map);
    } else {
      setInvestedMap({});
    }

    const perLevel: Record<number, { count: number; rev: number }> = {};
    const byLevel = new Map<number, Set<string>>();
    const all = new Set<string>();

    enrichedList.forEach((r: any) => {
      const level = Number(r.level);
      if (!byLevel.has(level)) byLevel.set(level, new Set());
      byLevel.get(level)!.add(r.referred_id);
      all.add(r.referred_id);
      if (!perLevel[level]) perLevel[level] = { count: 0, rev: 0 };
      perLevel[level].rev += Number(r.commission);
    });

    byLevel.forEach((set, level) => {
      if (!perLevel[level]) perLevel[level] = { count: 0, rev: 0 };
      perLevel[level].count = set.size;
    });

    setStats({
      teamSize: all.size,
      totalRev: enrichedList.reduce(
        (s: number, r: any) => s + Number(r.commission),
        0,
      ),
      perLevel,
    });
  }, [profile, setRefs, setInvestedMap, setStats]);

  useEffect(() => {
    if (!profile) return;
    load();
    const interval = setInterval(load, 15000);
    const onFocus = () => load();
    window.addEventListener("focus", onFocus);
    const channel = supabase
      .channel(`team-referrals-${profile.id}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "referrals",
          filter: `referrer_id=eq.${profile.id}`,
        },
        () => load(),
      )
      .subscribe();
    return () => {
      clearInterval(interval);
      window.removeEventListener("focus", onFocus);
      supabase.removeChannel(channel);
    };
  }, [profile, load]);

  const groupedRefs = useMemo(() => {
    const map = new Map<
      string,
      { level: number; referred_id: string; phone?: string; commission: number }
    >();
    refs.forEach((r: any) => {
      const key = `${r.level}:${r.referred_id}`;
      const current = map.get(key) ?? {
        level: r.level,
        referred_id: r.referred_id,
        phone: r.red?.phone,
        commission: 0,
      };
      current.commission += Number(r.commission);
      if (!current.phone && r.red?.phone) current.phone = r.red.phone;
      map.set(key, current);
    });
    return Array.from(map.values()).sort((a, b) => a.level - b.level);
  }, [refs]);

  const copy = (txt: string) => {
    navigator.clipboard.writeText(txt);
    toast.success("Copié !");
  };

  return (
    <PageWrapper>
      <AppHeader />
      <div className="px-4 space-y-4">
        <div className="bg-secondary rounded-xl divide-y divide-border">
          <div className="flex items-center p-3">
            <div className="flex-1">
              <p className="font-bold tracking-wider">
                {profile?.ref_code ?? "------"}
              </p>
              <p className="text-xs text-muted-foreground">Code d'invitation</p>
            </div>
            <Button
              onClick={() => copy(profile?.ref_code ?? "")}
              className="bg-panel-dark hover:bg-panel text-panel-foreground rounded-sm h-9"
            >
              Copie
            </Button>
          </div>
          <div className="flex items-center p-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{link}</p>
              <p className="text-xs text-muted-foreground">Lien d'invitation</p>
            </div>
            <Button
              onClick={() => copy(link)}
              className="bg-panel-dark hover:bg-panel text-panel-foreground rounded-sm h-9 ml-2"
            >
              <Copy className="w-3 h-3 mr-1" />
              Copie
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-panel text-panel-foreground rounded-md p-4 relative">
            <p className="text-2xl font-bold">{stats.teamSize}</p>
            <p className="text-xs opacity-80 mt-1">Taille de l'équipe</p>
            <span className="absolute right-3 top-3 opacity-60">»</span>
          </div>
          <div className="bg-panel text-panel-foreground rounded-md p-4 relative">
            <p className="text-xl font-bold">
              {formatMoney(stats.totalRev, cur)}
            </p>
            <p className="text-xs opacity-80 mt-1">Revenu total</p>
            <span className="absolute right-3 top-3 opacity-60">»</span>
          </div>
        </div>

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="font-bold border-l-4 border-accent pl-2 mb-3">
            Commissions
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-card border border-border/40 rounded-md p-3">
              <p className="text-xs text-muted-foreground">Total commissions</p>
              <p className="text-sm font-semibold">
                {formatMoney(stats.totalRev, cur)}
              </p>
            </div>
            <div className="bg-card border border-border/40 rounded-md p-3">
              <p className="text-xs text-muted-foreground">Filleuls actifs</p>
              <p className="text-sm font-semibold">{stats.teamSize}</p>
            </div>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center">
            {LEVELS.map((lv) => {
              const s = stats.perLevel[lv.level] ?? { count: 0, rev: 0 };
              return (
                <div
                  key={lv.level}
                  className="bg-card border border-border/40 rounded-md p-2"
                >
                  <p className="text-[10px] text-muted-foreground">
                    N{lv.level}
                  </p>
                  <p className="text-xs font-semibold">
                    {formatMoney(s.rev, cur)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    {s.count} filleul(s)
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="font-bold border-l-4 border-accent pl-2 mb-3">
            Liste des filleuls
          </h3>
          {groupedRefs.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              Aucun filleul pour le moment.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="text-muted-foreground">
                  <tr>
                    <th className="text-left p-2">Filleul</th>
                    <th className="text-left p-2">Niveau</th>
                    <th className="text-left p-2">Investi</th>
                    <th className="text-left p-2">Commission</th>
                  </tr>
                </thead>
                <tbody>
                  {groupedRefs.map((r) => (
                    <tr
                      key={`${r.level}-${r.referred_id}`}
                      className="border-t border-border"
                    >
                      <td className="p-2 font-mono">{r.phone ?? "—"}</td>
                      <td className="p-2">N{r.level}</td>
                      <td className="p-2">
                        {formatMoney(investedMap[r.referred_id] ?? 0, cur)}
                      </td>
                      <td className="p-2 font-bold text-accent">
                        {formatMoney(r.commission, cur)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="font-bold border-l-4 border-accent pl-2 mb-3">
            Cadeau d'invitation
          </h3>
          <p className="text-sm text-muted-foreground mb-2">
            Lorsque vos amis s'inscrivent et investissent :
          </p>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>
              • Niveau 1 : <strong className="text-foreground">15%</strong> de
              commission
            </li>
            <li>
              • Niveau 2 : <strong className="text-foreground">3%</strong> de
              commission
            </li>
            <li>
              • Niveau 3 : <strong className="text-foreground">2%</strong> de
              commission
            </li>
            <li>• Commissions versées sur chaque dépôt confirmé.</li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
}

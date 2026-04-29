import { useEffect, useState } from "react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Copy } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { formatMoney, getCountry } from "@/lib/countries";

const LEVELS = [
  { name: "GOLD", color: "from-yellow-400 to-yellow-600", rate: "15%", level: 1 },
  { name: "PLATINUM", color: "from-orange-300 to-orange-500", rate: "3%", level: 2 },
  { name: "DIAMOND", color: "from-cyan-300 to-blue-500", rate: "2%", level: 3 },
];

export default function Team() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const link = `${window.location.origin}/register?ref=${profile?.ref_code ?? ""}`;
  const [stats, setStats] = useState<{ teamSize: number; totalRev: number; perLevel: Record<number, { count: number; rev: number }> }>({ teamSize: 0, totalRev: 0, perLevel: {} });

  useEffect(() => {
    if (!profile) return;
    supabase.from("referrals").select("*").eq("referrer_id", profile.id).then(({ data }) => {
      const refs = data ?? [];
      const perLevel: Record<number, { count: number; rev: number }> = {};
      refs.forEach((r: any) => {
        if (!perLevel[r.level]) perLevel[r.level] = { count: 0, rev: 0 };
        perLevel[r.level].count++;
        perLevel[r.level].rev += Number(r.commission);
      });
      setStats({
        teamSize: refs.length,
        totalRev: refs.reduce((s: number, r: any) => s + Number(r.commission), 0),
        perLevel,
      });
    });
  }, [profile]);

  const copy = (txt: string) => { navigator.clipboard.writeText(txt); toast.success("Copié !"); };

  return (
    <PageWrapper>
      <AppHeader />
      <div className="px-4 space-y-4">
        <div className="bg-secondary rounded-xl divide-y divide-border">
          <div className="flex items-center p-3">
            <div className="flex-1">
              <p className="font-bold tracking-wider">{profile?.ref_code ?? "------"}</p>
              <p className="text-xs text-muted-foreground">Code d'invitation</p>
            </div>
            <Button onClick={() => copy(profile?.ref_code ?? "")} className="bg-panel-dark hover:bg-panel text-panel-foreground rounded-sm h-9">Copie</Button>
          </div>
          <div className="flex items-center p-3">
            <div className="flex-1 min-w-0">
              <p className="font-bold text-sm truncate">{link}</p>
              <p className="text-xs text-muted-foreground">Lien d'invitation</p>
            </div>
            <Button onClick={() => copy(link)} className="bg-panel-dark hover:bg-panel text-panel-foreground rounded-sm h-9 ml-2"><Copy className="w-3 h-3 mr-1" />Copie</Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-panel text-panel-foreground rounded-md p-4 relative">
            <p className="text-2xl font-bold">{stats.teamSize}</p>
            <p className="text-xs opacity-80 mt-1">Taille de l'équipe</p>
            <span className="absolute right-3 top-3 opacity-60">»</span>
          </div>
          <div className="bg-panel text-panel-foreground rounded-md p-4 relative">
            <p className="text-xl font-bold">{formatMoney(stats.totalRev, cur)}</p>
            <p className="text-xs opacity-80 mt-1">Revenu total</p>
            <span className="absolute right-3 top-3 opacity-60">»</span>
          </div>
        </div>

        <div className="bg-secondary rounded-xl divide-y divide-border">
          {LEVELS.map(lv => {
            const s = stats.perLevel[lv.level] ?? { count: 0, rev: 0 };
            return (
              <div key={lv.name} className="flex items-center p-4 gap-3">
                <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${lv.color} flex items-center justify-center text-white text-[10px] font-extrabold shadow`}>{lv.name.slice(0, 4)}</div>
                <div className="flex-1 grid grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="font-bold text-sm">{lv.rate}</p>
                    <p className="text-[10px] text-muted-foreground">Taux</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{s.count}</p>
                    <p className="text-[10px] text-muted-foreground">Utilisateurs</p>
                  </div>
                  <div>
                    <p className="font-bold text-sm">{formatMoney(s.rev, cur)}</p>
                    <p className="text-[10px] text-muted-foreground">Revenu</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="bg-secondary rounded-xl p-4">
          <h3 className="font-bold border-l-4 border-accent pl-2 mb-3">Cadeau d'invitation</h3>
          <p className="text-sm text-muted-foreground mb-2">Lorsque vos amis s'inscrivent et investissent :</p>
          <ul className="text-xs text-muted-foreground space-y-1.5">
            <li>• Niveau 1 : <strong className="text-foreground">15%</strong> de commission</li>
            <li>• Niveau 2 : <strong className="text-foreground">3%</strong> de commission</li>
            <li>• Niveau 3 : <strong className="text-foreground">2%</strong> de commission</li>
            <li>• Commissions versées sur chaque dépôt confirmé.</li>
          </ul>
        </div>
      </div>
    </PageWrapper>
  );
}

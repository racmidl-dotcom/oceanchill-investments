import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Wallet, Headphones, Volume2 } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { StatCard } from "@/components/features/StatCard";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, getCountry } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";

const actions = [
  { to: "/deposit", icon: CreditCard, label: "Paiement" },
  { to: "/withdraw", icon: Wallet, label: "Retrait" },
  { to: "/support", icon: Headphones, label: "Service client" },
];

export default function Home() {
  const { profile } = useAuth();
  const cur = getCountry(profile?.country).currency;
  const [annonces, setAnnonces] = useState<string[]>([]);

  useEffect(() => {
    supabase.from("announcements").select("message").eq("active", true).then(({ data }) => {
      setAnnonces((data ?? []).map((d: any) => d.message));
    });
  }, []);

  return (
    <PageWrapper>
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* 3 actions */}
        <div className="bg-secondary rounded-xl p-4 grid grid-cols-3 gap-2">
          {actions.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex flex-col items-center gap-2 py-2 hover:opacity-80 transition">
              <Icon className="w-7 h-7 text-foreground" strokeWidth={1.7} />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>

        {/* Hero */}
        <div className="rounded-2xl overflow-hidden relative aspect-[4/3] bg-primary">
          <img
            src="https://images.unsplash.com/photo-1571175443880-49e1d25b2bc5?w=860&q=70"
            alt="Réfrigérateurs OceanProfit"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-primary/85 to-primary/40 flex flex-col justify-center px-6">
            <h2 className="text-white text-4xl font-black tracking-wide">Whirlpool</h2>
            <p className="text-white/90 text-sm mt-1">Excellence européenne · Depuis 1911</p>
            <ul className="text-white text-xs mt-3 space-y-0.5">
              <li>● Frigo combiné</li>
              <li>● Side-by-side</li>
              <li>● Mini-bar · Congélateur</li>
            </ul>
          </div>
        </div>

        {/* Ticker */}
        <div className="bg-primary text-primary-foreground rounded-lg px-3 py-2.5 flex items-center gap-3 overflow-hidden">
          <Volume2 className="w-5 h-5 text-accent shrink-0" />
          <div className="flex-1 overflow-hidden whitespace-nowrap">
            <div className="ticker-track inline-block">
              {annonces.length ? annonces.join(" · ") : "Whirlpool — Leader européen de l'électroménager depuis 1911"}
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard className="bg-primary text-primary-foreground" value={formatMoney(profile?.balance ?? 0, cur)} label="Solde du compte" />
          <StatCard className="bg-primary text-primary-foreground" value={formatMoney(profile?.total_revenue ?? 0, cur)} label="Revenu cumulé" />
        </div>

        {/* Facts */}
        <section className="text-center pt-2">
          <div className="inline-block border-2 border-primary rounded-md px-5 py-1 text-primary font-semibold text-sm">
            À propos de Whirlpool
          </div>
          <div className="grid grid-cols-3 gap-2 mt-5">
            {[
              { n: "4", l: "Pays couverts" },
              { n: "15 000+", l: "Membres actifs" },
              { n: "99%", l: "Satisfaction client" },
            ].map(f => (
              <div key={f.l}>
                <div className="text-2xl font-black text-primary">{f.n}</div>
                <div className="text-[10px] text-muted-foreground mt-1">{f.l}</div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </PageWrapper>
  );
}

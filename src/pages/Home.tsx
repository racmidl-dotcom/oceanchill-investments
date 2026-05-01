import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Send, X } from "lucide-react";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { useProducts } from "@/hooks/useProducts";
import { formatMoney, getCountry } from "@/lib/countries";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { CreditCard, Banknote, Headphones } from "lucide-react";

const TELEGRAM_URL = "https://t.me/whirlpool_officiel";

const actions = [
  { to: "/deposit", icon: CreditCard, label: "Recharger" },
  { to: "/withdraw", icon: Banknote, label: "Retirer" },
  { to: "/support", icon: Headphones, label: "Service client" },
];

export default function Home() {
  const { profile } = useAuth();
  const { data: products, loading } = useProducts();
  const cur = getCountry(profile?.country).currency;
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("whirlpool_welcome_seen");
    if (!seen) {
      const t = setTimeout(() => setShowWelcome(true), 600);
      return () => clearTimeout(t);
    }
  }, []);

  const closeWelcome = () => {
    sessionStorage.setItem("whirlpool_welcome_seen", "1");
    setShowWelcome(false);
  };

  return (
    <PageWrapper>
      <AppHeader />

      <div className="px-4 space-y-5">
        {/* Hero photo */}
        <div className="rounded-md overflow-hidden aspect-[16/10]">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=70"
            alt="Whirpol — Showroom"
            loading="eager"
            fetchPriority="high"
            className="w-full h-full object-cover"
          />
        </div>

        {/* 3 grandes tuiles taupe */}
        <div className="grid grid-cols-3 gap-2">
          {actions.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="tile-panel">
              <Icon className="w-7 h-7" strokeWidth={1.5} />
              <span className="text-[11px] font-serif font-medium tracking-wide text-center">
                {label}
              </span>
            </Link>
          ))}
        </div>

        {/* Solde / Revenu en bandeau discret */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-card border border-border/40 rounded-md px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Solde
            </p>
            <p className="text-lg font-serif font-semibold text-panel-dark mt-0.5">
              {formatMoney(profile?.balance ?? 0, cur)}
            </p>
          </div>
          <div className="bg-card border border-border/40 rounded-md px-4 py-3">
            <p className="text-[10px] uppercase tracking-widest text-muted-foreground">
              Revenu cumulé
            </p>
            <p className="text-lg font-serif font-semibold text-panel-dark mt-0.5">
              {formatMoney(profile?.total_revenue ?? 0, cur)}
            </p>
          </div>
        </div>

        {/* Grille de produits style boutique */}
        {!loading && products.length > 0 && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            {products.map((p) => (
              <Link
                key={p.id}
                to="/products"
                className="luxury-card flex flex-col"
              >
                <div className="text-center py-2 font-serif font-semibold text-sm">
                  {p.name}
                </div>
                <div className="h-40 bg-secondary">
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.name}
                      loading="lazy"
                      className="w-full h-full object-cover"
                    />
                  )}
                </div>
                <div className="p-3 space-y-0.5">
                  <p className="text-sm font-serif font-semibold">
                    {formatMoney(p.price, cur)}
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Somme du produit
                  </p>
                  <p className="text-xs mt-1">
                    <span className="text-destructive font-semibold">
                      {formatMoney(p.daily_revenue, cur)}
                    </span>
                  </p>
                  <p className="text-[10px] text-muted-foreground">
                    Revenu quotidien
                  </p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      {/* Popup d'accueil Whirpol */}
      <Dialog open={showWelcome} onOpenChange={(o) => !o && closeWelcome()}>
        <DialogContent className="max-w-sm p-0 overflow-hidden border-0 bg-card">
          <div className="relative bg-panel text-panel-foreground p-6 text-center">
            <button
              onClick={closeWelcome}
              className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/15 hover:bg-white/25 flex items-center justify-center transition"
              aria-label="Fermer"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="text-3xl font-serif font-bold tracking-wide mb-1">
              Whirpol
            </div>
            <p className="text-xs opacity-80 font-serif">
              Excellence européenne · Depuis 1911
            </p>
          </div>
          <div className="p-5 space-y-3">
            <h3 className="font-serif font-bold text-lg text-center">
              Bienvenue, investisseur
            </h3>
            <p className="text-sm text-muted-foreground text-center leading-relaxed">
              Whirpol est le leader européen de l'électroménager. Investissez
              dans nos réfrigérateurs et générez des revenus quotidiens fiables
              et sécurisés.
            </p>
            <ul className="text-xs space-y-1.5 bg-secondary rounded-md p-3">
              <li>✓ Revenus quotidiens automatiques</li>
              <li>✓ Paiements sécurisés via MoneyFusion</li>
              <li>✓ Programme de parrainage 3 niveaux</li>
              <li>✓ Support client 7j/7</li>
            </ul>
            <a
              href={TELEGRAM_URL}
              target="_blank"
              rel="noreferrer"
              onClick={closeWelcome}
              className="w-full flex items-center justify-center gap-2 h-12 rounded-sm bg-[#229ED9] hover:bg-[#1c8ec3] text-white font-semibold transition"
            >
              <Send className="w-4 h-4" />
              Rejoindre la chaîne Telegram officielle
            </a>
            <button
              onClick={closeWelcome}
              className="w-full text-xs text-muted-foreground hover:text-foreground transition py-1"
            >
              Plus tard
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </PageWrapper>
  );
}

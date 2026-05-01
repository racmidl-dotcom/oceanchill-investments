import { Link, useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { AppHeader } from "@/components/layout/AppHeader";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, getCountry } from "@/lib/countries";
import {
  ChevronRight,
  CreditCard,
  Wallet,
  FileText,
  Building2,
  Info,
  BookOpen,
  Headphones,
  BarChart3,
  Power,
} from "lucide-react";
import profileBanner from "@/assets/Capture d’écran du 2026-04-30 01-28-03.png";

const menu1 = [
  { to: "/account", icon: FileText, label: "Détails du compte" },
  { to: "/history", icon: FileText, label: "Historique des recharges" },
  { to: "/withdrawals", icon: FileText, label: "Registres de retrait" },
  { to: "/bank", icon: Building2, label: "Gestion de compte bancaire" },
];

const menu2 = [
  { to: "/about", icon: Info, label: "À propos de nous" },
  { to: "/rules", icon: BookOpen, label: "Règles de la plateforme" },
  { to: "/my-products", icon: BarChart3, label: "Mon produit acheté" },
  { to: "/support", icon: Headphones, label: "Service client" },
];

export default function Profile() {
  const { profile, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const cur = getCountry(profile?.country).currency;
  const handleLogout = async () => {
    await signOut();
    nav("/login", { replace: true });
  };

  return (
    <PageWrapper>
      <div className="px-3 pt-3 space-y-4">
        {/* Bandeau taupe header avec logo + infos compte */}
        <div
          className="relative rounded-md overflow-hidden p-5 text-panel-foreground h-36 brightness-110"
          style={{
            backgroundImage: `url(${profileBanner})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
          }}
        >
          <div className="absolute inset-0 bg-panel/30" />
          <div className="relative h-full flex items-end">
            <div className="grid grid-cols-2 gap-2 text-center pb-2 w-full">
              <div>
                <p className="text-[12px] opacity-80 font-serif">
                  Numéro de téléphone
                </p>
                <p className="font-serif font-bold text-xl mt-1">
                  {profile?.phone}
                </p>
              </div>
              <div>
                <p className="text-[12px] opacity-80 font-serif">
                  Solde du compte
                </p>
                <p className="font-serif font-bold text-xl mt-1">
                  {formatMoney(profile?.balance ?? 0, cur)}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* 2 boutons larges Recharger / Retrait */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/deposit" className="tile-panel flex-row gap-2 py-4">
            <CreditCard className="w-5 h-5" strokeWidth={1.6} />
            <span className="text-sm font-serif font-semibold">Recharger</span>
          </Link>
          <Link to="/withdraw" className="tile-panel flex-row gap-2 py-4">
            <Wallet className="w-5 h-5" strokeWidth={1.6} />
            <span className="text-sm font-serif font-semibold">Retrait</span>
          </Link>
        </div>

        {/* Bloc menu 1 — taupe avec items */}
        <div className="bg-panel text-panel-foreground rounded-md overflow-hidden">
          {menu1.map(({ to, icon: Icon, label }, i) => (
            <Link
              key={i}
              to={to}
              className="flex items-center gap-3 px-4 py-4 hover:bg-panel-dark/30 transition border-b border-white/10 last:border-0"
            >
              <Icon className="w-5 h-5 opacity-90" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-serif">{label}</span>
              <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
          ))}
        </div>

        {/* Bloc menu 2 */}
        <div className="bg-panel text-panel-foreground rounded-md overflow-hidden">
          {menu2.map(({ to, icon: Icon, label }, i) => (
            <Link
              key={i}
              to={to}
              className="flex items-center gap-3 px-4 py-4 hover:bg-panel-dark/30 transition border-b border-white/10 last:border-0"
            >
              <Icon className="w-5 h-5 opacity-90" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-serif">{label}</span>
              <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
          ))}
          {isAdmin && (
            <Link
              to="/admin/users"
              className="flex items-center gap-3 px-4 py-4 hover:bg-panel-dark/30 transition border-t border-white/10"
            >
              <BarChart3 className="w-5 h-5" strokeWidth={1.5} />
              <span className="flex-1 text-sm font-serif font-semibold">
                Panel administrateur
              </span>
              <ChevronRight className="w-5 h-5 opacity-80" />
            </Link>
          )}
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-4 hover:bg-panel-dark/30 transition border-t border-white/10"
          >
            <Power className="w-5 h-5" strokeWidth={1.5} />
            <span className="flex-1 text-sm font-serif text-left">
              Quittez l'application
            </span>
            <ChevronRight className="w-5 h-5 opacity-80" />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}

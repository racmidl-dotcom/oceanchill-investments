import { Link, useNavigate } from "react-router-dom";
import { PageWrapper } from "@/components/layout/PageWrapper";
import { useAuth } from "@/context/AuthContext";
import { formatMoney, getCountry } from "@/lib/countries";
import { Anchor, ChevronRight, CreditCard, Wallet, Calendar, Coins, Info, PlayCircle, Headphones, BarChart3, Building2, Power } from "lucide-react";

const menu = [
  { to: "/my-products", icon: Coins, label: "Le produit que vous avez acheté" },
  { to: "/about", icon: Info, label: "À propos de nous" },
  { to: "/rules", icon: PlayCircle, label: "Règles de la plateforme" },
  { to: "/support", icon: Headphones, label: "Service client" },
  { to: "/history", icon: BarChart3, label: "Historique du compte" },
  { to: "/bank", icon: Building2, label: "Gestion de compte bancaire" },
];

export default function Profile() {
  const { profile, signOut, isAdmin } = useAuth();
  const nav = useNavigate();
  const cur = getCountry(profile?.country).currency;

  const handleLogout = async () => { await signOut(); nav("/login", { replace: true }); };

  return (
    <PageWrapper>
      <header className="flex items-center justify-between px-4 pt-5 pb-3">
        <div>
          <p className="text-xs text-muted-foreground">Numéro de téléphone</p>
          <p className="font-bold">{profile?.phone}</p>
        </div>
        <div className="flex items-center gap-1.5">
          <Anchor className="w-5 h-5 text-primary" />
          <span className="font-extrabold text-primary">Ocean<span className="text-accent">Profit</span></span>
        </div>
      </header>

      <div className="px-4 space-y-4">
        <div className="bg-secondary rounded-xl p-4 grid grid-cols-3 gap-2">
          <Link to="/deposit" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center text-white"><CreditCard className="w-5 h-5" /></div>
            <span className="text-[11px] font-medium text-center">Dépôt en ligne</span>
          </Link>
          <Link to="/withdraw" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center text-white"><Wallet className="w-5 h-5" /></div>
            <span className="text-[11px] font-medium text-center">Retirer de l'argent</span>
          </Link>
          <Link to="/bank" className="flex flex-col items-center gap-2">
            <div className="w-12 h-12 rounded-full bg-destructive flex items-center justify-center text-white"><Calendar className="w-5 h-5" /></div>
            <span className="text-[11px] font-medium text-center">Enregistrer</span>
          </Link>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-stat text-stat-foreground rounded-xl p-4">
            <p className="text-lg font-bold">{formatMoney(profile?.balance ?? 0, cur)}</p>
            <p className="text-xs opacity-80 mt-1">Solde du compte</p>
          </div>
          <div className="bg-stat text-stat-foreground rounded-xl p-4">
            <p className="text-lg font-bold">{formatMoney(profile?.total_revenue ?? 0, cur)}</p>
            <p className="text-xs opacity-80 mt-1">Revenu cumulé</p>
          </div>
        </div>

        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {menu.map(({ to, icon: Icon, label }) => (
            <Link key={to} to={to} className="flex items-center gap-3 p-4 hover:bg-muted transition">
              <div className="w-9 h-9 rounded-full bg-stat text-stat-foreground flex items-center justify-center"><Icon className="w-4 h-4" /></div>
              <span className="flex-1 text-sm">{label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          ))}
          {isAdmin && (
            <Link to="/admin/users" className="flex items-center gap-3 p-4 hover:bg-muted transition">
              <div className="w-9 h-9 rounded-full bg-accent text-accent-foreground flex items-center justify-center"><BarChart3 className="w-4 h-4" /></div>
              <span className="flex-1 text-sm font-semibold text-accent">Panel administrateur</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </Link>
          )}
          <button onClick={handleLogout} className="w-full flex items-center gap-3 p-4 hover:bg-muted transition">
            <div className="w-9 h-9 rounded-full bg-stat text-stat-foreground flex items-center justify-center"><Power className="w-4 h-4" /></div>
            <span className="flex-1 text-sm text-left">Quittez l'application</span>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>
      </div>
    </PageWrapper>
  );
}

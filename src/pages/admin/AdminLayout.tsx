import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Users, Package, Wallet, CreditCard, Network, Refrigerator, ArrowLeft, Star } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

const items = [
  { to: "/admin/users", icon: Users, label: "Utilisateurs" },
  { to: "/admin/products", icon: Package, label: "Produits" },
  { to: "/admin/user-products", icon: Refrigerator, label: "Investissements" },
  { to: "/admin/promoters", icon: Star, label: "Promoteurs" },
  { to: "/admin/deposits", icon: CreditCard, label: "Dépôts" },
  { to: "/admin/withdrawals", icon: Wallet, label: "Retraits" },
  { to: "/admin/referrals", icon: Network, label: "Parrainages" },
];

export default function AdminLayout() {
  const { signOut } = useAuth();
  const nav = useNavigate();
  return (
    <div className="min-h-screen flex bg-secondary">
      <aside className="w-56 bg-primary text-primary-foreground flex flex-col">
        <div className="p-5 border-b border-white/10">
          <h2 className="font-extrabold text-lg">Whirl<span className="text-accent">pool</span></h2>
          <p className="text-xs opacity-70">Administration</p>
        </div>
        <nav className="flex-1 p-2 space-y-1">
          {items.map(({ to, icon: Icon, label }) => (
            <NavLink key={to} to={to} className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition ${isActive ? "bg-accent text-accent-foreground" : "hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 space-y-1">
          <button onClick={() => nav("/home")} className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-white/10"><ArrowLeft className="w-4 h-4" />Retour app</button>
          <button onClick={async () => { await signOut(); nav("/login"); }} className="w-full text-left px-3 py-2 rounded-lg text-sm hover:bg-white/10">Déconnexion</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
    </div>
  );
}

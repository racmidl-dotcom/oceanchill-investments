import { Home, Refrigerator, Users, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Produit", icon: Home },
  { to: "/my-products", label: "Mon produit", icon: Refrigerator },
  { to: "/team", label: "Mon équipe", icon: Users },
  { to: "/profile", label: "Le mien", icon: User },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-card border-t border-border z-40">
    <div className="grid grid-cols-4">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-3 gap-1 text-xs transition ${
              isActive ? "text-panel-dark font-serif font-semibold" : "text-muted-foreground"
            }`
          }
        >
          <Icon className="w-6 h-6" strokeWidth={1.6} />
          <span className="font-serif">{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

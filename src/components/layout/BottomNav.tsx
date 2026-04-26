import { Home, Refrigerator, Users, User } from "lucide-react";
import { NavLink } from "react-router-dom";

const items = [
  { to: "/home", label: "Maison", icon: Home },
  { to: "/products", label: "Produit", icon: Refrigerator },
  { to: "/team", label: "Équipe", icon: Users },
  { to: "/profile", label: "Le mien", icon: User },
];

export const BottomNav = () => (
  <nav className="fixed bottom-0 left-1/2 -translate-x-1/2 w-full max-w-[430px] bg-primary text-primary-foreground shadow-lg z-40">
    <div className="grid grid-cols-4">
      {items.map(({ to, label, icon: Icon }) => (
        <NavLink
          key={to}
          to={to}
          className={({ isActive }) =>
            `flex flex-col items-center justify-center py-3 gap-1 text-xs transition ${
              isActive ? "text-accent font-bold" : "text-primary-foreground/80"
            }`
          }
        >
          <Icon className="w-6 h-6" strokeWidth={1.8} />
          <span>{label}</span>
        </NavLink>
      ))}
    </div>
  </nav>
);

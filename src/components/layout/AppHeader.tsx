import { Anchor } from "lucide-react";

export const AppHeader = () => (
  <header className="flex items-center justify-center py-5 bg-background">
    <div className="flex items-center gap-2">
      <Anchor className="w-7 h-7 text-primary" strokeWidth={2.2} />
      <span className="text-2xl font-extrabold tracking-tight text-primary">
        Ocean<span className="text-accent">Profit</span>
      </span>
    </div>
  </header>
);

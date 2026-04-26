import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface Props {
  value: ReactNode;
  label: string;
  className?: string;
  arrow?: boolean;
}

export const StatCard = ({ value, label, className, arrow }: Props) => (
  <div className={cn("bg-stat text-stat-foreground rounded-xl p-4 relative overflow-hidden", className)}>
    <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent pointer-events-none" />
    <div className="relative">
      <div className="text-xl font-bold">{value}</div>
      <div className="text-xs opacity-80 mt-1">{label}</div>
      {arrow && <span className="absolute right-0 top-0 text-stat-foreground/60">»</span>}
    </div>
  </div>
);

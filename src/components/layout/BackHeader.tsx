import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/whirlpool-logo.png";

export const BackHeader = ({ title, right }: { title: string; right?: ReactNode }) => {
  const nav = useNavigate();
  return (
    <header className="bg-panel text-panel-foreground px-4 py-3 flex items-center gap-3 sticky top-0 z-30 shadow-sm">
      <button onClick={() => nav(-1)} aria-label="Retour" className="p-1 -ml-1">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="flex-1 text-center text-base font-serif font-semibold tracking-wide">{title}</h1>
      <div className="w-8 flex justify-end">{right ?? <img src={logo} alt="" className="h-6 w-auto opacity-90" />}</div>
    </header>
  );
};

import { ChevronLeft } from "lucide-react";
import { ReactNode } from "react";
import { useNavigate } from "react-router-dom";

export const BackHeader = ({ title, right }: { title: string; right?: ReactNode }) => {
  const nav = useNavigate();
  return (
    <header className="bg-stat text-stat-foreground rounded-b-2xl px-4 py-4 flex items-center gap-3 sticky top-0 z-30">
      <button onClick={() => nav(-1)} aria-label="Retour" className="p-1 -ml-1">
        <ChevronLeft className="w-6 h-6" />
      </button>
      <h1 className="flex-1 text-center text-lg font-semibold">{title}</h1>
      <div className="w-8 flex justify-end">{right}</div>
    </header>
  );
};

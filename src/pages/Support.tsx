import { BackHeader } from "@/components/layout/BackHeader";
import { ChevronRight, Send } from "lucide-react";
import logo from "@/assets/whirlpool-logo.png";

const LINKS = [
  { label: "Service client", href: "https://t.me/" },
  { label: "Chaîne", href: "https://t.me/" },
  { label: "Groupe", href: "https://t.me/" },
];

const NOTES = [
  "Horaires d'ouverture : 9h - 20h (lundi au samedi).",
  "Préparez votre numéro de téléphone et la référence de transaction.",
  "Pour les retraits : délai de traitement jusqu'à 24h.",
  "En cas de problème de paiement, contactez le service client immédiatement.",
];

export default function Support() {
  return (
    <div className="app-shell">
      <BackHeader title="Service client" />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-xl overflow-hidden h-32 relative">
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=60" alt="" loading="lazy" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-primary/80 flex items-center justify-center">
            <img src={logo} alt="Whirlpool" className="h-10 w-auto brightness-0 invert" />
          </div>
        </div>

        <div className="flex justify-center">
          <span className="bg-panel text-panel-foreground rounded-full px-4 py-1 text-sm font-medium">9:00 — 20:00</span>
        </div>

        <div className="bg-secondary rounded-xl divide-y divide-border">
          {LINKS.map(l => (
            <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-3 p-4">
              <div className="w-9 h-9 rounded-full bg-[#229ED9] flex items-center justify-center text-white"><Send className="w-4 h-4" /></div>
              <span className="flex-1 text-sm">{l.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </a>
          ))}
        </div>

        <ol className="text-xs text-muted-foreground space-y-1.5 list-decimal pl-5">
          {NOTES.map(n => <li key={n}>{n}</li>)}
        </ol>
      </div>
    </div>
  );
}

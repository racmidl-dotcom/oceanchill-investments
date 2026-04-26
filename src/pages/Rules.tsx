import { BackHeader } from "@/components/layout/BackHeader";

const RULES = [
  "Dépôt minimum : 5 000 XOF.",
  "Retrait minimum : 1 500 XOF.",
  "Frais de retrait : 18%.",
  "Le retrait nécessite au moins un produit actif.",
  "Les commissions sont versées sur les dépôts confirmés uniquement.",
  "Toute fraude entraîne une suspension définitive du compte.",
  "Notre personnel officiel ne demande jamais votre mot de passe.",
  "Les fonds investis ne sont pas remboursables avant échéance.",
];

export default function Rules() {
  return (
    <div className="app-shell">
      <BackHeader title="Règles de la plateforme" />
      <div className="px-4 mt-6">
        <ol className="space-y-3 list-decimal pl-5 text-sm leading-relaxed">
          {RULES.map(r => <li key={r}>{r}</li>)}
        </ol>
      </div>
    </div>
  );
}

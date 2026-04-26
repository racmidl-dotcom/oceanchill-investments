import { BackHeader } from "@/components/layout/BackHeader";
import { COUNTRIES } from "@/lib/countries";

export default function About() {
  return (
    <div className="app-shell">
      <BackHeader title="À propos de nous" />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-xl overflow-hidden h-44">
          <img src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=70" loading="lazy" alt="" className="w-full h-full object-cover" />
        </div>
        <h2 className="text-xl font-bold text-primary">OceanProfit</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          OceanProfit est une plateforme d'investissement participatif spécialisée dans la vente de réfrigérateurs en Afrique de l'Ouest. Nos partenariats avec les plus grands distributeurs nous permettent de redistribuer les bénéfices à nos investisseurs sous forme de revenus quotidiens.
        </p>

        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p><strong>Date de création :</strong> 2024</p>
          <p><strong>Mission :</strong> Démocratiser l'investissement dans l'électroménager.</p>
          <p><strong>Valeurs :</strong> Transparence, fiabilité, rentabilité.</p>
          <p><strong>Pays couverts :</strong></p>
          <div className="flex gap-3 pt-1">
            {COUNTRIES.map(c => <span key={c.code} className="text-2xl" title={c.name}>{c.flag}</span>)}
          </div>
        </div>
      </div>
    </div>
  );
}

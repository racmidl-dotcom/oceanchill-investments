import { BackHeader } from "@/components/layout/BackHeader";
import { COUNTRIES } from "@/lib/countries";

export default function About() {
  return (
    <div className="app-shell">
      <BackHeader title="À propos de nous" />
      <div className="px-4 mt-4 space-y-4">
        <div className="rounded-xl overflow-hidden h-44">
          <img
            src="https://images.unsplash.com/photo-1556910103-1c02745aae4d?w=860&q=70"
            loading="lazy"
            alt=""
            className="w-full h-full object-cover"
          />
        </div>
        <h2 className="text-xl font-bold text-primary">Whirpol</h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Whirpol est une multinationale americaine fondée en 1911, leader
          mondial de l'électroménager et notamment de la réfrigération. Notre
          programme de vente de refrigerateurde vente de refrigerateur permettra
          a plusieurs menages africains d'acceder a des refrigerateurs de
          qualité, tout en leur offrant une opportunité d'investissement
          rentable et durable.
        </p>

        <div className="bg-secondary rounded-xl p-4 space-y-2 text-sm">
          <p>
            <strong>Fondée en :</strong> 1911
          </p>
          <p>
            <strong>Siège :</strong> Europe
          </p>
          <p>
            <strong>Mission :</strong> Innovation et excellence dans
            l'électroménager.
          </p>
          <p>
            <strong>Valeurs :</strong> Qualité, fiabilité, durabilité.
          </p>
          <p>
            <strong>Pays couverts :</strong>
          </p>
          <div className="flex gap-3 pt-1">
            {COUNTRIES.map((c) => (
              <span key={c.code} className="text-2xl" title={c.name}>
                {c.flag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

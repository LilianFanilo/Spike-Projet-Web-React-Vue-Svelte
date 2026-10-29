// Dashboard généré à partir du message de bienvenue (FR-010 à FR-014, FR-045).

import { declencherAlerte } from "../live/connexion.ts";
import { useLive } from "../live/store.ts";
import { Champ } from "./Champ.tsx";

export function Dashboard() {
  const vars = useLive((s) => s.vars);
  const connected = useLive((s) => s.connected);
  return (
    <main className="dashboard" data-connection={connected ? "on" : "off"}>
      <h1>Overlays live</h1>
      <p className={connected ? "statut on" : "statut off"}>{connected ? "Connecté" : "Déconnecté"}</p>
      <div className="champs">
        {vars.map((def) => (
          <Champ key={def.id} def={def} />
        ))}
      </div>
      <button type="button" data-action="alerte" onClick={declencherAlerte}>
        Alerte
      </button>
    </main>
  );
}

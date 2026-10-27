// Repli 2D (FR-033) : remplace l'élément couleur de la scène et continue de suivre la variable.

import { serialize } from "@shared/protocol.ts";
import { useLive } from "../live/store.ts";

export function Repli() {
  const couleur = useLive((s) => s.values.couleur);
  return (
    <div
      className="repli"
      data-var="couleur"
      data-value={couleur !== undefined ? serialize("color", couleur) : undefined}
    >
      <div className="repli-forme" style={{ background: typeof couleur === "string" ? couleur : undefined }} />
      3D indisponible
    </div>
  );
}

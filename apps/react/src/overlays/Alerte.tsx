// Enveloppe animée des overlays 2D : changer de key remonte l'élément et relance la keyframe (US2-5).

import type { ReactNode } from "react";
import { useLive } from "../live/store.ts";

export function Alerte({ children }: { children: ReactNode }) {
  const alerte = useLive((s) => s.alerte);
  return (
    <div key={alerte.seq} className={alerte.active ? "anim alerte" : "anim"}>
      {children}
    </div>
  );
}

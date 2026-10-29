// Overlay B : bandeau « EN DIRECT », toujours présent dans le DOM, masqué selon `bandeau` (FR-021, FR-040).

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { serialize } from "@shared/protocol.ts";
import { demarrer } from "../live/connexion.ts";
import { useLive } from "../live/store.ts";
import { Alerte } from "./Alerte.tsx";
import "./overlay.css";

function OverlayB() {
  const bandeau = useLive((s) => s.values.bandeau);
  const active = useLive((s) => s.alerte.active);
  return (
    <div className="overlay overlay-b" data-alert={active ? "on" : "off"}>
      <Alerte>
        {bandeau !== undefined && (
          <div className="bandeau" data-var="bandeau" data-value={serialize("boolean", bandeau)} hidden={bandeau !== true}>
            EN DIRECT
          </div>
        )}
      </Alerte>
    </div>
  );
}

demarrer("overlay", "overlay-b");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OverlayB />
  </StrictMode>,
);

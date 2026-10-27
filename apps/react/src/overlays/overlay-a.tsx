// Overlay A : titre et score (FR-021, FR-040 à FR-042).

import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { serialize } from "@shared/protocol.ts";
import { demarrer } from "../live/connexion.ts";
import { useLive } from "../live/store.ts";
import { Alerte } from "./Alerte.tsx";
import "./overlay.css";

function OverlayA() {
  const titre = useLive((s) => s.values.titre);
  const score = useLive((s) => s.values.score);
  const active = useLive((s) => s.alerte.active);
  return (
    <div className="overlay overlay-a" data-alert={active ? "on" : "off"}>
      <Alerte>
        {titre !== undefined && (
          <div className="titre" data-var="titre" data-value={serialize("text", titre)}>
            {String(titre)}
          </div>
        )}
        {score !== undefined && (
          <div className="score" data-var="score" data-value={serialize("number", score)}>
            {String(score)}
          </div>
        )}
      </Alerte>
    </div>
  );
}

demarrer("overlay", "overlay-a");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <OverlayA />
  </StrictMode>,
);

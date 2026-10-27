import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { demarrer } from "../live/connexion.ts";
import { Overlay3D } from "./Overlay3D.tsx";
import "../overlays/overlay.css";
import "./overlay-3d.css";

// Le compteur FPS (?debug=1) est démarré par connect({ name }) : rien à ajouter ici (FR-034).
demarrer("overlay", "overlay-3d");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Overlay3D />
  </StrictMode>,
);

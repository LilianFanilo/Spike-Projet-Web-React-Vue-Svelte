import "../styles/overlay.css";
import { demarrer } from "../live/connexion.ts";
import Overlay3D from "./Overlay3D.vue";

// Le compteur FPS (?debug=1) est démarré par @shared/client.ts.
demarrer(Overlay3D, { role: "overlay", name: "overlay-3d" });

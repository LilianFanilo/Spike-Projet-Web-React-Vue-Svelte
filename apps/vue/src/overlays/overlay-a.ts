import "../styles/overlay.css";
import { demarrer } from "../live/connexion.ts";
import OverlayA from "./OverlayA.vue";

demarrer(OverlayA, { role: "overlay", name: "overlay-a" });

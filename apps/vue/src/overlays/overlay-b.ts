import "../styles/overlay.css";
import { demarrer } from "../live/connexion.ts";
import OverlayB from "./OverlayB.vue";

demarrer(OverlayB, { role: "overlay", name: "overlay-b" });

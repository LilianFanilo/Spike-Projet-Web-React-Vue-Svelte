import "./dashboard.css";
import { demarrer } from "../live/connexion.ts";
import Dashboard from "./Dashboard.vue";

demarrer(Dashboard, { role: "dashboard" });

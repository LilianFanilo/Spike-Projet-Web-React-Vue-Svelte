import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { demarrer } from "../live/connexion.ts";
import { Dashboard } from "./Dashboard.tsx";
import "./dashboard.css";

demarrer("dashboard");

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <Dashboard />
  </StrictMode>,
);

// Overlay 3D : racine data-alert, détection WebGL et repli (FR-033, contrat pages-react.md).

import { serialize } from "@shared/protocol.ts";
import { useLive } from "../live/store.ts";
import { LimiteErreur } from "./LimiteErreur.tsx";
import { Repli } from "./Repli.tsx";
import { Scene } from "./Scene.tsx";

function detecterWebGL(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) !== null;
  } catch {
    return false;
  }
}

const webglDisponible = detecterWebGL();

export function Overlay3D() {
  const vitesse = useLive((s) => s.values.vitesse);
  const active = useLive((s) => s.alerte.active);
  return (
    <div className="overlay" data-alert={active ? "on" : "off"}>
      <div className="scene">
        {vitesse !== undefined && <span hidden data-var="vitesse" data-value={serialize("speed", vitesse)} />}
        {webglDisponible ? (
          <LimiteErreur repli={<Repli />}>
            <Scene />
          </LimiteErreur>
        ) : (
          <Repli />
        )}
      </div>
    </div>
  );
}

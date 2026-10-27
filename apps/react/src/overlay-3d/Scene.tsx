// Scène R3F transparente ; l'élément couleur reste hors du Suspense pour exister avant la fin du chargement.

import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { serialize } from "@shared/protocol.ts";
import { useLive } from "../live/store.ts";
import { Modele } from "./Modele.tsx";

export function Scene() {
  const couleur = useLive((s) => s.values.couleur);
  return (
    <>
      {couleur !== undefined && <span hidden data-var="couleur" data-value={serialize("color", couleur)} />}
      <Canvas camera={{ position: [0, 0, 4], fov: 50 }}>
        <ambientLight intensity={0.6} />
        <directionalLight position={[2, 3, 4]} intensity={1.2} />
        <Suspense fallback={null}>
          <Modele />
        </Suspense>
      </Canvas>
    </>
  );
}

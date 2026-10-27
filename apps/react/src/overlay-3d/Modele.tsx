// Suzanne en rotation continue, avec l'animation d'alerte calculée à la main (FR-030 à FR-032, research R6).

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import { useGLTF } from "@react-three/drei";
import type { BufferGeometry, Mesh } from "three";
import modelUrl from "@shared/assets/model.glb?url";
import { ALERT_DURATION_MS } from "@shared/protocol.ts";
import { useLive } from "../live/store.ts";

const TOUR = 2 * Math.PI;
const DUREE_S = ALERT_DURATION_MS / 1000;

export function Modele() {
  const { scene } = useGLTF(modelUrl);
  const geometrie = useMemo(() => {
    let trouvee: BufferGeometry | undefined;
    scene.traverse((objet) => {
      if (!trouvee && (objet as Mesh).isMesh) trouvee = (objet as Mesh).geometry;
    });
    return trouvee;
  }, [scene]);
  const valeur = useLive((s) => s.values.couleur);
  const couleur = typeof valeur === "string" ? valeur : "#ffffff";

  const ref = useRef<Mesh>(null);
  const angle = useRef(0);
  const dernierSeq = useRef(0);
  const debut = useRef(-Infinity);

  // État lu par getState() : pas de rendu React à chaque image (mises à jour transitoires, doc R3F).
  useFrame((state, delta) => {
    const mesh = ref.current;
    if (!mesh) return;
    const { values, alerte } = useLive.getState();
    const vitesse = typeof values.vitesse === "number" ? values.vitesse : 0;
    angle.current += vitesse * TOUR * delta;

    if (alerte.seq !== dernierSeq.current && alerte.seq > 0) {
      dernierSeq.current = alerte.seq;
      debut.current = state.clock.elapsedTime;
    }
    const p = (state.clock.elapsedTime - debut.current) / DUREE_S;
    if (p >= 0 && p < 1) {
      const e = 1 - (1 - p) ** 3;
      mesh.position.y = 0.5 * Math.sin(Math.PI * e);
      mesh.rotation.y = angle.current + 2 * TOUR * e;
    } else {
      mesh.position.y = 0;
      mesh.rotation.y = angle.current;
    }
  });

  return (
    <mesh ref={ref} geometry={geometrie}>
      <meshStandardMaterial color={couleur} />
    </mesh>
  );
}

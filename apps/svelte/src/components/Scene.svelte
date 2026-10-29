<script lang="ts">
  // Contenu du Canvas Threlte (US3) : rotation continue pilotée, saut et 2 tours à l'alerte (FR-030 à FR-032).
  import { ALERT_DURATION_MS } from "@shared/protocol.ts";
  import { T, useTask } from "@threlte/core";
  import type { BufferGeometry, Mesh } from "three";
  import type { Live } from "../lib/live.svelte.ts";

  interface Props {
    geometry: BufferGeometry;
    live: Live;
  }

  let { geometry, live }: Props = $props();

  let mesh = $state<Mesh>();
  let angle = 0;

  const couleur = $derived(String(live.values.couleur ?? "#ffffff"));

  // L'objet est modifié directement à chaque image, sans repasser par les props.
  useTask((delta) => {
    if (!mesh) return;
    angle += Number(live.values.vitesse ?? 0) * 2 * Math.PI * delta;
    const t = (performance.now() - live.debut) / ALERT_DURATION_MS;
    if (t >= 0 && t < 1) {
      const e = 1 - (1 - t) ** 3; // ease-out
      mesh.position.y = 0.5 * Math.sin(Math.PI * e);
      mesh.rotation.y = angle + 4 * Math.PI * e;
    } else {
      mesh.position.y = 0;
      mesh.rotation.y = angle;
    }
  });
</script>

<T.PerspectiveCamera makeDefault position={[0, 0, 4]} />
<T.AmbientLight intensity={0.6} />
<T.DirectionalLight position={[3, 4, 5]} intensity={2} />

<T.Mesh {geometry} bind:ref={mesh}>
  <T.MeshStandardMaterial color={couleur} roughness={0.5} metalness={0} />
</T.Mesh>

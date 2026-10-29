<script lang="ts">
  // Overlay 3D (US3) : scène Threlte, ou repli 2D sans WebGL ou sans modèle (FR-033, research R8 et R9).
  import modelUrl from "@shared/assets/model.glb?url";
  import { serialize } from "@shared/protocol.ts";
  import { Canvas } from "@threlte/core";
  import type { BufferGeometry, Mesh } from "three";
  import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
  import { Live } from "../lib/live.svelte.ts";
  import { webglDisponible } from "../lib/webgl.ts";
  import Scene from "./Scene.svelte";

  const live = new Live({ role: "overlay", name: "overlay-3d" });

  const webgl = webglDisponible();
  let repli = $state(!webgl);
  let geometry = $state.raw<BufferGeometry | null>(null);

  // Le modèle est chargé hors du Canvas : un échec bascule en repli, sans rejet non géré.
  if (webgl) {
    new GLTFLoader()
      .loadAsync(modelUrl)
      .then((gltf) => {
        const mesh = gltf.scene.getObjectByProperty("isMesh", true) as Mesh | undefined;
        if (mesh) geometry = mesh.geometry;
        else repli = true;
      })
      .catch(() => {
        repli = true;
      });
  }

  const couleur = $derived(String(live.values.couleur ?? ""));
  const vitesse = $derived(Number(live.values.vitesse ?? 0));
</script>

<main data-alert={live.alerte.actif ? "on" : "off"}>
  {#if live.ready}
    <div class="scene">
      {#if repli}
        <div class="repli" data-var="couleur" data-value={serialize("color", couleur)}>
          <div class="disque" style:background={couleur}></div>
          3D indisponible
        </div>
      {:else}
        <span hidden data-var="couleur" data-value={serialize("color", couleur)}></span>
        {#if geometry}
          <Canvas>
            <Scene {geometry} {live} />
          </Canvas>
        {/if}
      {/if}
      <span hidden data-var="vitesse" data-value={serialize("speed", vitesse)}></span>
    </div>
  {/if}
</main>

<style>
  .scene {
    position: relative;
    width: 1920px;
    height: 1080px;
  }

  .repli {
    position: absolute;
    top: 50%;
    left: 50%;
    translate: -50% -50%;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 24px;
    color: #fff;
    font-size: 48px;
    font-weight: 700;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.8);
  }

  .disque {
    width: 240px;
    height: 240px;
    border-radius: 50%;
  }
</style>

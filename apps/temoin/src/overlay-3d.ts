// Overlay 3D témoin : pas de librairie 3D. Il efface un contexte WebGL avec la couleur courante,
// juste assez pour valider les tests (contrat DOM, repli, compteur FPS), pas le rendu du modèle.
import "./style.css";
import modelUrl from "@shared/assets/model.glb?url";
import { connect } from "@shared/client.ts";
import { serialize, type VarValue } from "@shared/protocol.ts";
import { jouerAlerte } from "./alerte.ts";

const app = document.querySelector<HTMLElement>("#app")!;
app.dataset.alert = "off";

let couleur = "#000000";
let enAlerte = false;

async function webglDisponible(canvas: HTMLCanvasElement): Promise<WebGLRenderingContext | WebGL2RenderingContext | null> {
  try {
    const res = await fetch(modelUrl);
    if (!res.ok) return null;
    await res.arrayBuffer();
  } catch {
    return null;
  }
  return canvas.getContext("webgl2") ?? canvas.getContext("webgl");
}

const canvas = document.createElement("canvas");
canvas.width = 1920;
canvas.height = 1080;
const gl = await webglDisponible(canvas);

const vitesseEl = document.createElement("span");
vitesseEl.className = "cache";
vitesseEl.dataset.var = "vitesse";

let couleurEl: HTMLElement;
let disque: HTMLElement | null = null;

if (gl) {
  const scene = document.createElement("div");
  scene.className = "scene";
  couleurEl = document.createElement("span");
  couleurEl.className = "cache";
  couleurEl.dataset.var = "couleur";
  scene.append(canvas, couleurEl, vitesseEl);
  app.append(scene);

  const frame = (now: number): void => {
    const [r, g, b] = [1, 3, 5].map((i) => parseInt(couleur.slice(i, i + 2), 16) / 255);
    const eclat = enAlerte ? 1 + Math.abs(Math.sin(now / 120)) : 1;
    gl.clearColor(Math.min(r * eclat, 1), Math.min(g * eclat, 1), Math.min(b * eclat, 1), 0.6);
    gl.clear(gl.COLOR_BUFFER_BIT);
    requestAnimationFrame(frame);
  };
  requestAnimationFrame(frame);
} else {
  // Repli : l'élément couleur du repli remplace celui de la scène (règle d'unicité du contrat).
  couleurEl = document.createElement("div");
  couleurEl.className = "repli";
  couleurEl.dataset.var = "couleur";
  disque = document.createElement("div");
  disque.className = "disque";
  const texte = document.createElement("span");
  texte.textContent = "3D indisponible";
  couleurEl.append(disque, texte);
  app.append(couleurEl, vitesseEl);
}

function appliquer(id: string, value: VarValue): void {
  if (id === "couleur") {
    couleur = String(value).toLowerCase();
    couleurEl.dataset.value = serialize("color", value);
    if (disque) disque.style.background = couleur;
  } else if (id === "vitesse") {
    vitesseEl.dataset.value = serialize("speed", value);
  }
}

connect({
  role: "overlay",
  name: "overlay-3d",
  onWelcome(_vars, values) {
    appliquer("couleur", values.couleur);
    appliquer("vitesse", values.vitesse);
  },
  onUpdate: appliquer,
  onAlert: () => jouerAlerte(app, disque ? [couleurEl] : [], (actif) => (enAlerte = actif)),
  onStatus() {},
});

// Détection de la 3D avant de monter le Canvas (FR-033, research R9).
export function webglDisponible(): boolean {
  try {
    const canvas = document.createElement("canvas");
    return (canvas.getContext("webgl2") ?? canvas.getContext("webgl")) !== null;
  } catch {
    return false;
  }
}

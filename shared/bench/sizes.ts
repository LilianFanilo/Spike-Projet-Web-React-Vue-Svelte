// Poids gzip de chaque page au chargement initial, via le manifeste Vite (research R9).
// Usage : npm run poids -- --framework react   (après npm run build dans apps/react)

import { existsSync, readFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { fileURLToPath } from "node:url";
import { option, record, type Framework } from "./record.ts";

interface Chunk {
  file: string;
  imports?: string[];
  dynamicImports?: string[];
  css?: string[];
}

const framework = option("framework") as Framework;
const app = framework === "temoin-defaut" ? "temoin" : framework;
const dist = fileURLToPath(new URL(`../../apps/${app}/dist/`, import.meta.url));
const manifestPath = `${dist}.vite/manifest.json`;
if (!existsSync(manifestPath)) {
  console.error(`Manifeste introuvable : ${manifestPath}\nConstruire l'app (npm run build) avec build.manifest: true.`);
  process.exit(1);
}
const manifest: Record<string, Chunk> = JSON.parse(readFileSync(manifestPath, "utf8"));

const gz = (file: string) => gzipSync(readFileSync(dist + file)).length;

/** Fichiers JS et CSS atteints depuis `keys` en suivant les imports (statiques, ou dynamiques). */
function fermeture(keys: string[], suivreDynamiques: boolean): Set<string> {
  const vus = new Set<string>();
  const fichiers = new Set<string>();
  const pile = [...keys];
  while (pile.length) {
    const key = pile.pop()!;
    if (vus.has(key)) continue;
    vus.add(key);
    const chunk = manifest[key];
    if (!chunk || chunk.file.endsWith(".glb")) continue;
    fichiers.add(chunk.file);
    for (const css of chunk.css ?? []) fichiers.add(css);
    pile.push(...(chunk.imports ?? []));
    if (suivreDynamiques) pile.push(...(chunk.dynamicImports ?? []));
  }
  return fichiers;
}

const PAGES = ["dashboard", "overlay-a", "overlay-b", "overlay-3d"];
const ko = (octets: number) => Number((octets / 1024).toFixed(2));
const lignes: Record<string, { initialKo: number; differeKo: number }> = {};

for (const page of PAGES) {
  const key = `${page}.html`;
  if (!manifest[key]) {
    console.error(`Entrée ${key} absente du manifeste (4 entrées attendues, voir contracts/integration-apps.md).`);
    process.exit(1);
  }
  const initial = fermeture([key], false);
  const total = fermeture([key], true);
  const differe = [...total].filter((f) => !initial.has(f));
  const initialOctets = gz(key) + [...initial].reduce((s, f) => s + gz(f), 0);
  const differeOctets = differe.reduce((s, f) => s + gz(f), 0);
  lignes[page] = { initialKo: ko(initialOctets), differeKo: ko(differeOctets) };
  record({
    framework,
    mesure: `poids-${page}`,
    valeur: ko(initialOctets),
    unite: "Ko",
    details: { differeKo: ko(differeOctets), fichiers: [key, ...initial], differes: differe },
  });
}
console.table(lignes);

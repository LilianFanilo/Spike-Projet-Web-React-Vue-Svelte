// Génère results/grille.md à partir de la dernière entrée valide de chaque (framework, mesure).
// Usage : npm run grille

import { writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { derniere, lire, type EntreeMesure } from "./record.ts";

const COLONNES = ["react", "vue", "svelte", "temoin"] as const;
const NOMS: Record<string, string> = { react: "React", vue: "Vue", svelte: "Svelte", temoin: "Témoin (hors barème)" };
const fichier = lire();

type Cellule = (fw: string) => string;

const get = (fw: string, mesure: string): EntreeMesure | undefined => derniere(fichier, fw, mesure);
const val = (mesure: string, suffixe = ""): Cellule => (fw) => {
  const e = get(fw, mesure);
  return e ? `${e.valeur}${suffixe}` : "—";
};
const net = (mesure: string): Cellule => (fw) => {
  const e = get(fw, mesure);
  if (!e) return "—";
  return e.net !== undefined ? `${e.net} (brut ${e.valeur})` : `${e.valeur} (brut, sans référence)`;
};

/** Nombre de campagnes e2e jusqu'à la première entièrement au vert (historique complet). */
const passages: Cellule = (fw) => {
  const campagnes = fichier.entrees.filter((e) => e.framework === fw && e.mesure === "e2e");
  const i = campagnes.findIndex((e) => e.details.echoues === 0);
  if (campagnes.length === 0) return "—";
  return i >= 0 ? String(i + 1) : `pas encore au vert (${campagnes.length})`;
};

const criteres: Cellule = (fw) => {
  const e = get(fw, "e2e");
  if (!e) return "—";
  const echoues = Number(e.details.echoues);
  return `${e.valeur}/${e.valeur + echoues}`;
};

const fpsRatio: Cellule = (fw) => {
  const e = get(fw, "fps-min");
  if (!e) return "—";
  const ratio = e.details.ratio;
  return ratio !== undefined ? `${e.valeur} fps (${ratio} du plafond)` : `${e.valeur} fps`;
};

const LIGNES: [string, string, Cellule][] = [
  ["Critères d'acceptation validés", "Suite E2E partagée", criteres],
  ["Passages E2E avant le vert", "Historique des campagnes", passages],
  ["Lignes de code", "cloc sur src/", val("lignes")],
  ["Poids de l'overlay 2D (Ko gzip)", "Overlay A, chargement initial", val("poids-overlay-a")],
  ["Poids de l'overlay B (Ko gzip)", "Chargement initial", val("poids-overlay-b")],
  ["Poids de l'overlay 3D (Ko gzip)", "Chargement initial", val("poids-overlay-3d")],
  ["Poids du dashboard (Ko gzip)", "Chargement initial", val("poids-dashboard")],
  ["CPU net d'OBS au repos (%)", "cpu.ps1 -Scenario repos", net("cpu-repos")],
  ["CPU net d'OBS pendant les alertes (%)", "cpu.ps1 -Scenario alertes", net("cpu-alertes")],
  ["CPU net, overlay 3D (%)", "cpu.ps1 -Scenario 3d", net("cpu-3d")],
  ["GPU net, overlay 3D (%)", "cpu.ps1 -Scenario 3d", net("gpu-3d")],
  ["FPS minimum de la 3D", "Compteur partagé, 1 min", fpsRatio],
  ["Latence médiane (ms)", "Service → overlay peint", val("latence-mediane")],
  ["Latence p95 (ms)", "Service → overlay peint", val("latence-p95")],
];

const entete = `| Mesure | Comment | ${COLONNES.map((c) => NOMS[c]).join(" | ")} |`;
const sep = `| --- | --- | ${COLONNES.map(() => "---").join(" | ")} |`;
const corps = LIGNES.map(([nom, comment, cell]) => `| ${nom} | ${comment} | ${COLONNES.map((fw) => cell(fw)).join(" | ")} |`);

const md = `# Grille de résultats du spike

Générée par \`npm run grille\` le ${new Date().toISOString()} à partir de \`results/mesures.json\` (dernière entrée valide de chaque mesure).

${entete}
${sep}
${corps.join("\n")}

Notes :
- La latence couvre le trajet **service → overlay peint**. Le saut dashboard → service est identique pour les trois frameworks et n'est pas mesuré.
- CPU et GPU sont **nets** de la référence (OBS sur une scène vide), en % de la machine entière.
- Le temps d'implémentation, les corrections manuelles et le ressenti sont dans \`results/journal-<fw>.md\`.
- Conversion en notes : \`results/bareme.md\`.
`;

const out = fileURLToPath(new URL("../../results/grille.md", import.meta.url));
writeFileSync(out, md);
console.log(`Grille écrite : ${out}`);

// Point d'écriture unique de la grille de mesures (research R12) : results/mesures.json, en ajout seul.
// Usage en module : record({...}) ; en ligne de commande : une entrée JSON (ou un tableau) sur stdin.

import { execSync } from "node:child_process";
import { existsSync, readFileSync, renameSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export const MESURES_PATH = fileURLToPath(new URL("../../results/mesures.json", import.meta.url));

export type Framework = "react" | "vue" | "svelte" | "temoin" | "temoin-defaut" | "reference";

export interface EntreeMesure {
  id: string;
  framework: Framework;
  mesure: string;
  valeur: number;
  unite: string;
  net?: number;
  valide: boolean;
  horodatage: string;
  conditions: Record<string, unknown>;
  details: Record<string, unknown>;
}

export type NouvelleEntree = Pick<EntreeMesure, "framework" | "mesure" | "valeur" | "unite"> &
  Partial<Pick<EntreeMesure, "valide" | "conditions" | "details">>;

interface Fichier {
  version: 1;
  entrees: EntreeMesure[];
}

export function lire(): Fichier {
  if (!existsSync(MESURES_PATH)) return { version: 1, entrees: [] };
  return JSON.parse(readFileSync(MESURES_PATH, "utf8"));
}

/** Dernière entrée valide d'un couple (framework, mesure), ou undefined. */
export function derniere(fichier: Fichier, framework: string, mesure: string): EntreeMesure | undefined {
  return fichier.entrees.filter((e) => e.framework === framework && e.mesure === mesure && e.valide).at(-1);
}

function commit(): string | undefined {
  try {
    return execSync("git rev-parse --short HEAD", { stdio: ["ignore", "pipe", "ignore"] }).toString().trim();
  } catch {
    return undefined;
  }
}

export function record(nouvelle: NouvelleEntree): EntreeMesure {
  const fichier = lire();
  const horodatage = new Date().toISOString();
  const entree: EntreeMesure = {
    id: `${horodatage}-${nouvelle.mesure}-${nouvelle.framework}`,
    framework: nouvelle.framework,
    mesure: nouvelle.mesure,
    valeur: nouvelle.valeur,
    unite: nouvelle.unite,
    valide: nouvelle.valide ?? true,
    horodatage,
    conditions: { commit: commit(), ...nouvelle.conditions },
    details: nouvelle.details ?? {},
  };
  // CPU et GPU : valeur nette de la dernière référence (OBS sur une scène vide).
  const systeme = /^(cpu|gpu)-/.exec(entree.mesure);
  if (systeme && entree.framework !== "reference") {
    const ref = derniere(fichier, "reference", `${systeme[1]}-reference`);
    if (ref) entree.net = Number((entree.valeur - ref.valeur).toFixed(2));
  }
  fichier.entrees.push(entree);
  mkdirSync(dirname(MESURES_PATH), { recursive: true });
  const tmp = `${MESURES_PATH}.tmp`;
  writeFileSync(tmp, JSON.stringify(fichier, null, 2) + "\n");
  renameSync(tmp, MESURES_PATH);
  return entree;
}

/** Lecture des options --nom valeur communes aux scripts de mesure. */
export function option(name: string, fallback?: string): string {
  const i = process.argv.indexOf(`--${name}`);
  const value = i >= 0 ? process.argv[i + 1] : fallback;
  if (value === undefined) {
    console.error(`Option manquante : --${name}`);
    process.exit(1);
  }
  return value;
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const input = readFileSync(0, "utf8").replace(/^﻿/, "");
  const parsed: NouvelleEntree | NouvelleEntree[] = JSON.parse(input);
  for (const e of Array.isArray(parsed) ? parsed : [parsed]) {
    const saved = record(e);
    console.log(`${saved.mesure} (${saved.framework}) = ${saved.valeur} ${saved.unite}${saved.net !== undefined ? ` (net ${saved.net})` : ""}`);
  }
}

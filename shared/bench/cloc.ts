// Lignes de code source d'une implémentation (cloc, research R10), hors commentaires et lignes vides.
// Usage : npm run lignes -- --framework react

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { option, record, type Framework } from "./record.ts";

const framework = option("framework") as Framework;
const perl = process.env.PERL_PATH ?? "C:\\Program Files\\Git\\usr\\bin\\perl.exe";
const cloc = fileURLToPath(new URL("../node_modules/cloc/lib/cloc", import.meta.url));
const src = fileURLToPath(new URL(`../../apps/${framework}/src`, import.meta.url));

if (!existsSync(perl)) {
  console.error(`Perl introuvable : ${perl}\nInstaller Git for Windows ou définir PERL_PATH.`);
  process.exit(1);
}
if (!existsSync(src)) {
  console.error(`Dossier source introuvable : ${src}`);
  process.exit(1);
}

const sortie = execFileSync(perl, [cloc, "--json", "--quiet", src], { encoding: "utf8" });
const data = JSON.parse(sortie);
const parLangage = Object.fromEntries(
  Object.entries(data)
    .filter(([k]) => k !== "header" && k !== "SUM")
    .map(([k, v]) => [k, (v as { code: number }).code]),
);
const entree = record({ framework, mesure: "lignes", valeur: data.SUM.code, unite: "lignes", details: { parLangage, fichiers: data.SUM.nFiles } });
console.log(`${entree.valeur} lignes de code`, parLangage);

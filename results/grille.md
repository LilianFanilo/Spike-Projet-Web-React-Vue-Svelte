# Grille de résultats du spike

Générée par `npm run grille` le 2026-10-27T20:45:34.104Z à partir de `results/mesures.json` (dernière entrée valide de chaque mesure).

| Mesure | Comment | React | Vue | Svelte | Témoin (hors barème) |
| --- | --- | --- | --- | --- | --- |
| Critères d'acceptation validés | Suite E2E partagée | — | — | — | 34/34 |
| Passages E2E avant le vert | Historique des campagnes | — | — | — | 1 |
| Lignes de code | cloc sur src/ | — | — | — | 376 |
| Poids de l'overlay 2D (Ko gzip) | Overlay A, chargement initial | — | — | — | 3.17 |
| Poids de l'overlay B (Ko gzip) | Chargement initial | — | — | — | 3.12 |
| Poids de l'overlay 3D (Ko gzip) | Chargement initial | — | — | — | 3.53 |
| Poids du dashboard (Ko gzip) | Chargement initial | — | — | — | 3.32 |
| CPU net d'OBS au repos (%) | cpu.ps1 -Scenario repos | — | — | — | -0.08 (brut 0.65) |
| CPU net d'OBS pendant les alertes (%) | cpu.ps1 -Scenario alertes | — | — | — | 1.54 (brut 2.27) |
| CPU net, overlay 3D (%) | cpu.ps1 -Scenario 3d | — | — | — | 0.96 (brut 1.69) |
| GPU net, overlay 3D (%) | cpu.ps1 -Scenario 3d | — | — | — | 11.55 (brut 12.33) |
| FPS minimum de la 3D | Compteur partagé, 1 min | — | — | — | 30 fps (1 du plafond) |
| Latence médiane (ms) | Service → overlay peint | — | — | — | 27.05 |
| Latence p95 (ms) | Service → overlay peint | — | — | — | 55.69 |

Notes :
- La latence couvre le trajet **service → overlay peint**. Le saut dashboard → service est identique pour les trois frameworks et n'est pas mesuré.
- CPU et GPU sont **nets** de la référence (OBS sur une scène vide), en % de la machine entière.
- Le temps d'implémentation, les corrections manuelles et le ressenti sont dans `results/journal-<fw>.md`.
- Conversion en notes : `results/bareme.md`.

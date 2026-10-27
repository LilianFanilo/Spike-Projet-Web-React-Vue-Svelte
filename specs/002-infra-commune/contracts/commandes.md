# Contrat : commandes de test et de mesure

Toutes les commandes se lancent depuis `shared/`, avec `npm run <script> -- <options>`. Elles écrivent dans `results/mesures.json` via `bench/record.ts`, sauf `alertes`, qui ne fait que piloter.

| Script npm | Commande sous-jacente | Options | Mesures écrites |
| --- | --- | --- | --- |
| `serveur` | `node server/index.ts` | `--vars`, `--port` | — |
| `e2e` | `playwright test -c e2e/playwright.config.ts` | Env : `APP_URL` (obligatoire), `FRAMEWORK` (obligatoire), `APP_QUERY` (facultatif) | `e2e` |
| `latence` | `node bench/latency.ts` | `--framework`, `--count 200`, `--interval 100`, `--obs-fps <n>` | `latence-mediane`, `latence-p95` |
| `alertes` | `node bench/alerts.ts` | `--count 10`, `--interval 3000` | — |
| `poids` | `node bench/sizes.ts` | `--framework` (l'app est lue dans `apps/<fw>/dist`, à construire avant) | `poids-*` |
| `fps` | `node bench/fps.ts` | `--framework`, `--duration 60`, `--obs-fps <n>` | `fps-min`, `fps-moyen` |
| `lignes` | `node bench/cloc.ts` | `--framework` | `lignes` |
| `grille` | `node bench/grille.ts` | — | Écrit `results/grille.md` |
| (PowerShell 5.1) | `powershell -File bench/cpu.ps1` | `-Framework`, `-Scenario reference\|repos\|alertes\|3d`, `-Duration 60`, `-ObsFps <n>`, `-Acceleration on\|off` | `cpu-<scenario>`, `gpu-<scenario>` |

Préconditions vérifiées par les scripts, avec un échec explicite si elles ne sont pas remplies :
- `latence` exige que `overlay-a` et `overlay-b` soient connectés (`GET /health`).
- `fps` exige `overlay-3d`.
- `cpu.ps1` exige qu'un processus `obs64` existe.
- `poids` exige le manifeste de build.
- `latence` marque la mesure `valide: false` si plus de 2 % des accusés attendus sont perdus.

Accusés attendus :
- une `update` de `titre` ou de `score` attend un accusé de `overlay-a` ;
- une `update` de `bandeau` attend un accusé de `overlay-b`.

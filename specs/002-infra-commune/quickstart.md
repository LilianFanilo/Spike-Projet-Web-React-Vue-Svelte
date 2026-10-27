# Quickstart — Valider l'outillage commun sur la page témoin

Ce guide prouve que l'outillage fonctionne avant toute implémentation (US4). C'est la condition pour poser le tag `base-commune`.

## Prérequis

- Node 26 et npm.
- Git for Windows, pour son Perl, utilisé par `cloc`.
- OBS, uniquement pour l'étape 5.

```powershell
cd shared; npm install; npx playwright install chromium; cd ..
cd apps/temoin; npm install; npm run build; cd ../..
node shared/assets/build-model.ts      # génère shared/assets/model.glb (une seule fois)
```

Résultat attendu : `shared/assets/model.glb` pèse moins de 1 Mo, et `apps/temoin/dist/.vite/manifest.json` existe.

## 1. Service de diffusion (US1)

```powershell
node shared/server/index.ts            # affiche "PRET 8787"
curl.exe http://127.0.0.1:8787/health  # {"ok":true,"seq":0,"clients":[]}
```

Les scénarios de l'US1 (bienvenue, rediffusion, liste alternative, rejet d'une valeur invalide, import depuis Node) sont couverts par `shared/e2e/service.spec.ts`, qui fait partie de la suite.

## 2. Suite d'acceptation sur le témoin (US2, US4-1, SC-001)

```powershell
cd apps/temoin; npm run preview        # dans un terminal séparé : http://localhost:4170
cd shared; $env:APP_URL="http://localhost:4170"; $env:FRAMEWORK="temoin"; npm run e2e
```

Résultats attendus :
- 100 % des tests réussis, dans les deux projets (`standard` et `sans-3d`) ;
- en moins de 5 minutes (SC-006) ;
- une entrée `e2e` ajoutée à `results/mesures.json`, avec la liste des scénarios manuels.

## 3. Détection des défauts injectés (US2-4, SC-002)

```powershell
foreach ($d in "bandeau","score","alerte","reconnexion") { $env:APP_QUERY="defaut=$d"; npm run e2e }
```

Résultat attendu : chaque campagne a au moins un échec, et c'est le scénario visé qui échoue :

| Défaut | Scénario qui doit échouer |
| --- | --- |
| `bandeau` | US2-3 |
| `score` | US2-2 |
| `alerte` | US2-4 |
| `reconnexion` | US2-6 |

Ces campagnes ont `FRAMEWORK=temoin-defaut`. Elles n'entrent donc pas dans le décompte du témoin.

## 4. Mesures sans OBS (US3)

```powershell
npm run poids  -- --framework temoin
npm run lignes -- --framework temoin
# Ouvrir overlay-a.html et overlay-b.html dans deux fenêtres visibles (pas des onglets en arrière-plan), puis :
npm run latence -- --framework temoin --obs-fps 60
npm run grille
```

Résultats attendus :
- 4 entrées `poids-*` ;
- une entrée `lignes` ;
- les entrées `latence-*` avec `valide: true`, et une médiane inférieure à 3 images (SC-003) ;
- `results/grille.md` généré.

## 5. Mesures dans OBS (US5, SC-007)

Suivre [results/protocole-obs.md](../../results/protocole-obs.md) avec le témoin (une scène « témoin » et ses 3 sources) :
- `powershell -File shared/bench/cpu.ps1 -Framework reference -Scenario reference -Duration 60` (scène vide) ;
- puis `-Framework temoin` avec les scénarios `repos`, `alertes` (pendant `npm run alertes`) et `3d` ;
- puis `npm run fps -- --framework temoin --obs-fps 30`, avec `overlay-3d.html?debug=1` comme source.

Résultats attendus :
- entrées `cpu-*` et `gpu-*` avec un champ `net` ;
- entrées `fps-*` ;
- l'ensemble déroulé en moins de 30 minutes.

## Sortie

Une fois les étapes 2 à 5 au vert, fusionner `002-infra-commune` dans `main`, puis poser le tag `base-commune`.

## Résultats de validation

### 2026-10-27 — Suite d'acceptation (T033, SC-001, SC-006)

- Témoin (`FRAMEWORK=temoin`) : **34/34 réussis** (33 en `standard`, 1 en `sans-3d`), en **32 s**. L'entrée `e2e` est enregistrée.
- Premier passage : 33/34. `BORD-titre-long` a révélé un bug du témoin : un écho du service arrivé en retard écrasait la saisie en cours. Le dashboard témoin ignore maintenant les échos sur le champ qui a le focus. Les trois frameworks seront confrontés au même cas.

### 2026-10-27 — Défauts injectés (T034, SC-002)

Campagnes lancées sur `overlays.spec.ts`, avec `FRAMEWORK=temoin-defaut` :

| Défaut | Scénario visé | Résultat |
| --- | --- | --- |
| `bandeau` | US2-3 | ✅ US2-3 échoue (seul échec) |
| `score` | US2-2 | ✅ US2-2 échoue, ainsi que US2-1, US2-4 et US2-5, qui attendent la valeur du score |
| `alerte` | US2-4 | ✅ US2-4 et US2-5 échouent |
| `reconnexion` | US2-6 | ✅ US2-6 échoue (seul échec) |

### 2026-10-27 — Mesures sans OBS (T042, SC-003)

| Mesure | Témoin |
| --- | --- |
| Poids gzip (initial) | dashboard 3,32 Ko · overlay A 3,17 Ko · overlay B 3,12 Ko · overlay 3D 3,53 Ko (rien en différé) |
| Lignes de code | 376 (TypeScript 241, CSS 135) |
| Latence (200 mises à jour) | médiane **10,6 ms**, p95 **18,1 ms**, **0 % d'accusés perdus** → valide |

- La latence a été mesurée avec les overlays ouverts dans Chromium sans interface. Dans ce mode, `requestAnimationFrame` n'est pas calé sur un écran à 60 Hz, et la médiane (0,64 image « à 60 i/s ») passe sous le plancher théorique de la sonde. **La lecture en images n'a de sens que dans OBS**, où la cadence est fixée.
- `cpu.ps1` a été validé à blanc, sur un processus Node qui occupe un cœur à 100 % : la mesure donne 8,23 % pour 8,33 % attendus (12 cœurs logiques). Le script échoue explicitement si OBS est absent.
- `results/grille.md` est généré par `npm run grille`.

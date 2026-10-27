# Quickstart — valider l'implémentation React

Ce guide sert à vérifier que l'implémentation fonctionne. Il ne contient pas de code d'implémentation. Les commandes sont pour PowerShell, et elles se lancent depuis la racine du dépôt, sauf mention contraire.

## Prérequis

- Node 26 et npm 11, avec Git for Windows (son Perl sert au comptage de lignes).
- Les dépendances de `shared/` installées (`cd shared; npm ci`), ainsi que les navigateurs Playwright (`npx playwright install chromium`).
- Être sur la branche `003-spike-react`.

## 1. Installer et construire

```powershell
cd apps/react
npm install          # première fois : crée package-lock.json, propre à l'app
npm run build        # tsc --noEmit puis vite build
```

Résultats attendus :
- aucune erreur TypeScript ;
- `dist/.vite/manifest.json` contient les 4 entrées : `dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html` ;
- React Compiler est actif : `Select-String -Path dist/assets/dashboard-*.js -Pattern "memo_cache_sentinel"` trouve une correspondance, et les composants minifiés commencent par un appel au cache, de la forme `(0,x.c)(N)` (research R1) ;
- seul le bundle de l'overlay 3D importe `three` : les poids sont relevés à l'étape 5.

## 2. Lancer le service et le build de production

Ouvrez deux terminaux :

```powershell
# terminal 1 : service de diffusion (port 8787)
cd shared; npm run serveur
```

```powershell
# terminal 2 : build de production (port 4173, strict)
cd apps/react; npm run preview
```

Vérifications manuelles rapides :
- `http://localhost:4173/dashboard.html` affiche 5 champs avec leurs libellés et le bouton « Alerte ». Arrêter le service fait passer l'indicateur à déconnecté, puis il revient quand le service redémarre (US1-5).
- `http://localhost:4173/overlay-a.html` affiche le titre et le score, avec un fond transparent. Modifier le titre dans le dashboard le met à jour aussitôt.
- `http://localhost:4173/overlay-b.html` : le bandeau « EN DIRECT » suit la case à cocher.
- `http://localhost:4173/overlay-3d.html?debug=1` : Suzanne tourne, et sa couleur et sa vitesse suivent le dashboard. Le compteur FPS est en haut à gauche. Sans `?debug=1`, il n'y a pas de compteur.
- Le bouton « Alerte » fait grossir les overlays 2D, avec un flash, pendant 2 s. Le modèle 3D saute en faisant 2 tours.

## 3. Suite d'acceptation (contrat de fin)

Arrêtez le service lancé à l'étape 2 : la suite démarre son propre service à chaque test. Laissez le `preview` tourner.

```powershell
cd shared
$env:APP_URL = "http://localhost:4173"; $env:FRAMEWORK = "react"; npm run e2e
```

Résultats attendus :
- tous les tests des projets `standard` et `sans-3d` passent (SC-001) ;
- chaque lancement est une campagne enregistrée. Reportez le numéro de passage dans `results/journal-react.md`.

**Ne jamais lancer la suite sans `FRAMEWORK=react`**, et ne jamais modifier `shared/e2e` pour faire passer un test (constitution II).

## 4. Correspondance des scénarios

| Scénarios de la spec | Fichier E2E | Contrat React |
| --- | --- | --- |
| US1-1 à US1-6 | `shared/e2e/dashboard.spec.ts` | [pages-react.md › Dashboard](contracts/pages-react.md#dashboard-dashboardtsx-champtsx), [data-model.md › pending](data-model.md) |
| US2-1 à US2-7 | `shared/e2e/overlays.spec.ts` | [pages-react.md › Overlay A / B](contracts/pages-react.md#overlay-a-overlay-atsx) |
| US3-1 à US3-6 | `shared/e2e/overlay-3d.spec.ts` | [pages-react.md › Overlay 3D](contracts/pages-react.md#overlay-3d-overlay3dtsx-scenetsx-replitsx) |
| Cas limites | `shared/e2e/bords.spec.ts` | [research.md › R4, R6, R7](research.md) |

## 5. Mesures (après le vert)

Les commandes et leurs options sont décrites dans [002-infra-commune/contracts/commandes.md](../002-infra-commune/contracts/commandes.md). Le protocole OBS est dans [results/protocole-obs.md](../../results/protocole-obs.md). Dans OBS, les scènes `React 2D`, `React 3D` et `React FPS` existent déjà : il suffit de pointer leurs sources sur le port 4173.

## 6. Journal

`results/journal-react.md` note :
- le début et la fin de chaque étape ;
- chaque correction manuelle (catégorie : bug, syntaxe obsolète, écart à la spec ou configuration ; auteur : IA seule ou humain) ;
- le nombre de passages E2E avant le vert.

# Quickstart : valider l'implémentation Vue (004-spike-vue)

## Prérequis
- Node 26 et npm 11.
- Les dépendances de `shared/` sont installées (`npm ci` dans `shared/`), ainsi que Chromium pour Playwright.
- **OBS est fermé** (`Get-Process obs64` ne renvoie rien). Ses sources navigateur se connecteraient au service de la suite.
- Aucun service ne tourne déjà sur le port 8787 : la suite lance le sien à chaque test.

## 1. Installer et construire
```powershell
cd apps/vue
npm install
npm run build        # vue-tsc --noEmit, puis vite build
```
Résultat attendu : aucune erreur de type, et `dist/` contient `dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html` et `.vite/manifest.json`.

## 2. Servir le build de production
```powershell
npm run preview      # http://localhost:4174, strictPort
```

## 3. Vérification manuelle rapide (facultative)
Dans un autre terminal : `cd shared; npm run serveur`. Ouvrir ensuite :
- `http://localhost:4174/dashboard.html` : 5 champs, indicateur « Connecté » ;
- `http://localhost:4174/overlay-a.html` : titre et score, fond transparent ;
- `http://localhost:4174/overlay-b.html` : bandeau « EN DIRECT » ;
- `http://localhost:4174/overlay-3d.html` (et `?debug=1`) : modèle en rotation (et compteur FPS).

Modifier les champs du dashboard et cliquer sur « Alerte » : les overlays suivent. **Arrêter ce service avant l'étape 4.**

## 4. Suite d'acceptation partagée (le contrat)
```powershell
cd shared
$env:APP_URL="http://localhost:4174"; $env:FRAMEWORK="vue"; npm run e2e
```
- Toujours la suite **entière**, jamais `--grep` : chaque campagne est enregistrée dans `results/mesures.json` et compte dans les passages avant le vert.
- Résultat attendu : 34 tests réussis, dont les tests `@repli` du projet `sans-3d`.
- Noter chaque campagne (horodatage, réussis, échoués) dans `results/journal-vue.md`.

## 5. Contrôle par story (pendant `/speckit-implement`)
À la fin de US1, US2 et US3, un script Playwright jetable, écrit **hors du dépôt** (dossier temporaire de session), ouvre la page concernée sur le build servi et prend une capture d'écran. Il ne remplace pas la suite et n'est pas enregistré.

Référence du contrat DOM : [contracts/pages-vue.md](contracts/pages-vue.md). État client : [data-model.md](data-model.md).

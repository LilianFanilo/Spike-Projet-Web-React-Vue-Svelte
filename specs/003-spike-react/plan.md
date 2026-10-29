# Implementation Plan: Spike overlays live — implémentation React

**Branch**: `003-spike-react` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md) (copie à l'identique de `specs/001-spec-spike/spec.md`, tag `spec-gelee`)

**Input**: Feature specification from `specs/003-spike-react/spec.md`

## Summary

Implémenter la spec gelée du spike en React, dans `apps/react` : un dashboard généré à partir du message de bienvenue, deux overlays 2D (titre et score, bandeau « EN DIRECT ») et un overlay 3D (Suzanne en rotation, couleur, vitesse, alerte, repli 2D). La stack est celle imposée par la constitution : React 19.2 avec React Compiler (`babel-plugin-react-compiler`), Zustand pour l'état et React Three Fiber + drei pour la 3D, le tout sur Vite 8 et TypeScript strict. Le transport, la sonde de latence et le compteur FPS viennent de `shared/` sans modification. L'app se branche via un unique `connect()` par page, appelé hors de l'arbre React, qui alimente un store Zustand. Les composants lisent ce store avec des sélecteurs fins. L'implémentation est terminée quand la suite E2E partagée passe au vert sur le build de production servi sur le port 4173.

## Technical Context

**Language/Version** : TypeScript 7.0 (strict), TSX ; Node 26.7 et npm 11.19 pour l'outillage.

**Primary Dependencies** (détail et justification dans [research.md](research.md), R1) :
- runtime : `react` et `react-dom` ~19.2.9, `zustand` ^5.0.16, `three` ~0.186.1, `@react-three/fiber` ^9.8.2, `@react-three/drei` ^10.7.9 ;
- build : `vite` ^8.3.5, `@vitejs/plugin-react` ^6.1.2, `@rolldown/plugin-babel` ^0.2.4, `@babel/core` ^7.29.7, `babel-plugin-react-compiler` ^1.0.0, `typescript` ^7.0.2, `@types/react` et `@types/react-dom` ~19.2, `@types/three` ~0.186.0, `@types/babel__core`.

**Storage** : N/A. L'état vit dans le service de diffusion (`shared/server`), et chaque page en garde une copie dans son store Zustand.

**Testing** : la suite Playwright partagée `shared/e2e`, lancée avec `APP_URL=http://localhost:4173` et `FRAMEWORK=react`. Pas de test unitaire (constitution VI).

**Target Platform** : la source navigateur d'OBS (Chromium/CEF) et Chromium Playwright, en 1920×1080. Le projet `standard` utilise SwiftShader, le projet `sans-3d` utilise `--disable-3d-apis`.

**Project Type** : application web front-end multi-pages (4 entrées Vite), sans backend propre.

**Performance Goals** : latence dashboard → overlay < 100 ms au p95 (SC-003) ; 3D au moins à 80 % de la cadence d'OBS (SC-005) ; alertes 2D sans saccade (SC-004).

**Constraints** :
- build de production servi par `vite preview --strictPort` sur le port 4173 ;
- fond transparent, aucune barre de défilement ;
- aucune librairie UI ni d'animation ;
- aucun throttle ni debounce dans le dashboard ;
- une seule connexion WebSocket par page ;
- `shared/` en lecture seule ;
- aucune lecture de `apps/vue` ni de `apps/svelte`.

**Scale/Scope** : 4 pages, 5 variables (ou 5 variables alternatives), environ 10 composants, un seul utilisateur en local.

Aucun point `NEEDS CLARIFICATION` : la spec est gelée, et les choix techniques restants sont tranchés dans [research.md](research.md).

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Exigence | Conformité du plan |
| --- | --- | --- |
| I. Équité | Spec copiée à l'identique, branche issue de `base-commune`, aucune lecture d'un autre framework, même agent et même modèle, pas de MCP Svelte | ✅ Branche `003-spike-react` créée depuis `base-commune` (b07f4de). `spec.md` est la copie de `001-spec-spike`. Les seules sources lues sont `shared/`, `specs/001` et `specs/002`, ainsi que la configuration du témoin (base commune, sans framework). Aucun MCP utilisé. |
| II. `shared/` en lecture seule | Aucune modification de `shared/` ni des E2E | ✅ L'app importe `@shared/client.ts`, `@shared/protocol.ts` et `@shared/assets/model.glb?url`. Aucun fichier de `shared/` n'est touché. |
| III. Stack minimale | TS strict, Vite, npm, pas de méta-framework, projet npm indépendant avec son lockfile, alias `@shared` dans `server.fs.allow`, pas de librairie UI ni d'animation, seuls React 19.2, Zustand, R3F et drei | ✅ `apps/react/package.json` et `package-lock.json` sont propres à l'app, sans workspaces. Les seules dépendances runtime sont `react`, `react-dom`, `zustand`, `three`, `@react-three/fiber` et `@react-three/drei` (`three` est requis par R3F). L'error boundary est une classe maison, sans `react-error-boundary`. |
| Contraintes React | React 19.2, Zustand, R3F + drei, React Compiler via `babel-plugin-react-compiler` | ✅ React est épinglé en `~19.2.9`, car 19.3.1 existe mais la constitution impose 19.2. Le compilateur passe par la voie Babel (`reactCompilerPreset` + `@rolldown/plugin-babel`), et non par la voie Rust expérimentale (R1). |
| IV. Contrat DOM | `data-var` et `data-value`, `data-alert`, `data-connection`, `data-action`, 4 entrées, 1920×1080 transparent, FPS avec `?debug=1`, repli 2D | ✅ Détaillé dans [contracts/pages-react.md](contracts/pages-react.md). La sonde et le FPS sont fournis par `connect({ name })`. Le repli couvre l'absence de WebGL et l'échec de chargement du modèle (R6). |
| V. Mesures reproductibles | Build de production, port 4173 en `strictPort`, barème figé, journal | ✅ `preview: { port: 4173, strictPort: true }`. `results/journal-react.md` est ouvert dès cette étape. Le barème n'est pas modifié. |
| VI. Simplicité | Code lisible, pas de tests unitaires, pas d'optimisation hors pratiques par défaut | ✅ On garde StrictMode, les sélecteurs Zustand et la lecture de l'état dans `useFrame` (pratique recommandée par la doc R3F). Pas de `memo` manuel : c'est le rôle du compilateur. |

**Résultat** : aucune violation, la gate est passée.

**Re-check après la phase 1** : le data model (store), les contrats de pages et le quickstart n'introduisent ni dépendance ni modification de `shared/`, et ne lisent aucun autre framework. La gate reste passée.

## Project Structure

### Documentation (this feature)

```text
specs/003-spike-react/
├── spec.md              # Copie de la spec gelée
├── plan.md              # Ce fichier
├── research.md          # Phase 0 : décisions techniques React
├── data-model.md        # Phase 1 : store Zustand et état dérivé par page
├── quickstart.md        # Phase 1 : installation, build, preview, E2E, mesures
├── contracts/
│   └── pages-react.md   # Phase 1 : composants → contrat DOM d'intégration
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
apps/react/
├── package.json             # Projet npm indépendant (scripts build et preview)
├── package-lock.json
├── tsconfig.json            # strict, jsx react-jsx, allowImportingTsExtensions, types vite/client
├── vite.config.ts           # plugin React + Babel (React Compiler), alias @shared, 4 entrées, preview 4173
├── dashboard.html           # Entrées HTML à la racine de l'app (une par page)
├── overlay-a.html
├── overlay-b.html
├── overlay-3d.html
└── src/
    ├── live/
    │   ├── store.ts         # Store Zustand : vars, values, connected, alerte, état d'attente du dashboard
    │   └── connexion.ts     # demarrer(role, name?) : un seul connect() par page, branché sur le store
    ├── dashboard/
    │   ├── main.tsx         # Point d'entrée : demarrer("dashboard") puis createRoot
    │   ├── Dashboard.tsx    # Racine data-connection, liste des champs, bouton Alerte
    │   ├── Champ.tsx        # Contrôle natif selon le type (text, number, boolean, color, speed)
    │   └── dashboard.css    # Style minimal du dashboard
    ├── overlays/
    │   ├── overlay.css      # html/body transparents en 1920×1080, @keyframes de l'alerte 2D
    │   ├── Alerte.tsx       # Enveloppe animée : relance la keyframe à chaque alerte (key = seq)
    │   ├── overlay-a.tsx    # Point d'entrée et composant de l'overlay A (titre, score)
    │   └── overlay-b.tsx    # Point d'entrée et composant de l'overlay B (bandeau EN DIRECT)
    └── overlay-3d/
        ├── main.tsx         # Point d'entrée de l'overlay 3D
        ├── Overlay3D.tsx    # Racine data-alert, détection WebGL, error boundary, data-var vitesse
        ├── Scene.tsx        # <Canvas> R3F, lumières, data-var couleur
        ├── Modele.tsx       # useGLTF + useFrame : rotation continue et animation d'alerte
        ├── Repli.tsx        # Repli 2D « 3D indisponible » qui suit la couleur
        ├── LimiteErreur.tsx # Error boundary (classe), qui bascule vers le repli
        └── overlay-3d.css   # Scène plein cadre et style du repli

results/journal-react.md     # Journal de l'implémentation (constitution V)
```

**Structure Decision** : un seul projet front-end, `apps/react`, conforme à [integration-apps.md](../002-infra-commune/contracts/integration-apps.md). Les 4 entrées HTML sont à la racine, car le manifeste Vite les indexe sous `dashboard.html`, etc., comme le lit `shared/bench/sizes.ts`. Le code est sous `src/`, car c'est le dossier compté par `shared/bench/cloc.ts`. Chaque page n'embarque que son sous-arbre : le dashboard et les overlays 2D n'importent jamais `three`, ce qui garde des poids comparables (SC-006).

## Complexity Tracking

Aucune violation de la constitution à justifier.

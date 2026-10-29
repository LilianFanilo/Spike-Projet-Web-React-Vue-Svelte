# Implementation Plan: Spike overlays live — implémentation Svelte

**Branch**: `005-spike-svelte` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md) (copie identique de la spec gelée `specs/001-spec-spike/spec.md`)

**Input**: Feature specification from `specs/005-spike-svelte/spec.md`

## Summary

Implémenter en Svelte 5 (runes) les quatre pages de la spec gelée : un dashboard généré à partir du message `welcome`, deux overlays 2D (titre et score ; bandeau « EN DIRECT ») et un overlay 3D Threlte 8 (Suzanne colorée, rotation pilotée, saut à l'alerte, repli 2D). Le tout est branché sur l'outillage commun `shared/` (service 8787, `connect()`, sonde, FPS) sans le modifier. L'état de chaque page est une classe `Live` à champs `$state` dans un `.svelte.ts`, qui enveloppe un unique `connect()`. Les animations utilisent les moyens natifs : keyframes CSS et Web Animations relancées par une attachment Svelte en 2D, boucle `useTask` de Threlte en 3D. Le build de production est servi sur le port 4175 et validé par la suite E2E partagée (`FRAMEWORK=svelte`).

## Technical Context

**Language/Version** : TypeScript ~6.0 en mode strict (exigé par `svelte-check`, cf. research R1), Svelte 5.57 (runes imposées à la compilation), Node 26.

**Primary Dependencies** : `svelte` ^5.57, `@sveltejs/vite-plugin-svelte` ^7.3, `vite` ^8.3.5, `@threlte/core` ^8.6, `three` ^0.186 (+ `@types/three`). Outillage de dev : `svelte-check` ^4.7, `@tsconfig/svelte` ^5.0. Aucune librairie UI ni d'animation, pas de `@threlte/extras`.

**Storage** : aucun (état en mémoire, détenu par le service).

**Testing** : suite E2E Playwright partagée (`shared/e2e`, contrat d'acceptation, lancée en entier). Points de contrôle par story avec un script Playwright jetable hors dépôt. Pas de tests unitaires (constitution VI).

**Target Platform** : sources navigateur d'OBS (Chromium/CEF, 1920×1080, fond transparent) et Chromium de Playwright (projets `standard` SwiftShader et `sans-3d`).

**Project Type** : application web front-end multi-pages (Vite, sans méta-framework), projet npm indépendant `apps/svelte`.

**Performance Goals** : latence p95 < 100 ms (SC-003), FPS min ≥ 80 % de la cadence d'OBS en 3D (SC-005), animations sans saccade pendant 10 alertes (SC-004).

**Constraints** : `shared/` en lecture seule ; une seule connexion WebSocket par page ; une mise à jour par événement de saisie, sans throttle ni debounce (FR-012) ; contrat DOM FR-040 à FR-045 ; pas de lecture de `apps/react` ni `apps/vue`.

**Scale/Scope** : 4 pages, 5 variables (liste lue au runtime), 1 modèle 3D, 1 utilisateur local.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principe | Exigence | Statut |
| --- | --- | --- |
| I. Équité | Spec copiée à l'identique (vérifié par `diff`), branche depuis `base-commune`, aucun accès aux apps React/Vue, même modèle et même agent. MCP Svelte actif et noté dans le journal. | ✅ |
| II. `shared/` en lecture seule | Import via `@shared` uniquement ; suite E2E non modifiée et lancée en entier avec `FRAMEWORK=svelte`. | ✅ |
| III. Stack minimale | TS strict, Vite, npm ; pas de SvelteKit ; projet indépendant avec son lockfile ; alias `@shared` + `server.fs.allow`. Dépendances limitées à Svelte, Threlte (core), three et l'outillage de vérification. | ✅ |
| IV. Contrat DOM | `data-var`/`data-value` partout, `data-alert` et `data-connection` sur la racine, 4 entrées Vite, FPS via `?debug=1` (par `connect`), repli 2D sans WebGL. | ✅ |
| V. Mesures reproductibles | Build de production, `vite preview --strictPort` sur 4175, journal `results/journal-svelte.md` tenu à chaque étape. | ✅ |
| VI. Simplicité | Pratiques par défaut de Svelte et Threlte (gabarit officiel, bonnes pratiques de la doc), aucune optimisation spécifique. | ✅ |
| Contraintes Svelte | Svelte 5, runes dans des `.svelte.ts`, Threlte 8, pas de `export let`, pas de `$:`, pas de `svelte/store` pour l'état (runes forcées par `compilerOptions.runes`). | ✅ |

Écart à signaler (justifié, sans violation) : TypeScript ~6.0 au lieu de 7 (témoin), car `svelte-check` ne prend pas encore TypeScript 7 en charge. La constitution n'impose pas de version de TypeScript. À noter dans le journal comme point de friction de l'outillage.

**Re-check après Phase 1** : la conception (research, data-model, contrat) ne crée ni dépendance supplémentaire, ni modification de `shared/`, ni état hors runes. ✅

## Project Structure

### Documentation (this feature)

```text
specs/005-spike-svelte/
├── spec.md              # copie de la spec gelée
├── plan.md              # ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1
├── quickstart.md        # Phase 1
├── contracts/
│   └── app-svelte.md    # Phase 1
└── tasks.md             # Phase 2 (/speckit-tasks)
```

### Source Code (repository root)

```text
apps/svelte/
├── package.json             # scripts build (svelte-check && vite build), preview
├── package-lock.json
├── vite.config.ts           # svelte(), @shared, fs.allow, manifest, 4 entrées, preview 4175
├── svelte.config.js         # runes forcées hors node_modules
├── tsconfig.json            # références app + node (gabarit officiel)
├── tsconfig.app.json        # @tsconfig/svelte, strict, allowImportingTsExtensions, @shared/*
├── tsconfig.node.json       # vite.config.ts
├── dashboard.html
├── overlay-a.html
├── overlay-b.html
├── overlay-3d.html
└── src/
    ├── dashboard.ts         # mount(Dashboard)
    ├── overlay-a.ts         # mount(OverlayA)
    ├── overlay-b.ts         # mount(OverlayB)
    ├── overlay-3d.ts        # mount(Overlay3D)
    ├── app.css              # html/body transparents, keyframes d'alerte, styles communs
    ├── lib/
    │   ├── live.svelte.ts   # classe Live (runes) autour de connect()
    │   ├── alerte.ts        # attachment rejouer(numero) (Web Animations)
    │   └── webgl.ts         # webglDisponible()
    └── components/
        ├── Dashboard.svelte
        ├── Champ.svelte     # un contrôle natif selon le type
        ├── OverlayA.svelte
        ├── OverlayB.svelte
        ├── Overlay3D.svelte # détection WebGL, chargement du modèle, repli
        └── Scene.svelte     # contenu du <Canvas> : caméra, lumières, mesh, useTask
```

**Structure Decision** : projet Vite multi-pages unique `apps/svelte/`, sur le modèle du témoin (`apps/temoin`) pour les entrées HTML et la configuration d'intégration, et du gabarit officiel `svelte-ts` pour la configuration Svelte et TypeScript.

## Complexity Tracking

Aucune violation de la constitution à justifier.

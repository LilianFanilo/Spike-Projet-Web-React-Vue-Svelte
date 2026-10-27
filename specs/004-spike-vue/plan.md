# Implementation Plan: Spike overlays live, implémentation Vue

**Branch**: `004-spike-vue` | **Date**: 2026-10-27 | **Spec**: [spec.md](spec.md) (copie à l'identique de `specs/001-spec-spike/spec.md`, tag `spec-gelee`)

**Input**: Feature specification from `specs/004-spike-vue/spec.md`

## Summary

On implémente en Vue 3.5 la spec gelée du spike : un dashboard live, deux overlays 2D pour OBS et un overlay 3D, tous branchés sur le service de diffusion commun (`shared/`, port 8787). L'app `apps/vue` est un projet Vite multi-page indépendant (4 entrées). L'état passe par un store Pinia par page, alimenté par une seule connexion `connect()` de `@shared/client.ts`. La 3D utilise TresJS et Cientos (`useGLTF`, `useLoop`), avec un repli 2D quand WebGL est absent ou que le modèle ne se charge pas. Les animations d'alerte n'utilisent que des moyens natifs : l'API Web Animations en 2D, la boucle de rendu TresJS en 3D. Critère de fin : les 34 tests de `shared/e2e` passent sur le build de production servi sur le port 4174, avec `FRAMEWORK=vue`.

## Technical Context

**Language/Version** : TypeScript 6.0.3 en mode strict (et non 7 : `vue-tsc` est incompatible avec TS 7, voir [research.md](research.md) R1), SFC Vue avec `<script setup lang="ts">`. Node 26.7, npm 11.19.

**Primary Dependencies** : vue 3.5.44 (sans Vapor), pinia 4.1.0, @tresjs/core 5.10.0, @tresjs/cientos 5.10.0, three 0.186.1. En dev : vite 8.3.5, @vitejs/plugin-vue 6.0.10, vue-tsc 3.3.13, @types/three 0.186.0.

**Storage** : N/A. L'état vit dans le service de diffusion et n'est pas persisté.

**Testing** : la suite partagée Playwright `shared/e2e` (34 tests, projets `standard` et `sans-3d`), lancée sans modification. À chaque story, un contrôle avec un script Playwright jetable, hors dépôt. Aucun test unitaire (constitution VI).

**Target Platform** : les sources navigateur d'OBS (CEF/Chromium) en 1920×1080 transparent, et Chromium pour le dashboard.

**Project Type** : application web front multi-page (pas de back : le service est fourni par `shared/`).

**Performance Goals** : latence p95 < 100 ms entre le dashboard et les overlays (SC-003) ; 3D au moins à 80 % de la cadence d'OBS (SC-005) ; aucune saccade pendant 10 alertes (SC-004). Tout est mesuré plus tard, sur `main`.

**Constraints** : aucune librairie UI ni d'animation ; aucun regroupement des envois (FR-012) ; contrat DOM FR-040 à FR-045 ; une entrée de build par page (FR-044) ; `shared/` en lecture seule ; ne jamais lire `apps/react`.

**Scale/Scope** : 4 pages, 5 variables, un seul utilisateur, tout en local.

## Constitution Check

*GATE : vérifié avant la Phase 0, puis revérifié après la Phase 1.*

| Principe | Exigence | Conformité du plan |
| --- | --- | --- |
| I. Équité | Spec copiée à l'identique ; branche depuis `base-commune` ; aucune lecture d'un autre framework | ✅ `004-spike-vue` créée depuis `base-commune`, `spec.md` copiée sans changement, `apps/react` non lu (ses fichiers ignorés par git restent sur le disque, mais personne ne les ouvre). Seul le témoin (base commune) sert de référence. |
| II. `shared/` en lecture seule | Ni `shared/` ni les tests E2E ne sont modifiés | ✅ Import par l'alias `@shared` uniquement. La suite est lancée telle quelle. |
| III. Stack minimale | TS strict, Vite, npm ; pas de méta-framework ; projet indépendant avec son lockfile ; seuls le framework, le store et la 3D imposés | ✅ Vue, Pinia, TresJS, Cientos et three, plus l'outillage de compilation (`@vitejs/plugin-vue`, `vue-tsc`). Pas de Nuxt, pas de librairie UI ni d'animation. ⚠️ TypeScript 6 au lieu de 7 : imposé par `vue-tsc`. Le mode strict est conservé, et l'écart est noté au journal (pas une violation : la constitution ne fixe pas de version). |
| IV. Contrat DOM et instrumentation | `data-var` et `data-value`, sonde à chaque message, 1920×1080 transparent, 4 entrées, FPS seulement avec `?debug=1`, repli 2D | ✅ Voir [contracts/pages-vue.md](contracts/pages-vue.md). La sonde et le compteur FPS sont assurés par `connect({ name })`. |
| V. Mesures reproductibles | Build de production, `vite preview --strictPort` sur 4174 ; journal tenu | ✅ `preview: { port: 4174, strictPort: true }`. `results/journal-vue.md` est ouvert depuis la préparation. |
| VI. Simplicité | Code lisible, pas d'optimisation au-delà des pratiques par défaut | ✅ Setup store Pinia, SFC `<script setup>`, composables : les usages standard de Vue 3.5. |
| Contraintes Vue | 3.5 stable, Pinia, TresJS + Cientos, ni Vapor ni 3.6 | ✅ `vue@3.5.44` épinglé, `createApp` classique (pas `createVaporApp`). |

**Résultat** : la porte est franchie, sans violation à justifier. Le plan a été **revérifié après la Phase 1** : le design (store, composants, contrat DOM, config Vite) ne change aucune des lignes ci-dessus.

## Project Structure

### Documentation (this feature)

```text
specs/004-spike-vue/
├── spec.md              # copie de la spec gelée
├── plan.md              # ce fichier
├── research.md          # Phase 0
├── data-model.md        # Phase 1 : état côté client (store Pinia, composants)
├── quickstart.md        # Phase 1 : build, preview, suite E2E
├── contracts/
│   └── pages-vue.md     # Phase 1 : entrées, composants, DOM attendu
└── tasks.md             # Phase 2 (/speckit-tasks), pas créé ici
```

### Source Code (repository root)

```text
apps/vue/
├── package.json             # projet npm indépendant, versions exactes (research R1)
├── package-lock.json
├── tsconfig.json            # strict, allowImportingTsExtensions, types vite/client, paths @shared
├── env.d.ts                 # références vite/client
├── vite.config.ts           # plugin Vue + templateCompilerOptions TresJS, alias @shared, 4 entrées, manifest, preview 4174
├── dashboard.html
├── overlay-a.html
├── overlay-b.html
├── overlay-3d.html
└── src/
    ├── live/
    │   ├── store.ts         # useLiveStore (setup store Pinia)
    │   ├── connexion.ts     # unique appel à connect(), branché sur le store
    │   └── useAlerte.ts     # data-alert + relance de l'animation (2D et 3D)
    ├── styles/
    │   └── overlay.css      # html/body transparents, keyframes, mise en page 1920×1080
    ├── dashboard/
    │   ├── main.ts
    │   ├── Dashboard.vue
    │   ├── Champ.vue
    │   └── dashboard.css
    ├── overlays/
    │   ├── overlay-a.ts
    │   ├── overlay-b.ts
    │   ├── OverlayA.vue
    │   └── OverlayB.vue
    └── overlay-3d/
        ├── main.ts
        ├── Overlay3D.vue    # détection WebGL, mode scène, repli ou chargement, éléments data-var
        ├── Scene.vue        # TresCanvas, caméra, lumières
        ├── Modele.vue       # useGLTF, couleur, useLoop (rotation, saut d'alerte)
        └── Repli.vue        # disque de couleur et « 3D indisponible »
```

**Structure Decision** : une seule app front, `apps/vue`, découpée par page (une entrée Vite chacune), avec un dossier `live/` commun aux 4 pages pour le store, la connexion et l'alerte. Le service, la sonde, le compteur FPS, le modèle et les tests restent dans `shared/` (lecture seule).

## Phases suivantes

- `/speckit-tasks` : tâches ordonnées par story (Setup, puis US1 dashboard, US2 overlays 2D, US3 3D, puis la campagne E2E complète et le journal), avec un point de contrôle Playwright jetable à la fin de chaque story.
- `/speckit-analyze` : contrôle de cohérence entre spec, plan et tâches, et écarts à la constitution.
- `/speckit-implement` : implémentation, campagnes E2E complètes avec `FRAMEWORK=vue` (OBS fermé), journalisation.

## Complexity Tracking

Aucune violation de la constitution à justifier. Seul écart noté : TypeScript 6.0.3 au lieu de 7.0.2, imposé par `vue-tsc` et conforme à la constitution. Il est tracé dans [research.md](research.md) R1 et dans `results/journal-vue.md`.

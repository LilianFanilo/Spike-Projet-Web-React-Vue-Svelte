---

description: "Tâches de l'implémentation Svelte du spike (005-spike-svelte)"
---

# Tasks: Spike overlays live — implémentation Svelte

**Input**: Design documents from `specs/005-spike-svelte/`

**Prerequisites**: [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/app-svelte.md](contracts/app-svelte.md), [quickstart.md](quickstart.md)

**Tests** : aucune tâche d'écriture de test. Le contrat d'acceptation est la suite E2E partagée (`shared/e2e`), lancée **en entier** avec `FRAMEWORK=svelte` (constitution II et V). Les points de contrôle de fin de story utilisent un script Playwright jetable placé dans le dossier scratchpad de la session, jamais dans le dépôt, et ne lancent jamais la suite partagée avec `--grep`.

**Règles transverses** (valables pour toutes les tâches) :
- Ne jamais lire ni copier `apps/react` ou `apps/vue`. Ne jamais modifier `shared/`.
- Runes uniquement : pas de `export let`, pas de `$:`, pas de `svelte/store` pour l'état applicatif.
- Après chaque écriture ou modification d'un fichier `.svelte` ou `.svelte.ts`, le passer dans l'outil `svelte-autofixer` du MCP Svelte (version lue dans `apps/svelte/node_modules/svelte/package.json`) jusqu'à ce qu'il ne signale plus rien.
- Toute correction manuelle (humain, ou IA après un échec constaté) est notée dans `results/journal-svelte.md` avec sa catégorie (bug, syntaxe obsolète, écart à la spec, configuration) et son auteur.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1, US2, US3)

## Path Conventions

Projet unique `apps/svelte/` (voir la structure de [plan.md](plan.md)). Les chemins ci-dessous sont relatifs à la racine du dépôt.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: projet npm indépendant `apps/svelte`, configuré selon le contrat d'intégration et le gabarit officiel `svelte-ts`.

- [X] T001 Créer `apps/svelte/package.json` : `"name": "@spike/svelte"`, `"private": true`, `"type": "module"`, scripts `"build": "svelte-check --tsconfig ./tsconfig.app.json && vite build"` et `"preview": "vite preview"`, `dependencies` `svelte` ^5.57, `@threlte/core` ^8.6, `three` ^0.186, `devDependencies` `@sveltejs/vite-plugin-svelte` ^7.3, `vite` ^8.3.5, `typescript` ~6.0, `svelte-check` ^4.7, `@tsconfig/svelte` ^5.0, `@types/three` ^0.186, `@types/node` ^24 (version du gabarit officiel) (research R1). Aucune autre dépendance.
- [X] T002 [P] Créer `apps/svelte/vite.config.ts` sur le modèle de `apps/temoin/vite.config.ts` : `plugins: [svelte()]`, `resolve.alias["@shared"]` vers `../../shared`, `server.fs.allow: [".", shared]`, `build.manifest: true`, `build.rollupOptions.input` avec les 4 entrées `dashboard`, `overlay-a`, `overlay-b`, `overlay-3d`, `preview: { port: 4175, strictPort: true }` (research R2).
- [X] T003 [P] Créer `apps/svelte/svelte.config.js` : `compilerOptions.runes` = fonction `({ filename }) => filename.split(/[/\\]/).includes("node_modules") ? undefined : true` (research R3).
- [X] T004 [P] Créer `apps/svelte/tsconfig.json` (références vers `tsconfig.app.json` et `tsconfig.node.json`), `apps/svelte/tsconfig.app.json` (étend `@tsconfig/svelte/tsconfig.json`, `strict: true`, `allowImportingTsExtensions: true`, `noEmit: true`, `types: ["svelte", "vite/client"]`, `paths: { "@shared/*": ["../../shared/*"] }`, `include: ["src/**/*.ts", "src/**/*.svelte"]`) et `apps/svelte/tsconfig.node.json` (couvre `vite.config.ts`, `types: ["node"]`) (research R11).
- [X] T005 [P] Créer les 4 entrées HTML `apps/svelte/dashboard.html`, `apps/svelte/overlay-a.html`, `apps/svelte/overlay-b.html`, `apps/svelte/overlay-3d.html` (`lang="fr"`, charset, viewport, titre, `<div id="app"></div>`, `<script type="module" src="/src/<page>.ts">`), comme celles du témoin.
- [X] T006 Lancer `npm install` dans `apps/svelte/` pour produire `apps/svelte/package-lock.json`. Noter dans `results/journal-svelte.md` les versions réellement installées de `svelte`, `@threlte/core`, `three`, `vite`, `typescript`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: état réactif partagé par toutes les pages et styles communs.

**⚠️ CRITICAL**: aucune story ne commence avant la fin de cette phase.

- [X] T007 Créer `apps/svelte/src/app.css` : `html, body { margin: 0; background: transparent; overflow: hidden; font-family: system-ui, "Segoe UI", sans-serif; }` (FR-020, US2-7) et `@keyframes alerte` : `0%` `transform: scale(1); filter: brightness(1)`, `30%` `transform: scale(1.15); filter: brightness(2.5)`, `100%` retour à `scale(1)` / `brightness(1)` (FR-023).
- [X] T008 Créer `apps/svelte/src/lib/live.svelte.ts` : classe `Live` selon [data-model.md](data-model.md). Champs `vars = $state.raw<VariableDef[]>([])`, `values = $state<Values>({})`, `connected = $state(false)`, `alerte = $state({ actif: false, numero: 0 })` et `debut` non réactif. Le constructeur reçoit `{ role, name?, ignorer? }` et appelle **une seule fois** `connect()` de `@shared/client.ts`. `onStatus` → `connected`. `onWelcome` → remplace `vars` et `values`, à chaque reconnexion. `onUpdate` → `values[id] = value`, sauf si `ignorer?.(id)`. `onAlert` → `numero + 1`, `debut = performance.now()`, `actif = true`, minuteur unique de `ALERT_DURATION_MS` (`@shared/protocol.ts`) réarmé à chaque alerte puis `actif = false`. Méthodes `set(id, value)` (met à jour `values[id]` puis envoie), `alert()`, `def(id)` (research R4).
- [X] T009 [P] Créer `apps/svelte/src/lib/alerte.ts` : `rejouer(numero: number)` renvoie une attachment (`Attachment` de `svelte/attachments`) qui, si `numero > 0`, lance `element.animate(<keyframes identiques à T007>, { duration: ALERT_DURATION_MS, easing: "ease-out" })` et renvoie un nettoyage qui annule cette animation. L'animation repart donc du début à chaque nouveau numéro (FR-023, US2-5, research R7).
- [X] T010 Passer `apps/svelte/src/lib/live.svelte.ts` dans `svelte-autofixer`, puis lancer `npx svelte-check --tsconfig ./tsconfig.app.json` dans `apps/svelte/` : 0 erreur, 0 avertissement.

**Checkpoint**: fondation prête, les stories peuvent commencer.

---

## Phase 3: User Story 1 - Piloter les variables du live depuis le dashboard (Priority: P1) 🎯 MVP

**Goal**: dashboard généré depuis `welcome`, un contrôle natif par variable, envoi immédiat à chaque événement, bouton « Alerte », indicateur de connexion.

**Independent Test**: build de production servi sur 4175 et service lancé. Le dashboard affiche 5 champs typés avec libellé et valeur. Un client d'écoute reçoit chaque modification (une par frappe) et l'alerte. Une modification venue d'ailleurs s'affiche. L'indicateur suit la coupure et le retour du service. La liste `variables.alt.json` est prise en compte au rechargement.

### Implementation for User Story 1

- [X] T011 [P] [US1] Créer `apps/svelte/src/components/Champ.svelte` : props `def: VariableDef`, `value: VarValue`, `onchange(value)`. Rendu `<label class="champ"><span>{def.label}</span><input …></label>` avec un `{#if}` sur `def.type` : `text` → `input type="text" maxlength={def.maxLength}`, envoi à chaque `input` ; `number` → `input type="number" min max step="1"`, envoi à chaque `input` seulement si `valueAsNumber` est un entier dans `[min, max]` ; `boolean` → `input type="checkbox" checked={…}`, envoi à chaque `change` ; `color` → `input type="color"`, envoi à chaque `input` de la valeur en minuscules ; `speed` → `input type="range" min max step`, envoi à chaque `input` de `Number(value)`. Chaque `input` porte `data-var={def.id}`. Liaison à sens unique (`value={…}`), pas de `bind:` ni de `$effect` d'envoi, aucun throttle ni debounce (FR-011, FR-012, FR-045, research R5).
- [X] T012 [US1] Créer `apps/svelte/src/components/Dashboard.svelte` : instancie `new Live({ role: "dashboard", ignorer })`, où `ignorer(id)` est vrai si `document.activeElement` porte `data-var === id` (research R6). Racine `<main class="dashboard" data-connection={live.connected ? "on" : "off"}>` avec un titre, l'état « ● Connecté » ou « ● Déconnecté », `{#each live.vars as def (def.id)}<Champ …>{/each}` dans l'ordre reçu, branché sur `live.set(def.id, v)`, et `<button class="alerte-btn" data-action="alerte" onclick={() => live.alert()}>Alerte</button>`. Styles du dashboard (fond sombre, `min-height: 100vh`, `overflow: auto`) dans le `<style>` du composant (FR-010, FR-013, FR-014).
- [X] T013 [US1] Créer `apps/svelte/src/dashboard.ts` : `import "./app.css"`, puis `mount(Dashboard, { target: document.getElementById("app")! })`.
- [X] T014 [US1] Passer `Champ.svelte` et `Dashboard.svelte` dans `svelte-autofixer` jusqu'à 0 remarque, puis `npm run build` dans `apps/svelte/` : 0 erreur, 0 avertissement.
- [X] T015 [US1] Point de contrôle US1 : servir le build (`npm run preview`), puis exécuter un script Playwright jetable (dossier scratchpad) qui lance, arrête et relance lui-même le service (`node shared/server/index.ts`, avec `--vars shared/variables.alt.json` pour US1-6), comme la fixture de la suite, et qui vérifie US1-1 à US1-6, BORD-titre-long, BORD-bornes et BORD-deux-dashboards, et enregistre des captures du dashboard. Noter le résultat et l'horodatage dans `results/journal-svelte.md`.

**Checkpoint**: le dashboard pilote le service. US1 est testable seule.

---

## Phase 4: User Story 2 - Diffuser deux overlays 2D synchronisés dans OBS (Priority: P1)

**Goal**: overlay A (titre et score) et overlay B (bandeau « EN DIRECT »), transparents en 1920×1080, synchronisés, avec l'animation d'alerte de 2 s et la reconnexion automatique.

**Independent Test**: ouvrir `overlay-a.html` et `overlay-b.html` (build de production) et les piloter avec un client de test. L'état courant s'affiche à l'ouverture. Les valeurs suivent. Le bandeau s'affiche ou se masque. `data-alert` passe à `on` puis à `off` après 2 s, et se relance si une alerte arrive pendant une alerte. L'overlay se reconnecte après un redémarrage du service. Fond transparent, sans barre de défilement.

### Implementation for User Story 2

- [X] T016 [P] [US2] Créer `apps/svelte/src/components/OverlayA.svelte` : `new Live({ role: "overlay", name: "overlay-a" })`. Racine `<main data-alert={live.alerte.actif ? "on" : "off"}>` contenant une carte `{@attach rejouer(live.alerte.numero)}` avec `<h1 class="titre" data-var="titre" data-value={serialize("text", titre)}>{titre}</h1>` et `<p class="score" data-var="score" data-value={serialize("number", score)}>{score}</p>`. Rien n'est rendu tant que `welcome` n'est pas arrivé (`data-var` absent). Le titre vide ne casse pas la mise en page ; jusqu'à 80 caractères, il reste lisible dans 1920×1080 (`max-width`, `overflow-wrap: anywhere`). Styles dans le composant (FR-021 à FR-023, FR-040 à FR-042).
- [X] T017 [P] [US2] Créer `apps/svelte/src/components/OverlayB.svelte` : `new Live({ role: "overlay", name: "overlay-b" })`. Racine `<main data-alert=…>` contenant `<div class={["bandeau", !visible && "cache"]} data-var="bandeau" data-value={serialize("boolean", visible)} {@attach rejouer(live.alerte.numero)}>EN DIRECT</div>`, toujours présent une fois `welcome` reçu. `.cache { display: none }`. Seule la variable `bandeau` est affichée (FR-021, FR-040).
- [X] T018 [P] [US2] Créer `apps/svelte/src/overlay-a.ts` et `apps/svelte/src/overlay-b.ts` : `import "./app.css"` puis `mount` du composant correspondant sur `#app`.
- [X] T019 [US2] Passer `OverlayA.svelte` et `OverlayB.svelte` dans `svelte-autofixer` jusqu'à 0 remarque, puis `npm run build` : 0 erreur, 0 avertissement.
- [X] T020 [US2] Point de contrôle US2 : script Playwright jetable (dossier scratchpad) sur le build de production, qui vérifie US2-1 à US2-7, BORD-service-absent, BORD-rafale et BORD-titre-vide, et enregistre des captures des deux overlays (au repos, pendant une alerte, titre de 80 caractères). Noter le résultat dans `results/journal-svelte.md`.

**Checkpoint**: US1 et US2 fonctionnent ensemble et séparément.

---

## Phase 5: User Story 3 - Afficher un élément 3D piloté par les variables (Priority: P2)

**Goal**: overlay 3D Threlte avec Suzanne en rotation continue, couleur et vitesse pilotées, saut et 2 tours à l'alerte, repli 2D sans WebGL ou sans modèle, compteur FPS avec `?debug=1`.

**Independent Test**: ouvrir `overlay-3d.html`. Le canvas WebGL s'affiche sans erreur console. `data-value` de `couleur` et `vitesse` suit le client de test (vitesse 0 comprise). `data-alert` dure 2 s. Avec `--disable-3d-apis`, ou si le `.glb` est bloqué, « 3D indisponible » s'affiche et suit la couleur. `?debug=1` affiche le compteur et envoie des `fps`. Sans ce paramètre, aucun compteur.

### Implementation for User Story 3

- [X] T021 [P] [US3] Créer `apps/svelte/src/lib/webgl.ts` : `webglDisponible(): boolean`, vrai si `document.createElement("canvas")` fournit un contexte `webgl2` ou `webgl` (research R9).
- [X] T022 [P] [US3] Créer `apps/svelte/src/components/Scene.svelte` (contenu du `<Canvas>`) : props `geometry: BufferGeometry` et `live: Live`. `<T.PerspectiveCamera makeDefault position={[0, 0, 4]}>`, une `T.AmbientLight` et une `T.DirectionalLight`, `<T.Mesh {geometry} bind:ref={mesh}><T.MeshStandardMaterial color={live.values.couleur} roughness={0.5} metalness={0} /></T.Mesh>`. `useTask((delta) => …)` de `@threlte/core` : `angle += vitesse × 2π × delta` (0 arrête la rotation) ; si `t = (performance.now() − live.debut) / 2000` est dans `[0, 1[`, avec `e = 1 − (1 − t)³` : `mesh.position.y = 0.5 × sin(π × e)` et `mesh.rotation.y = angle + 4π × e`, sinon `position.y = 0` et `rotation.y = angle`. Pas de librairie d'animation (FR-030 à FR-032, research R8).
- [X] T023 [US3] Créer `apps/svelte/src/components/Overlay3D.svelte` : `new Live({ role: "overlay", name: "overlay-3d" })` ; `repli = $state(!webglDisponible())` ; si WebGL est disponible, `new GLTFLoader().loadAsync(modelUrl)` (`three/addons/loaders/GLTFLoader.js`, `import modelUrl from "@shared/assets/model.glb?url"`) est appelé une fois ; en cas de succès, la géométrie du premier `Mesh` de `gltf.scene` est rangée dans `geometry = $state.raw<BufferGeometry | null>(null)` ; en cas d'échec, le rejet est intercepté (`.catch`) et met `repli = true`, sans rejet non géré ni erreur console. Racine `<main data-alert=…>` contenant `<div class="scene">` (1920×1080) : en repli, `<div class="repli" data-var="couleur" data-value={serialize("color", couleur)}><div class="disque" style:background={couleur}></div>3D indisponible</div>` ; sinon `<span hidden data-var="couleur" data-value=…>` et `{#if geometry}<Canvas><Scene {geometry} {live} /></Canvas>{/if}` ; dans les deux cas `<span hidden data-var="vitesse" data-value={serialize("speed", vitesse)}>`. Un seul élément par `data-var`. Tout le contenu de `.scene`, Canvas compris, n'est rendu qu'une fois `welcome` reçu : couleur et vitesse sont donc toujours définies. Le chargement du modèle, lui, démarre dès l'ouverture. Aucune erreur en console (FR-033, FR-040, contrat [app-svelte.md](contracts/app-svelte.md)).
- [X] T024 [US3] Créer `apps/svelte/src/overlay-3d.ts` : `import "./app.css"` puis `mount(Overlay3D, { target: document.getElementById("app")! })`. Le compteur FPS est démarré par `connect` avec `?debug=1`, l'app n'ajoute rien (FR-034).
- [X] T025 [US3] Passer `Scene.svelte` et `Overlay3D.svelte` dans `svelte-autofixer` jusqu'à 0 remarque, puis `npm run build` : 0 erreur, 0 avertissement.
- [X] T026 [US3] Point de contrôle US3 : script Playwright jetable (dossier scratchpad) sur le build de production, avec `--use-angle=swiftshader --enable-unsafe-swiftshader` pour US3-1 à US3-4 et US3-6, `--disable-3d-apis` pour US3-5, et `.glb` bloqué pour BORD-modele-absent. Enregistrer des captures (scène, alerte en cours, repli, compteur FPS). Noter le résultat dans `results/journal-svelte.md`.

**Checkpoint**: les trois stories fonctionnent sur le build de production.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: conformité à la constitution et contrat d'acceptation complet.

- [X] T027 Vérifier la conformité dans `apps/svelte/src/` : aucune occurrence de `export let`, de `$:` ni de `svelte/store` ; aucun import depuis `apps/` ; une seule connexion `connect()` par page ; `git status shared/` ne montre aucune modification.
- [X] T028 Reconstruire (`npm run build` dans `apps/svelte/`) et vérifier que `apps/svelte/dist/.vite/manifest.json` contient les 4 entrées `dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html`.
- [X] T029 Campagne E2E complète : vérifier qu'OBS est fermé (`Get-Process obs64` ne renvoie rien, sinon demander à Lilian de le fermer) et qu'aucun service n'écoute déjà sur 8787. Servir le build (`npm run preview`, port 4175), puis lancer depuis `shared/` `$env:APP_URL="http://localhost:4175"; $env:FRAMEWORK="svelte"; npm run e2e`, sans `--grep`. Noter la campagne (n°, horodatage, réussis, échoués) dans `results/journal-svelte.md`. En cas d'échec, corriger l'app (jamais `shared/`), noter chaque correction (catégorie, auteur) et relancer la suite entière, jusqu'au vert.
- [X] T030 Mettre à jour `results/journal-svelte.md` : heure de fin de `/speckit-implement`, durée totale, nombre de corrections manuelles et de campagnes avant le vert. Laisser à Lilian la section « Ressenti (/5) ». Rappeler à Lilian de retirer le MCP Svelte à la fin de la phase (`claude mcp remove svelte --scope user`).

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)** : T001 d'abord, puis T002 à T005 en parallèle, puis T006 (installation).
- **Foundational (Phase 2)** : dépend de T006. T007, T008 et T009 sont indépendants ; T010 suit T008.
- **US1 (Phase 3)**, **US2 (Phase 4)** et **US3 (Phase 5)** : dépendent de la phase 2 seulement. Ordre retenu : priorité P1 puis P2 (US1 → US2 → US3), une story à la fois.
- **Polish (Phase 6)** : dépend des trois stories.

### User Story Dependencies

- **US1 (P1)** : aucune dépendance envers une autre story.
- **US2 (P1)** : aucune. Le point de contrôle pilote les overlays avec un client de test, pas avec le dashboard.
- **US3 (P2)** : aucune. Elle réutilise `Live` et `app.css` (phase 2).

### Within Each User Story

- Composants enfants avant le composant racine (T011 → T012, T022 → T023).
- Point d'entrée `src/<page>.ts` après le composant racine.
- `svelte-autofixer` et `npm run build` avant le point de contrôle.

### Parallel Opportunities

- Phase 1 : T002, T003, T004, T005.
- Phase 2 : T009 en parallèle de T007 et T008.
- US2 : T016, T017 et T018 (fichiers distincts).
- US3 : T021 et T022.

---

## Parallel Example: User Story 2

```text
Task: "Créer apps/svelte/src/components/OverlayA.svelte"   (T016)
Task: "Créer apps/svelte/src/components/OverlayB.svelte"   (T017)
Task: "Créer apps/svelte/src/overlay-a.ts et overlay-b.ts" (T018)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1 (Setup) puis phase 2 (Foundational).
2. Phase 3 (US1) : le dashboard pilote le service.
3. **STOP and VALIDATE** : point de contrôle T015.

### Incremental Delivery

1. Setup + Foundational → fondation prête.
2. US1 → point de contrôle T015.
3. US2 → point de contrôle T020.
4. US3 → point de contrôle T026.
5. Polish → campagne E2E complète (T029) jusqu'au vert.

---

## Notes

- La suite partagée n'est jamais lancée partiellement : `grille.ts` retient la première campagne sans échec comme « vert ».
- Les mesures (poids, lignes, latence, alertes, FPS, CPU) viennent après le vert, avec OBS, selon `results/protocole-obs.md`. Elles ne font pas partie de ces tâches.
- Commit à la fin de chaque phase ou story, sur `005-spike-svelte`.

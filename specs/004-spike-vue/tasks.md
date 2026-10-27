---

description: "Liste des tâches de l'implémentation Vue du spike"
---

# Tasks: Spike overlays live, implémentation Vue

**Input** : documents de conception de `specs/004-spike-vue/` ([plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/pages-vue.md](contracts/pages-vue.md), [quickstart.md](quickstart.md))

**Tests** : aucune tâche n'écrit de test. Le contrat d'acceptation est la suite partagée `shared/e2e` (34 tests), lancée **telle quelle et en entier** avec `FRAMEWORK=vue` (constitution II et VI). Chaque story se termine par un point de contrôle : un script Playwright jetable, écrit **hors du dépôt** dans le dossier temporaire de session, et une capture d'écran (research R7).

**Règles permanentes pour toutes les tâches** :
- Ne jamais lire ni ouvrir `apps/react` (constitution I). La seule référence d'implémentation autorisée est `apps/temoin`.
- Ne jamais modifier `shared/` (constitution II).
- Ne jamais lancer `shared/e2e` avec `--grep` ni sur une partie de la suite. Avant chaque campagne : `Get-Process obs64` ne doit rien renvoyer (sinon, demander à Lilian de fermer OBS).
- Toute correction manuelle va dans `results/journal-vue.md`, avec sa catégorie (bug, syntaxe obsolète, écart à la spec, configuration) et son auteur.
- Toujours sérialiser `data-value` avec `serialize()` de `@shared/protocol.ts`.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : tâche parallélisable (fichiers différents, aucune dépendance sur une tâche non terminée)
- **[Story]** : US1, US2 ou US3 (les user stories de la spec)

---

## Phase 1 : Setup (projet `apps/vue`)

**Purpose** : créer le projet npm indépendant et sa configuration de build, conformes à `specs/002-infra-commune/contracts/integration-apps.md`.

- [X] T001 Créer `apps/vue/package.json` : `"name": "@spike/vue"`, `"private": true`, `"type": "module"`. Scripts : `"build": "vue-tsc --noEmit -p tsconfig.json && vite build"` et `"preview": "vite preview"`. Dépendances en **versions exactes** (research R1) : `vue@3.5.44`, `pinia@4.1.0`, `@tresjs/core@5.10.0`, `@tresjs/cientos@5.10.0`, `three@0.186.1`. Dépendances de dev : `vite@8.3.5`, `@vitejs/plugin-vue@6.0.10`, `vue-tsc@3.3.13`, `typescript@6.0.3`, `@types/three@0.186.0`. Ensuite, lancer `npm install` dans `apps/vue`, qui crée `apps/vue/package-lock.json`.
- [X] T002 [P] Créer `apps/vue/tsconfig.json` : `strict: true`, `allowImportingTsExtensions: true`, `noEmit: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `target: "es2023"`, `lib: ["es2023", "dom", "dom.iterable"]`, `types: ["vite/client"]`, `paths: { "@shared/*": ["../../shared/*"] }`, `skipLibCheck: true`, `include: ["env.d.ts", "src/**/*.ts", "src/**/*.vue"]`. Créer `apps/vue/env.d.ts` avec `/// <reference types="vite/client" />`.
- [X] T003 [P] Créer `apps/vue/vite.config.ts` :
  - `plugins: [vue({ template: { compilerOptions: templateCompilerOptions.template.compilerOptions } })]`, avec `templateCompilerOptions` importé de `@tresjs/core` (R5) ;
  - `resolve.alias["@shared"]` vers `../../shared`, résolu par `fileURLToPath(new URL(...))` comme dans `apps/temoin/vite.config.ts` ;
  - `server.fs.allow: [".", shared]` ;
  - `build.manifest: true` ;
  - `build.rollupOptions.input` avec les 4 entrées `dashboard`, `overlay-a`, `overlay-b` et `overlay-3d` ;
  - `preview: { port: 4174, strictPort: true }`.
- [X] T004 [P] Créer les 4 pages HTML à la racine de `apps/vue/` (`dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html`). Chacune a `lang="fr"`, `<meta charset="utf-8">`, le viewport, un titre (« Dashboard — Vue », « Overlay A — Vue », etc.), `<div id="app"></div>` et un script module qui pointe respectivement vers `/src/dashboard/main.ts`, `/src/overlays/overlay-a.ts`, `/src/overlays/overlay-b.ts` et `/src/overlay-3d/main.ts`.

---

## Phase 2 : Foundational (état et connexion communs aux 4 pages)

**Purpose** : le store Pinia, la connexion unique et l'alerte, utilisés par toutes les stories.

**⚠️ CRITICAL** : aucune story ne peut commencer avant la fin de cette phase.

- [X] T005 Créer `apps/vue/src/live/store.ts` : setup store Pinia `useLiveStore = defineStore("live", () => …)` ([data-model.md](data-model.md)).
  - État :
    - `vars = ref<VariableDef[]>([])` ;
    - `values = reactive<Values>({})` ;
    - `connected = ref(false)` ;
    - `alerteSeq = ref(0)`.
  - Mutations internes, appelées par la connexion :
    - `recevoirBienvenue(vars, values)` : remplace `vars` et **toutes** les clés de `values`, en supprimant celles qui ont disparu ;
    - `recevoirMiseAJour(id, value)` : `values[id] = value` ;
    - `recevoirAlerte(seq)` : `alerteSeq = seq` ;
    - `changerStatut(connected)`.
  - Actions publiques : `set(id, value)` et `alerte()`. Elles appellent la connexion et **ne modifient pas `values` localement** : la valeur affichée vient toujours de l'écho `update`.
  - Types importés de `@shared/protocol.ts`.
- [X] T006 Créer `apps/vue/src/live/connexion.ts` : `brancher(store, options: { role: "dashboard" } | { role: "overlay"; name: OverlayName })` appelle **une seule fois** `connect()` de `@shared/client.ts`. Il relie `onWelcome`, `onUpdate`, `onAlert` et `onStatus` aux mutations du store, et donne au store les fonctions `set` et `alert` de la connexion. Créer aussi un utilitaire `demarrer(Racine, options)` : `createApp(Racine)`, `use(createPinia())`, `brancher(useLiveStore(pinia), options)`, puis `mount("#app")`. Il n'y a aucun autre WebSocket.
- [X] T007 [P] Créer `apps/vue/src/live/useAlerte.ts` : composable `useAlerte(cibles?: () => HTMLElement[])` qui renvoie `{ actif: Ref<boolean>, debut: Ref<number> }` ([research.md](research.md) R4). Un `watch` sur `store.alerteSeq` fait, à chaque nouvelle alerte :
  - `actif = true` et `debut = performance.now()` ;
  - pour chaque cible, l'annulation de l'animation précédente, puis `el.animate([{ transform: "scale(1)", filter: "brightness(1)" }, { transform: "scale(1.15)", filter: "brightness(2.5)", offset: 0.3 }, { transform: "scale(1)", filter: "brightness(1)" }], { duration: ALERT_DURATION_MS, easing: "ease-out" })` ;
  - `clearTimeout` du minuteur précédent, puis `setTimeout(() => actif = false, ALERT_DURATION_MS)`.

  Le minuteur est nettoyé dans `onUnmounted`. `ALERT_DURATION_MS` vient de `@shared/protocol.ts`.
- [X] T008 [P] Créer `apps/vue/src/styles/overlay.css` :
  - `html, body { margin: 0; background: transparent; overflow: hidden; font-family: system-ui, "Segoe UI", sans-serif }` ;
  - `#app` et `.overlay` en `1920px × 1080px`, en position relative ;
  - la mise en page des overlays 2D : `.carte` en haut à gauche, texte blanc avec ombre, `.titre` à 64 px avec `max-width: 1760px` et `overflow-wrap: anywhere` (un titre de 80 caractères ne déborde pas), `.score` à 96 px en chiffres tabulaires, `.bandeau` centré en bas sur fond rouge à 56 px, avec `transform-origin: center` ;
  - la classe `.cache { display: none }` et le repli 3D (`.repli` centré, `.disque` de 240 px en cercle).

**Checkpoint** : `npm run build` passe dans `apps/vue`, même avec des composants racine provisoires.

---

## Phase 3 : User Story 1, piloter les variables depuis le dashboard (Priority: P1) 🎯 MVP

**Goal** : un dashboard qui génère un contrôle natif par variable reçue, diffuse chaque saisie sans regroupement, envoie l'alerte et affiche l'état de connexion (FR-010 à FR-014, FR-045).

**Independent Test** : avec `npm run serveur` (dans `shared/`) et `npm run preview` (dans `apps/vue`), ouvrir `http://localhost:4174/dashboard.html`. On doit voir 5 champs du bon type, avec libellé et valeur courante. Chaque saisie doit être reçue par un client d'écoute, et le bouton Alerte doit émettre `alert`. Arrêter le service doit faire passer `data-connection` à `off`.

- [X] T009 [P] [US1] Créer `apps/vue/src/dashboard/Champ.vue` (`<script setup lang="ts">`, prop `def: VariableDef`). Il affiche `<label class="champ"><span>{{ def.label }}</span><input …></label>`.
  - Type de l'`<input>` selon `def.type` : `text` → `type="text"` avec `:maxlength="def.maxLength"` ; `number` → `type="number"` avec `:min`, `:max` et `step="1"` ; `boolean` → `type="checkbox"` ; `color` → `type="color"` ; `speed` → `type="range"` avec `:min`, `:max` et `:step`. Les bornes viennent **toujours** de `def`, jamais de constantes.
  - L'input porte `:data-var="def.id"`. **Aucun autre élément** du composant ne porte `data-var`.
  - Liaison unidirectionnelle : `:value` (ou `:checked` pour le booléen) avec `store.values[def.id]`. Ne pas réécrire la valeur affichée tant que l'input a le focus (`document.activeElement === el`) : l'écho d'une frappe ne doit pas l'écraser. Les autres champs suivent toutes les mises à jour (US1-4).
  - Envoi : `@input` (texte, nombre, couleur, curseur) ou `@change` (case à cocher). Chaque événement appelle aussitôt `store.set(def.id, valeur)`, **sans debounce ni throttle** (FR-012). Valeurs envoyées : texte tel quel ; nombre seulement si `value !== ""`, entier et compris entre `def.min` et `def.max` (« entiers entre −999 999 et 999 999 ») ; booléen = `checked` ; couleur = `value` ; vitesse = `Number(value)`.
- [X] T010 [US1] Créer `apps/vue/src/dashboard/Dashboard.vue`. La racine `<main class="dashboard" :data-connection="store.connected ? 'on' : 'off'">` contient :
  - un `<h1>` (« Dashboard — Vue ») ;
  - un indicateur `<p class="etat">` qui affiche « ● Connecté » ou « ● Déconnecté » ;
  - un `<form class="champs" @submit.prevent>` qui fait un `v-for="def in store.vars" :key="def.id"` de `<Champ :def="def" />`, **dans l'ordre reçu** (US1-6 vérifie l'ordre `titre, sous-titre, score, bandeau, couleur` avec `variables.alt.json`) ;
  - `<button type="button" class="alerte-btn" data-action="alerte" @click="store.alerte()">Alerte</button>`.
- [X] T011 [P] [US1] Créer `apps/vue/src/dashboard/dashboard.css` : fond sombre, page qui défile normalement (`overflow: auto`, ce n'est pas un overlay), grille des champs de 480 px maximum, couleurs de l'indicateur (vert si connecté, rouge sinon), bouton Alerte bien visible.
- [X] T012 [US1] Créer `apps/vue/src/dashboard/main.ts` : importer `dashboard.css` et appeler `demarrer(Dashboard, { role: "dashboard" })`.
- [X] T013 [US1] Point de contrôle US1 : `npm run build` puis `npm run preview` dans `apps/vue`, avec `npm run serveur` lancé dans `shared/`. Un script Playwright jetable, écrit dans le dossier temporaire de session, **hors du dépôt**, vérifie :
  - les 5 `[data-var]` et leurs types ;
  - les valeurs par défaut ;
  - qu'une frappe dans le titre envoie une mise à jour par caractère (lue par un client WebSocket `role: "test"`) ;
  - que le bouton Alerte émet `alert` ;
  - que la limite de 80 caractères est appliquée.

  Il prend une capture d'écran du dashboard. Noter le résultat et les heures dans `results/journal-vue.md`, puis arrêter le service.

**Checkpoint** : le dashboard est fonctionnel et vérifiable seul (MVP).

---

## Phase 4 : User Story 2, deux overlays 2D synchronisés (Priority: P1)

**Goal** : l'overlay A (titre et score) et l'overlay B (bandeau « EN DIRECT ») affichent l'état courant dès la connexion, suivent chaque mise à jour, jouent l'alerte de 2 s, relancée si une alerte arrive en cours, et se reconnectent seuls, sur un fond transparent en 1920×1080 (FR-020 à FR-024, FR-040 à FR-043).

**Independent Test** : ouvrir `overlay-a.html` et `overlay-b.html` et les piloter par un client de test : `set titre/score/bandeau`, puis `alert`. Vérifier `data-value`, le texte, la visibilité du bandeau et `data-alert` (on, puis off au bout d'environ 2 s), puis la reconnexion après l'arrêt et le redémarrage du service.

- [X] T014 [P] [US2] Créer `apps/vue/src/overlays/OverlayA.vue`. La racine `<div class="overlay" :data-alert="actif ? 'on' : 'off'">` contient `<div class="carte" ref="carte">`, avec :
  - `<h1 class="titre" data-var="titre" :data-value="serialize('text', titre)">{{ titre }}</h1>` ;
  - `<p class="score" data-var="score" :data-value="serialize('number', score)">{{ score }}</p>`.

  `titre` et `score` sont lus dans `store.values`. Tant que le `welcome` n'est pas reçu, ne rien afficher, et ne pas poser de `data-value` erroné : l'attribut est absent tant que la valeur est `undefined` (BORD-service-absent). Un titre vide affiche un `<h1>` vide, sans casser la mise en page. Appeler `useAlerte(() => [carte])`.
- [X] T015 [P] [US2] Créer `apps/vue/src/overlays/OverlayB.vue`. La racine `<div class="overlay" :data-alert="actif ? 'on' : 'off'">` contient `<div class="bandeau" ref="bandeau" data-var="bandeau" :data-value="serialize('boolean', visible)" v-show="visible === true">EN DIRECT</div>`. L'élément est **toujours rendu** (`v-show`, pas `v-if`), avec `data-value` même s'il est masqué (FR-040). Seule la variable `bandeau` met à jour cet overlay (FR-021). Même règle que T014 pour l'absence de `data-value` avant le `welcome`. Appeler `useAlerte(() => [bandeau])`.
- [X] T016 [P] [US2] Créer `apps/vue/src/overlays/overlay-a.ts` et `apps/vue/src/overlays/overlay-b.ts`. Chacun importe `../styles/overlay.css` et appelle `demarrer(OverlayA, { role: "overlay", name: "overlay-a" })` ou `demarrer(OverlayB, { role: "overlay", name: "overlay-b" })`.
- [X] T017 [US2] Point de contrôle US2 : rebuild, preview, et service lancé. Un script Playwright jetable, hors dépôt, ouvre les deux overlays en 1920×1080 et vérifie :
  - l'état courant à l'ouverture ;
  - une mise à jour du titre, du score et du bandeau (vrai et faux) ;
  - qu'une alerte donne `data-alert="on"` en moins de 300 ms et `off` entre 1,7 et 2,3 s ;
  - qu'une alerte à t+1 s repousse `off` vers 3 s ;
  - la reconnexion après l'arrêt et le redémarrage du service ;
  - `html` et `body` transparents et l'absence de barre de défilement.

  Il prend une capture d'écran de chaque overlay en pleine alerte. Noter le résultat dans `results/journal-vue.md`.

**Checkpoint** : US1 et US2 fonctionnent chacune de façon indépendante.

---

## Phase 5 : User Story 3, élément 3D piloté par les variables (Priority: P2)

**Goal** : le modèle `shared/assets/model.glb` tourne à la vitesse courante, prend la couleur courante et joue l'alerte 3D (saut de 0,5 unité et 2 tours en 2 s, ease-out). Un repli 2D « 3D indisponible » s'affiche si WebGL manque ou si le modèle ne se charge pas, et le compteur FPS n'apparaît qu'avec `?debug=1` (FR-030 à FR-034).

**Independent Test** : ouvrir `overlay-3d.html` : vérifier le canvas WebGL, les `data-value` de couleur et de vitesse, les changements par le client de test et `data-alert` pendant l'alerte. Puis ouvrir la page avec `?debug=1` (compteur FPS), dans Chromium lancé avec `--disable-3d-apis` (repli), et avec la route `**/*.glb` coupée (repli).

- [X] T018 [P] [US3] Créer `apps/vue/src/overlay-3d/Repli.vue` (prop `couleur: string | undefined`) : `<div class="repli" data-var="couleur" :data-value="couleur && serialize('color', couleur)">` contient `<div class="disque" :style="{ background: couleur }">` et `<span>3D indisponible</span>`. C'est l'unique élément `data-var="couleur"` en mode repli (règle d'unicité).
- [X] T019 [P] [US3] Créer `apps/vue/src/overlay-3d/Modele.vue`, enfant de `TresCanvas`. Il est donc monté dans le contexte TresJS. Props : `couleur`, `vitesse` et `alerteDebut` (horodatage `performance.now()` de la dernière alerte, ou `null`). Émission : `erreur`.
  - Chargement : `useGLTF(modelUrl)` de `@tresjs/cientos`, avec `modelUrl` importé via `import modelUrl from "@shared/assets/model.glb?url"`. Si le chargement se termine sans modèle (`isLoading` passe à `false` alors que `state` est nul) ou si la promesse est rejetée, émettre `erreur`. **Vérifier au point de contrôle T023** comment Cientos signale réellement l'échec (research R5).
  - Rendu : `<TresGroup ref="groupe"><primitive :object="state.scene" /></TresGroup>`, centré à l'origine.
  - Couleur : un `watch` immédiat sur `couleur` et sur le modèle parcourt les maillages (`traverse`) et applique `material.color.set(couleur)`.
  - Boucle : `useLoop().onBeforeRender(({ delta }) => …)`.
    - `angle += vitesse * 2 * Math.PI * delta` (vitesse en tours/s ; 0 arrête la rotation).
    - Si `alerteDebut` n'est pas nul : `t = clamp((performance.now() - alerteDebut) / ALERT_DURATION_MS, 0, 1)` et `e = 1 - (1 - t) ** 3`, puis `groupe.position.y = 0.5 * Math.sin(Math.PI * e)` et `groupe.rotation.y = angle + 4 * Math.PI * e`. Sinon, `position.y = 0` et `rotation.y = angle`.
    - Une nouvelle alerte change `alerteDebut`, et le saut repart de 0 (FR-032).
- [X] T020 [US3] Créer `apps/vue/src/overlay-3d/Scene.vue` : `<TresCanvas window-size alpha :clear-alpha="0" @error="emit('erreur')">` contient :
  - `<TresPerspectiveCamera :position="[0, 0, 4]" :look-at="[0, 0, 0]" />` ;
  - `<TresAmbientLight :intensity="0.6" />` ;
  - `<TresDirectionalLight :position="[3, 4, 5]" :intensity="1.5" />` ;
  - `<Modele … @erreur="emit('erreur')" />`.

  Il transmet les props `couleur`, `vitesse` et `alerteDebut`. Le fond reste transparent : aucune `clearColor` opaque.
- [X] T021 [US3] Créer `apps/vue/src/overlay-3d/Overlay3D.vue`. Racine : `<div class="overlay" :data-alert="actif ? 'on' : 'off'">`, avec `const { actif, debut } = useAlerte()` (sans cible DOM).
  - État `mode: "scene" | "repli"`. Au `setup`, tester WebGL sur un canvas jetable : `document.createElement("canvas").getContext("webgl2") ?? getContext("webgl")`. S'il manque, `mode = "repli"` et `TresCanvas` n'est jamais monté (US3-5).
  - Mode scène : `<div class="scene">` contient `<Scene … @erreur="mode = 'repli'" />`, puis `<span class="cache" data-var="couleur" :data-value="…">`.
  - Mode repli : `<Repli :couleur="couleur" />` **à la place** du `span` couleur.
  - Dans les deux modes : `<span class="cache" data-var="vitesse" :data-value="serialize('speed', vitesse)">`.
  - Une fois en mode repli, on n'en sort plus.
  - Les `data-value` sont absents tant que le `welcome` n'est pas reçu.
- [X] T022 [US3] Créer `apps/vue/src/overlay-3d/main.ts` : importer `../styles/overlay.css`, puis `demarrer(Overlay3D, { role: "overlay", name: "overlay-3d" })`. Le compteur FPS est démarré par `client.ts` quand l'URL contient `debug=1` : ne rien ajouter.
- [X] T023 [US3] Point de contrôle US3 : rebuild, preview, et service lancé. Le script Playwright jetable, hors dépôt, est lancé avec `--use-angle=swiftshader --enable-unsafe-swiftshader`. Il vérifie :
  - le canvas WebGL, l'absence du texte « 3D indisponible » et **l'absence de toute erreur de console** (US3-1) ;
  - le changement de couleur (`#FF8800` → `#ff8800`) et de vitesse (0, puis 1,5) ;
  - `data-alert` pendant 2 s ;
  - le compteur `[data-fps]` avec `?debug=1`, et son absence sinon.

  Puis il relance la page avec `--disable-3d-apis` (repli visible, couleur suivie) et avec `page.route("**/*.glb", r => r.abort())` (repli visible, un seul `data-var="couleur"`). Il prend des captures de la scène pendant une alerte et du repli. Noter dans `results/journal-vue.md` la façon dont Cientos signale l'échec du modèle, ainsi que toute correction.

**Checkpoint** : les trois stories fonctionnent chacune de façon indépendante.

---

## Phase 6 : Polish et validation finale

**Purpose** : faire passer la suite d'acceptation partagée et clore le journal.

- [X] T024 Contrôle de conformité avant la campagne :
  - `npm run build` sans erreur de type ;
  - rien n'a changé dans `shared/` (`git status shared` vide) ;
  - aucun fichier hors de `apps/vue/`, `specs/004-spike-vue/` et `results/` n'a été modifié ;
  - `apps/vue/dist/.vite/manifest.json` contient les 4 entrées ;
  - dans `apps/vue/src`, pas d'import de librairie d'animation, et aucun `debounce` ou `throttle` (`Grep`) ;
  - `vue@3.5.44` résolu dans `package-lock.json`.
- [X] T025 Campagne E2E complète : vérifier que `Get-Process obs64` ne renvoie rien et que le port 8787 est libre. Servir le build avec `npm run preview` dans `apps/vue`. Puis, dans `shared/` : `$env:APP_URL="http://localhost:4174"; $env:FRAMEWORK="vue"; npm run e2e` (suite entière, sans `--grep`). Noter la campagne dans `results/journal-vue.md` (horodatage, réussis, échoués, liste des échecs). En cas d'échec : corriger dans `apps/vue` uniquement, journaliser la correction (catégorie et auteur), reconstruire, puis relancer la suite **entière**. Répéter jusqu'à 34/34.
- [X] T026 Clore `results/journal-vue.md` :
  - heures de fin de chaque étape et temps total ;
  - nombre de corrections manuelles par catégorie et par auteur ;
  - nombre de campagnes E2E avant le vert ;
  - points de friction rencontrés (dont l'écart TypeScript 6, research R1).

  Laisser la section « Ressenti » à Lilian.
- [X] T027 Arrêter les processus lancés (preview, service) et vérifier que `git status` ne liste que `apps/vue/`, `specs/004-spike-vue/`, `results/journal-vue.md` et `results/mesures.json`.

---

## Dependencies & Execution Order

### Phases

- **Setup (Phase 1)** : T001 d'abord (installation). T002, T003 et T004 en parallèle ensuite.
- **Foundational (Phase 2)** : dépend de la phase 1. T005, puis T006 (qui utilise le store). T007 et T008 en parallèle de T005 et T006. Elle bloque toutes les stories.
- **US1 (Phase 3)** : dépend de la phase 2. Aucune dépendance sur les autres stories.
- **US2 (Phase 4)** : dépend de la phase 2 (dont `useAlerte`, T007). Indépendante de US1, car le client de test pilote les overlays.
- **US3 (Phase 5)** : dépend de la phase 2. Indépendante de US1 et US2.
- **Polish (Phase 6)** : dépend de la fin des trois stories (la suite couvre tout).

### Dans chaque story

- US1 : T009 et T011 en parallèle → T010 (utilise `Champ.vue`) → T012 → T013.
- US2 : T014, T015 et T016 en parallèle → T017.
- US3 : T018 et T019 en parallèle → T020 (utilise `Modele.vue`) → T021 (utilise `Scene.vue` et `Repli.vue`) → T022 → T023.

### Parallel Opportunities

```text
Phase 1 : T002 ‖ T003 ‖ T004              (après T001)
Phase 2 : T005 → T006, en parallèle de T007 ‖ T008
US1     : T009 ‖ T011, puis T010 → T012 → T013
US2     : T014 ‖ T015 ‖ T016, puis T017
US3     : T018 ‖ T019, puis T020 → T021 → T022 → T023
```

Les stories US1, US2 et US3 peuvent avancer en parallèle après la phase 2. Les points de contrôle (T013, T017, T023) se font un par un, car ils partagent le port 8787 et le preview sur 4174.

---

## Implementation Strategy

### MVP d'abord

1. Phase 1 (Setup), puis phase 2 (Foundational).
2. Phase 3 (US1, dashboard), puis le point de contrôle T013. On obtient la source de toutes les mises à jour.

### Livraison incrémentale

3. US2 (overlays 2D) puis T017 : le cœur du produit diffusé dans OBS.
4. US3 (3D) puis T023 : la capacité différenciante.
5. Phase 6 : campagne complète `FRAMEWORK=vue` jusqu'à 34/34, puis clôture du journal.

### Rappels d'équité

- La suite n'est jamais lancée en partie. Les points de contrôle utilisent un script jetable, hors dépôt.
- Toute campagne lancée compte. Ne la lancer qu'avec OBS fermé, sur un build à jour.
- Chaque correction manuelle va au journal.

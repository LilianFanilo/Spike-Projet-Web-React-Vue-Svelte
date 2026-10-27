---

description: "Tâches de l'implémentation React du spike (003-spike-react)"
---

# Tasks: Spike overlays live — implémentation React

**Input** : documents de conception de `specs/003-spike-react/` : [plan.md](plan.md), [spec.md](spec.md), [research.md](research.md), [data-model.md](data-model.md), [contracts/pages-react.md](contracts/pages-react.md) et [quickstart.md](quickstart.md).

**Tests** : aucune tâche n'écrit de test (constitution VI). Le contrat d'acceptation est la suite partagée `shared/e2e`, à ne jamais modifier.

**Organisation** : une phase par user story (US1 dashboard, US2 overlays 2D, US3 overlay 3D), précédée du setup et des fondations.

## Règles à respecter pendant toute l'implémentation

- **Ne jamais modifier `shared/`**, ni lire `apps/vue` ou `apps/svelte` (constitution I et II).
- **Ne jamais lancer la suite E2E partiellement** (`--grep`, un seul fichier) : le reporter partagé enregistre chaque campagne avec `FRAMEWORK=react`, et `shared/bench/grille.ts` retient la **première campagne sans échec** comme « vert ». Une campagne partielle réussie fausserait le nombre de passages. Les points de contrôle par story sont donc **manuels** (quickstart, étape 2). La suite complète ne tourne qu'en phase 6.
- **Chaque correction manuelle** du code généré est notée dans `results/journal-react.md`, avec sa catégorie (bug, syntaxe obsolète, écart à la spec, configuration) et son auteur (IA seule ou humain).
- **Imports de `shared/`** : toujours via l'alias et avec l'extension, par exemple `import { connect } from "@shared/client.ts"`.
- **Pas de `memo`, `useMemo` ni `useCallback` manuels** pour optimiser : c'est le rôle de React Compiler. Seule exception : le `useMemo` d'extraction de la géométrie (T020), qui calcule une donnée dérivée, pas une optimisation.

## Format : `[ID] [P?] [Story] Description`

- **[P]** : peut être fait en parallèle (fichier différent, sans dépendance sur une tâche inachevée).
- **[Story]** : US1, US2 ou US3.

---

## Phase 1 : Setup

**Objectif** : un projet npm `apps/react` indépendant, qui se construit, conforme à [integration-apps.md](../002-infra-commune/contracts/integration-apps.md).

- [X] T001 Noter dans `results/journal-react.md` le début de l'étape « Implémentation (`/speckit-implement`) », avec l'horodatage au format `AAAA-MM-JJ HH:MM`, dans le tableau « Étapes ».
- [X] T002 Créer `apps/react/package.json` : `"name": "@spike/react"`, `"private": true`, `"type": "module"`, une description qui renvoie à `specs/003-spike-react`, et les scripts `"build": "tsc --noEmit -p tsconfig.json && vite build"` et `"preview": "vite preview"`. Dans `apps/react`, lancer ensuite `npm install` (sans workspaces, pour créer `apps/react/package-lock.json`) :
  - dépendances : `react@~19.2.9`, `react-dom@~19.2.9`, `zustand@^5.0.16`, `three@~0.186.1`, `@react-three/fiber@^9.8.2`, `@react-three/drei@^10.7.9` ;
  - dépendances de dev : `vite@^8.3.5`, `@vitejs/plugin-react@^6.1.2`, `@rolldown/plugin-babel@^0.2.4`, `@babel/core@^7.29.7`, `@types/babel__core`, `babel-plugin-react-compiler@^1.0.0`, `typescript@^7.0.2`, `@types/react@~19.2.18`, `@types/react-dom@~19.2`, `@types/three@~0.186.0`.

  Vérifier que la version installée de `react` est bien en 19.2.x (`npm ls react`), et non en 19.3.
- [X] T003 [P] Créer `apps/react/tsconfig.json`, identique à `apps/temoin/tsconfig.json` (`strict: true`, `allowImportingTsExtensions: true`, `noEmit: true`, `module: "esnext"`, `moduleResolution: "bundler"`, `target: "es2023"`, `lib: ["es2023", "dom", "dom.iterable"]`, `types: ["vite/client"]`, `paths: { "@shared/*": ["../../shared/*"] }`, `skipLibCheck: true`, `include: ["src"]`), avec en plus `"jsx": "react-jsx"`.
- [X] T004 [P] Créer `apps/react/vite.config.ts` sur le modèle de `apps/temoin/vite.config.ts` (`fileURLToPath`, alias `@shared` vers `../../shared`, `server.fs.allow: [".", shared]`, `build.manifest: true`, `build.rollupOptions.input` avec les clés `dashboard`, `overlay-a`, `overlay-b` et `overlay-3d` vers les 4 fichiers HTML). Ajouter :
  - `plugins: [react(), babel({ presets: [reactCompilerPreset()] })]`, avec `import react, { reactCompilerPreset } from "@vitejs/plugin-react"` et `import babel from "@rolldown/plugin-babel"` (research R1) ;
  - `preview: { port: 4173, strictPort: true }`.
- [X] T005 [P] Créer les 4 entrées HTML à la racine de `apps/react` : `dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html`. Chacune a `<!doctype html>`, `lang="fr"`, `meta charset` et `meta viewport`, un `<title>` (« Dashboard — React », « Overlay A — React », etc.), un `<div id="root"></div>` et `<script type="module" src="…">` qui pointe vers son entrée : respectivement `/src/dashboard/main.tsx`, `/src/overlays/overlay-a.tsx`, `/src/overlays/overlay-b.tsx` et `/src/overlay-3d/main.tsx`.

**Checkpoint** : `npm run build` peut encore échouer faute de sources ; les dépendances et la configuration sont en place.

---

## Phase 2 : Fondations (bloquantes pour toutes les stories)

**Objectif** : le store Zustand et l'unique connexion par page ([data-model.md](data-model.md), research R2, R3 et R5).

- [X] T006 Créer `apps/react/src/live/store.ts` : `export const useLive = create<EtatLive>()((set, get) => …)` (Zustand 5). L'état contient :
  - `vars: VariableDef[]` (initial `[]`) ;
  - `values: Values` (initial `{}`) ;
  - `connected: boolean` (initial `false`) ;
  - `alerte: { seq: number; active: boolean }` (initial `{ seq: 0, active: false }`) ;
  - `pending: Record<string, number>` (initial `{}`).

  Les types viennent de `@shared/protocol.ts`. Actions, exactement comme dans [data-model.md](data-model.md) :
  - `bienvenue(vars, values)` remplace `vars` et `values` et remet `pending` à `{}` ;
  - `miseAJour(id, value)` : « si `pending[id] > 0` : décrémente, et n'applique `value` que si le compteur atteint 0. Sinon : `values[id] = value` » ;
  - `statut(connected)` ;
  - `alerter(seq)` : passe `alerte` à `{ seq, active: true }`, annule le minuteur de module précédent (`let minuteur: ReturnType<typeof setTimeout> | undefined`, hors du store), puis en relance un de `ALERT_DURATION_MS` (importé de `@shared/protocol.ts`, 2000 ms) qui remet `active: false` en gardant `seq` ;
  - `appliquerSaisie(id, v)` : `values[id] = v` et `pending[id] = (pending[id] ?? 0) + 1`.

  Les mises à jour sont immuables (nouveaux objets `values` et `pending`).
- [X] T007 Créer `apps/react/src/live/connexion.ts` (dépend de T006). Il détient `let connexion: Connection | null = null` au niveau du module et exporte trois fonctions :
  - `demarrer(role: "dashboard" | "overlay", name?: OverlayName)`, sans effet si `connexion` existe déjà. Elle appelle **une seule fois** `connect({ role, name, onWelcome, onUpdate, onAlert, onStatus })` de `@shared/client.ts`, chaque callback appelant l'action correspondante via `useLive.getState()` (`bienvenue`, `miseAJour`, `alerter`, `statut`) ;
  - `saisir(id: string, valeur: VarValue)` : cherche `def` dans `useLive.getState().vars`, sort si `def` est introuvable, si `connexion` est nul ou si `connected` est faux. Ensuite `const v = normalize(def, valeur)`, sort si `!validate(def, v)`, sinon `appliquerSaisie(id, v)` puis `connexion.set(id, v)`. L'ordre « normalize puis validate » est imposé par research R4 ;
  - `declencherAlerte()` : `connexion?.alert()`.

  Aucun throttle ni debounce (FR-012).
- [X] T008 [P] Créer `apps/react/src/overlays/overlay.css`, la base commune aux 3 overlays (research R7) :
  - `html, body { margin: 0; width: 100%; height: 100%; background: transparent; overflow: hidden; }` ;
  - `#root` et `.overlay { position: fixed; inset: 0; overflow: hidden; pointer-events: none; font-family: system-ui, sans-serif; }`, sans aucune couleur de fond ;
  - `[hidden] { display: none !important; }`, pour qu'aucune règle `display` ne réaffiche un élément masqué.

**Checkpoint** : les fondations sont prêtes. US1, US2 et US3 peuvent commencer, en parallèle si besoin.

---

## Phase 3 : User Story 1 — Piloter les variables depuis le dashboard (P1) 🎯 MVP

**Objectif** : un dashboard généré à partir du `welcome`, qui diffuse chaque saisie et suit la connexion (FR-010 à FR-014, FR-045).

**Test indépendant** (manuel, quickstart étape 2) : avec le service et le preview lancés, `http://localhost:4173/dashboard.html` affiche 5 champs typés, avec leurs libellés et leurs valeurs. Une saisie est visible dans un deuxième onglet du dashboard. Arrêter le service fait passer la racine à `data-connection="off"`, puis elle revient à `on`.

- [X] T009 [US1] Créer `apps/react/src/dashboard/Champ.tsx`, qui exporte `Champ({ def }: { def: VariableDef })`. Il lit `useLive((s) => s.values[def.id])` et rend `<label className="champ"><span>{def.label}</span>{contrôle}</label>`. Le contrôle porte toujours `data-var={def.id}`, et il est choisi selon `def.type` (research R4) :
  - `text` : `<input type="text" maxLength={def.maxLength} value={String(valeur ?? "")} onChange={(e) => saisir(def.id, e.target.value)} />`. La borne vient de `def` (« 80 caractères max » pour `titre`) ;
  - `number` : sous-composant `ChampNombre` (même fichier), `<input type="number" min={def.min} max={def.max} step={1} …>` (« −999 999 à 999 999 » pour `score`, via `def.min` et `def.max`). Il garde un brouillon local `useState<string>`, resynchronisé quand la valeur du store change (schéma React « ajuster l'état quand une prop change » : on mémorise la valeur vue dans un second `useState` et on compare pendant le rendu, sans `useEffect`). `onChange` met à jour le brouillon. Il n'appelle `saisir(def.id, n)` que si `e.target.value.trim() !== ""` et que `n = Number(e.target.value)` vérifie `Number.isInteger(n)` ;
  - `boolean` : `<input type="checkbox" checked={valeur === true} onChange={(e) => saisir(def.id, e.target.checked)} />` ;
  - `color` : `<input type="color" value={String(valeur ?? "#000000")} onChange={(e) => saisir(def.id, e.target.value.toLowerCase())} />` ;
  - `speed` : `<input type="range" min={def.min} max={def.max} step={def.step} value={String(valeur ?? def.default)} onChange={(e) => saisir(def.id, Number(e.target.value))} />` (« 0 à 2, pas de 0,05 » via `def`).

  Le texte du `<span>` est exactement `def.label` : les tests utilisent `getByText(label, { exact: true })`. Aucun autre élément ne porte `data-var`.
- [X] T010 [US1] Créer `apps/react/src/dashboard/Dashboard.tsx`, qui exporte `Dashboard()`. Il lit `useLive((s) => s.vars)` et `useLive((s) => s.connected)`, et rend :
  - `<main className="dashboard" data-connection={connected ? "on" : "off"}>` ;
  - un titre `<h1>Overlays live</h1>` ;
  - un indicateur textuel « Connecté » ou « Déconnecté » (FR-014) ;
  - un `<Champ key={def.id} def={def} />` pour chaque `def` de `vars`, **dans l'ordre reçu** (US1-6) ;
  - `<button type="button" data-action="alerte" onClick={declencherAlerte}>Alerte</button>` (FR-013).

  Aucun champ n'est codé en dur par variable (FR-010).
- [X] T011 [US1] Créer `apps/react/src/dashboard/dashboard.css`, un style minimal et lisible (champs en colonne, libellé au-dessus, indicateur de connexion coloré). Créer aussi `apps/react/src/dashboard/main.tsx`, qui importe `./dashboard.css`, appelle `demarrer("dashboard")` **avant** `createRoot(document.getElementById("root")!).render(<StrictMode><Dashboard /></StrictMode>)` (research R2).
- [X] T012 [US1] Point de contrôle manuel : `npm run build` puis `npm run preview` dans `apps/react`, avec `npm run serveur` dans `shared`. Dérouler les vérifications « dashboard » du quickstart (étape 2), et noter le résultat dans `results/journal-react.md`, rubrique « Étapes » (remarques). **Ne pas lancer la suite E2E.**

**Checkpoint** : US1 fonctionne seule. Le dashboard pilote le service, et un client d'écoute reçoit chaque saisie.

---

## Phase 4 : User Story 2 — Deux overlays 2D synchronisés (P1)

**Objectif** : overlay A (titre et score) et overlay B (bandeau « EN DIRECT »), transparents en 1920×1080, avec l'animation d'alerte de 2 s (FR-020 à FR-024, FR-040 à FR-043).

**Test indépendant** (manuel) : ouvrir `overlay-a.html` et `overlay-b.html`, puis les piloter depuis le dashboard ou un client de test. Vérifier la mise à jour, le bandeau masqué ou affiché, l'animation sur chaque overlay (relancée par une alerte pendant une alerte) et la reconnexion après un redémarrage du service.

- [X] T013 [US2] Compléter `apps/react/src/overlays/overlay.css` avec l'animation d'alerte (FR-023, research R5). Elle dure 2 s, en `ease-out` :
  - `@keyframes alerte` : à 0 %, `transform: scale(1)` et aucun flash ; vers 30 %, `transform: scale(1.15)`, `filter: brightness(1.8)` et un halo `text-shadow: 0 0 24px #fff` ; à 100 %, retour à `scale(1)` sans flash ;
  - `.anim { display: inline-block; transform-origin: center; }` ;
  - `.anim.alerte { animation: alerte 2000ms ease-out; }`.

  Ajouter le placement des éléments :
  - `.titre` : grand texte blanc lisible en 1080p, avec une ombre pour le contraste, `max-width: 1700px`, `overflow-wrap: anywhere`, pour qu'un titre de 80 caractères reste dans le cadre ;
  - `.score` ;
  - `.bandeau` : bandeau rouge avec « EN DIRECT », positionné en bas. Sa règle ne doit pas fixer `display` sur l'élément qui porte `hidden`.
- [X] T014 [US2] Créer `apps/react/src/overlays/Alerte.tsx`, qui exporte `Alerte({ children }: { children: ReactNode })`. Il lit `useLive((s) => s.alerte)` et rend `<div key={alerte.seq} className={alerte.active ? "anim alerte" : "anim"}>{children}</div>`. Changer de `key` remonte l'élément et relance la keyframe depuis le début (US2-5).
- [X] T015 [P] [US2] Créer `apps/react/src/overlays/overlay-a.tsx` (entrée et composant). Il importe `./overlay.css`, appelle `demarrer("overlay", "overlay-a")`, puis `createRoot(...).render(<StrictMode><OverlayA /></StrictMode>)`. `OverlayA` lit `values.titre`, `values.score` et `alerte.active`, et rend `<div className="overlay" data-alert={active ? "on" : "off"}>`. À l'intérieur, dans `<Alerte>` :
  - `<div className="titre" data-var="titre" data-value={serialize("text", titre)}>{String(titre)}</div>` ;
  - `<div className="score" data-var="score" data-value={serialize("number", score)}>{String(score)}</div>`.

  Le type passé à `serialize` est écrit en dur, car l'overlay connaît ses variables (data-model, « État dérivé par page »). Chacun est rendu **seulement si** sa valeur existe (`!== undefined`). Avant le `welcome`, l'overlay reste vide et transparent (BORD-service-absent). Un titre vide rend un élément vide, avec `data-value=""` (BORD-titre-vide).
- [X] T016 [P] [US2] Créer `apps/react/src/overlays/overlay-b.tsx` (entrée et composant). Il importe `./overlay.css`, appelle `demarrer("overlay", "overlay-b")` puis rend `OverlayB`. `OverlayB` lit `values.bandeau` et `alerte.active`, et rend `<div className="overlay" data-alert=…>`. À l'intérieur, dans `<Alerte>`, `<div className="bandeau" data-var="bandeau" data-value={serialize("boolean", valeur)} hidden={valeur !== true}>EN DIRECT</div>`. L'élément est **toujours présent** dès que la valeur existe, et seul `hidden` le masque (FR-040, FR-021). Seule la variable `bandeau` est lue.
- [X] T017 [US2] Point de contrôle manuel : rebuild et preview, puis les vérifications « overlay A / overlay B / alerte » du quickstart (étape 2). Arrêter et relancer `npm run serveur` pour voir la reconnexion. Dans les DevTools, contrôler que `html` et `body` ont un fond `rgba(0, 0, 0, 0)` et qu'aucune barre de défilement n'apparaît en 1920×1080. Noter le résultat dans le journal. **Ne pas lancer la suite E2E.**

**Checkpoint** : US1 et US2 fonctionnent. Le cœur du produit est diffusable dans OBS.

---

## Phase 5 : User Story 3 — Élément 3D piloté par les variables (P2)

**Objectif** : Suzanne en rotation continue, avec sa couleur, sa vitesse et l'animation d'alerte, plus un repli 2D si WebGL est absent ou si le modèle est introuvable (FR-030 à FR-034, research R6).

**Test indépendant** (manuel) :
- `overlay-3d.html` : le modèle tourne et suit la couleur et la vitesse (0 l'arrête). L'alerte le fait sauter avec 2 tours.
- `?debug=1` affiche le compteur FPS.
- Dans les DevTools, bloquer `*.glb` (Network › Block request URL) affiche « 3D indisponible ».

- [X] T018 [P] [US3] Créer `apps/react/src/overlay-3d/Repli.tsx`, qui exporte `Repli()`. Il lit `values.couleur` et rend un élément **visible** `<div className="repli" data-var="couleur" data-value={couleur !== undefined ? serialize("color", couleur) : undefined}>`. Il contient un disque `<div className="repli-forme" style={{ background: typeof couleur === "string" ? couleur : undefined }} />` (`VarValue` est `string | number | boolean` : on le restreint pour TypeScript strict) (forme de la couleur courante) et le texte `3D indisponible` (FR-033).
- [X] T019 [P] [US3] Créer `apps/react/src/overlay-3d/LimiteErreur.tsx`. C'est un composant classe `LimiteErreur extends Component<{ repli: ReactNode; children: ReactNode }, { erreur: boolean }>`, avec `static getDerivedStateFromError() { return { erreur: true }; }` et un `render()` qui renvoie `repli` si `erreur`, sinon `children`. Aucune librairie (`react-error-boundary` est interdit, constitution III).
- [X] T020 [US3] Créer `apps/react/src/overlay-3d/Modele.tsx`, qui exporte `Modele()` :
  - `const { scene } = useGLTF(modelUrl)`, avec `import modelUrl from "@shared/assets/model.glb?url"` ;
  - la géométrie du premier maillage est extraite avec un `useMemo` qui parcourt `scene` (`traverse`, premier objet `isMesh`) ;
  - la couleur vient de `useLive((s) => s.values.couleur)`, restreinte pour TypeScript strict : `const couleur = typeof valeur === "string" ? valeur : "#ffffff"` (`VarValue` est `string | number | boolean`) ;
  - le rendu est `<mesh ref={ref} geometry={geometrie}><meshStandardMaterial color={couleur} /></mesh>`.

  Dans `useFrame((state, delta) => …)`, lire `useLive.getState()` (mises à jour transitoires, R6) :
  - `angle.current += vitesse × 2π × delta` (`vitesse` en tours par seconde, 0 si absente) ;
  - si `alerte.seq` diffère de `dernierSeq.current` et que `seq > 0`, mémoriser `debut.current = state.clock.elapsedTime` et `dernierSeq.current = seq` ;
  - `p = (elapsedTime − debut) / (ALERT_DURATION_MS / 1000)`. Si `0 ≤ p < 1` : `e = 1 − (1 − p)³` (ease-out), `position.y = 0.5 × sin(π × e)` (« saut vertical de 0,5 unité de scène, qui monte puis redescend »), `rotation.y = angle + 2 × 2π × e` (« 2 tours supplémentaires »). Sinon : `position.y = 0` et `rotation.y = angle`.

  Aucune librairie d'animation (FR-032).
- [X] T021 [US3] Créer `apps/react/src/overlay-3d/Scene.tsx`, qui exporte `Scene()`. Il lit `values.couleur` et rend :
  - `<span hidden data-var="couleur" data-value={serialize("color", couleur)} />`, seulement si la valeur existe, et **hors** de tout `Suspense` ;
  - `<Canvas camera={{ position: [0, 0, 4], fov: 50 }}>`, sans couleur de fond (transparent par défaut), qui contient `<ambientLight intensity={0.6} />`, `<directionalLight position={[2, 3, 4]} intensity={1.2} />` et `<Suspense fallback={null}><Modele /></Suspense>`.
- [X] T022 [US3] Créer `apps/react/src/overlay-3d/Overlay3D.tsx`, qui exporte `Overlay3D()`.
  - Au niveau du module, `const webglDisponible = detecterWebGL()` : un canvas jetable, `getContext("webgl2") ?? getContext("webgl")`, et `!== null`, le tout dans un `try/catch` qui renvoie `false`.
  - Le composant lit `values.vitesse` et `alerte.active`, et rend `<div className="overlay" data-alert={active ? "on" : "off"}>`, qui contient `<div className="scene">` (1920×1080) avec :
    - `<span hidden data-var="vitesse" data-value={serialize("speed", vitesse)} />`, si la valeur existe, **en dehors** de la limite d'erreur ;
    - puis `webglDisponible ? <LimiteErreur repli={<Repli />}><Scene /></LimiteErreur> : <Repli />`.

  Il y a toujours exactement un `data-var="couleur"` (contrat [pages-react.md](contracts/pages-react.md#overlay-3d-overlay3dtsx-scenetsx-replitsx)).
- [X] T023 [US3] Créer `apps/react/src/overlay-3d/overlay-3d.css`, avec `.scene { position: absolute; inset: 0; }`, où le canvas occupe toute la scène, et le style du repli : `.repli` centré et visible, `.repli-forme` en disque de 240 px, libellé lisible en 1080p. Créer aussi `apps/react/src/overlay-3d/main.tsx`, qui importe `../overlays/overlay.css` et `./overlay-3d.css`, appelle `demarrer("overlay", "overlay-3d")` puis `createRoot(...).render(<StrictMode><Overlay3D /></StrictMode>)`. Le compteur FPS est activé par `connect({ name })` avec `?debug=1` : rien à ajouter (FR-034).
- [X] T024 [US3] Point de contrôle manuel : rebuild et preview, puis les vérifications « overlay 3D » du quickstart (étape 2), y compris `?debug=1`, la vitesse 0 et le blocage de `*.glb` dans les DevTools pour voir le repli. Vérifier que la console n'affiche aucune erreur dans le cas nominal (US3-1). Noter le résultat dans le journal. **Ne pas lancer la suite E2E.**

**Checkpoint** : les trois stories fonctionnent.

---

## Phase 6 : Finitions et contrat d'acceptation

**Objectif** : un build de production conforme, la suite E2E complète au vert et le journal à jour.

- [X] T025 Contrôles de build dans `apps/react` (quickstart étape 1). Après `npm run build` :
  - `dist/.vite/manifest.json` contient les entrées `dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html` ;
  - React Compiler est actif : dans le code minifié, chaque composant compilé commence par un appel au cache mémo, de la forme `(0,x.c)(N)`, et le marqueur `react.memo_cache_sentinel` apparaît dans le chunk du dashboard. `compiler-runtime` et `_c(` disparaissent à la minification et ne sont pas fiables ;
  - seul le graphe de l'overlay 3D importe `three`. Dans `dist/.vite/manifest.json`, relever pour `dashboard.html`, `overlay-a.html` et `overlay-b.html` leur `file` et, récursivement, les `file` de leurs `imports`. `Select-String -Pattern "WebGLRenderer"` sur ces fichiers ne doit rien trouver. Le même motif doit être trouvé dans le graphe de `overlay-3d.html`, comme témoin positif. On ne se fie pas au nom des chunks, que Rolldown ne garantit pas.

  Tout écart corrigé est noté dans le journal, catégorie « configuration ».
- [X] T026 Vérifier l'équité avant la campagne : `git diff --stat base-commune -- shared` doit être vide, et aucun fichier `apps/vue` ni `apps/svelte` ne doit exister sur la branche.
- [X] T027 Campagne E2E **complète** sur le build de production. Lancer `npm run preview` dans `apps/react` (sans service manuel : la suite lance le sien), puis dans `shared` : `$env:APP_URL = "http://localhost:4173"; $env:FRAMEWORK = "react"; npm run e2e`. Reporter le numéro, la date, le résultat (réussis sur total) et les échecs dans `results/journal-react.md`, rubrique « Campagnes E2E ».
- [X] T028 Tant que la campagne n'est pas au vert :
  1. corriger dans `apps/react/src/` (jamais dans `shared/`) ;
  2. noter chaque correction dans `results/journal-react.md`, rubrique « Corrections manuelles » (fichier, catégorie, auteur, description) ;
  3. relancer la campagne **complète** (T027), qui compte comme un nouveau passage.

  Si un test partagé paraît lui-même défectueux, ne pas le modifier : arrêter et le signaler à Lilian (amendement, constitution II).
- [X] T029 Clore le journal dans `results/journal-react.md` : horodatage de fin de l'étape « Implémentation », nombre de passages avant le vert, écarts éventuels. Laisser vide la rubrique « Ressenti (/5) », qui revient à l'équipe (SC-008).

---

## Dependencies & Execution Order

### Dépendances entre phases

- **Setup (phase 1)** : T001 puis T002. T003, T004 et T005 se font ensuite, en parallèle.
- **Fondations (phase 2)** : dépendent de T002. T006, puis T007 (qui importe le store). T008 est indépendant.
- **US1 (phase 3)**, **US2 (phase 4)** et **US3 (phase 5)** dépendent toutes de la phase 2, et sont indépendantes entre elles.
- **Finitions (phase 6)** : après les trois stories. T025 → T026 → T027 → T028 (boucle) → T029.

### Dépendances internes

- US1 : T009 → T010 → T011 → T012.
- US2 : T013 → T014 → T015 et T016 [P] → T017. Le composant `Alerte` (T014) dépend des classes CSS (T013).
- US3 : T018 et T019 [P] → T020 → T021 → T022 → T023 → T024.

### Opportunités de parallélisme

- Phase 1 : T003, T004 et T005.
- Phase 2 : T008, en parallèle de T006 et T007.
- Après la phase 2, les trois stories peuvent avancer en parallèle (fichiers disjoints : `src/dashboard`, `src/overlays`, `src/overlay-3d`). L'overlay 3D importe seulement `overlays/overlay.css`, créé en T008.
- Dans US2 : T015 et T016. Dans US3 : T018 et T019.

### Exemple de parallélisme (US3)

```text
En parallèle : T018 Repli.tsx  |  T019 LimiteErreur.tsx
Puis :         T020 Modele.tsx → T021 Scene.tsx → T022 Overlay3D.tsx → T023 main.tsx et css
```

## Implementation Strategy

### MVP d'abord

1. Phases 1 et 2.
2. Phase 3 (US1) : le dashboard pilote le service. On s'arrête, et on valide manuellement (T012).

### Livraison incrémentale

1. Ajouter US2 (overlays 2D), qui donne un produit diffusable dans OBS, puis le valider (T017).
2. Ajouter US3 (3D), puis la valider (T024).
3. Lancer la phase 6 : **une seule** suite E2E complète, à la fin. Le premier passage est le plus précieux pour la grille, car le nombre de passages avant le vert est mesuré.

### Rappel d'équité

Le temps total, les corrections manuelles et les passages E2E alimentent la grille (SC-007). Il faut tout noter, y compris les corrections triviales.

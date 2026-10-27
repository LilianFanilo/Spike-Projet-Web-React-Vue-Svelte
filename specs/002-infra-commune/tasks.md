# Tasks: Outillage commun du spike

**Input**: Design documents from `specs/002-infra-commune/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/ (protocole, service, integration-apps, commandes), quickstart.md

**Tests**: la suite d'acceptation Playwright est **le livrable** de cette feature (US2), et non un ensemble de tests unitaires. Conformément à la constitution (principe VI), aucun test unitaire n'est demandé : l'outillage se valide sur la page témoin et sur des défauts injectés (US4).

**Organization**: les tâches sont regroupées par user story. Les cinq stories ne sont pas indépendantes : la suite (US2) a besoin d'une page à tester, que fournit le témoin (US4). L'ordre d'exécution est donc US1, puis US4, US2, US3 et enfin US5.

## Format: `[ID] [P?] [Story] Description`

- **[P]** : peut tourner en parallèle (fichiers différents, aucune dépendance sur une tâche non terminée).
- **[Story]** : US1 à US5 de `specs/002-infra-commune/spec.md`.

## Path Conventions

- Outillage : `shared/` (jamais compilé, exécuté par Node 26 et importé par Vite via `@shared`).
- Témoin : `apps/temoin/` (Vite vanilla TS, port 4170).
- Résultats : `results/`.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose** : initialisation des projets npm et de la configuration TypeScript.

- [X] T001 Créer `shared/package.json` avec :
  - `"type": "module"`, `"private": true` ;
  - les dépendances : `ws` ; en développement : `@playwright/test`, `cloc`, `@types/ws`, `@types/node` et `typescript` ;
  - les scripts npm `serveur`, `e2e`, `latence`, `alertes`, `poids`, `fps`, `lignes`, `grille` et `typecheck` (`tsc --noEmit`), dont les commandes sont dans `specs/002-infra-commune/contracts/commandes.md`.

  Lancer ensuite `npm install` dans `shared/`.
- [X] T002 [P] Créer `shared/tsconfig.json` avec `strict: true`, `erasableSyntaxOnly: true`, `allowImportingTsExtensions: true`, `verbatimModuleSyntax: true`, `noEmit: true`, `module: "nodenext"`, `target: "es2023"`, `lib: ["es2023", "dom"]` et `types: ["node"]`. Inclure tous les `**/*.ts` sauf `node_modules`.
- [X] T003 [P] Mettre à jour `.gitignore` à la racine : ajouter `shared/node_modules/`, `apps/*/node_modules/`, `apps/*/dist/`, `shared/e2e/test-results/` et `shared/e2e/playwright-report/`. `results/mesures.json` reste versionné.
- [X] T004 Lancer `npx playwright install chromium` dans `shared/` (navigateur aligné sur la version installée à T001).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose** : le protocole et les variables, dont dépend tout le reste.

**⚠️ CRITICAL** : aucune story ne commence avant la fin de cette phase.

- [X] T005 Créer `shared/protocol.ts` selon `contracts/protocole.md`. Il exporte :
  - les constantes `SERVICE_PORT = 8787`, `SERVICE_HOST = "127.0.0.1"`, `WS_URL`, `HTTP_URL` et `ALERT_DURATION_MS = 2000` ;
  - les types `VarType` (`"text" | "number" | "boolean" | "color" | "speed"`), `VarValue`, `VariableDef`, `Values`, `OverlayName` (`"overlay-a" | "overlay-b" | "overlay-3d"`), `ClientMessage` et `ServerMessage` (unions discriminées sur `type`) ;
  - les fonctions `validate(def, value)`, `normalize(def, value)` et `serialize(type, value)`.

  Les règles du data-model sont à reprendre telles quelles :
  - `text` : « Chaîne de longueur ≤ `maxLength` » ;
  - `number` : « Entier, compris entre `min` et `max` » ;
  - `color` : « Chaîne respectant `^#[0-9a-f]{6}$`, en minuscules après normalisation » ;
  - `speed` : « Nombre entre `min` et `max`, multiple de `step` (tolérance 1e-9) » ;
  - sérialisation : nombres par `String(value)`, booléens `"true"` / `"false"`, couleur en minuscules.

  Syntaxe effaçable uniquement : pas d'`enum`, pas de `namespace`, pas de propriétés de paramètre.
- [X] T006 [P] Créer `shared/variables.json` avec les 5 variables de la spec gelée :

  | id | label | type | default | Contraintes |
  | --- | --- | --- | --- | --- |
  | `titre` | « Titre » | `text` | « Bienvenue sur le live » | `maxLength: 80` |
  | `score` | « Score » | `number` | 0 | `min: -999999`, `max: 999999`, `step: 1` |
  | `bandeau` | « Bandeau visible » | `boolean` | `true` | — |
  | `couleur` | « Couleur du modèle » | `color` | `#4f8cff` | — |
  | `vitesse` | « Vitesse de rotation » | `speed` | 0.25 | `min: 0`, `max: 2`, `step: 0.05` |

- [X] T007 [P] Créer `shared/variables.alt.json` : la même liste, sans `vitesse`, avec le libellé de `titre` changé en « Titre du live », et une variable ajoutée `{ id: "sous-titre", label: "Sous-titre", type: "text", default: "", maxLength: 60 }`.

- [X] T008 [P] Créer `shared/assets/build-model.ts` :
  - télécharger `Suzanne.gltf` et `Suzanne.bin` depuis `https://raw.githubusercontent.com/KhronosGroup/glTF-Sample-Assets/main/Models/Suzanne/glTF/` ;
  - retirer `images`, `textures` et `samplers`, ainsi que les références de texture des matériaux ;
  - fixer `pbrMetallicRoughness: { baseColorFactor: [1,1,1,1], metallicFactor: 0, roughnessFactor: 0.5 }` ;
  - remplacer l'`uri` du buffer et emballer en GLB (en-tête `glTF` v2, chunk JSON complété par des espaces jusqu'à 4 octets, chunk BIN complété par des zéros) dans `shared/assets/model.glb` ;
  - échouer si le fichier fait plus de 1 Mo.

  Lancer ensuite le script, et écrire `shared/assets/LICENSE-model.md` (Suzanne, CC0-1.0, Norbert Nopper / UX3D, source, modifications apportées).

  Ce modèle est requis par l'overlay 3D témoin (T025) et par les tests 3D.

**Checkpoint** : `npm run typecheck` passe dans `shared/`.

---

## Phase 3: User Story 1 - Brancher une implémentation sur un socle commun (Priority: P1) 🎯 MVP

**Goal** : un service de diffusion fonctionnel et des modules client (client, sonde, FPS) importables par Vite et par Node.

**Independent Test** : `node shared/server/index.ts` affiche `PRET 8787`. Puis `shared/e2e/service.spec.ts` passe (bienvenue, rediffusion avec `seq`, alerte, liste alternative, rejet d'une valeur invalide, import depuis Node).

- [ ] T009 [US1] Créer `shared/server/index.ts` selon `contracts/service.md`.
  - **Options** : `--vars` (par défaut `shared/variables.json`, résolu par rapport au fichier) et `--port` (par défaut 8787). Valider chaque `default` avec `validate`, et s'arrêter avec le code 1 en cas d'erreur.
  - **Serveur** : HTTP et `WebSocketServer` de `ws` sur le même serveur, écoute sur `127.0.0.1`.
  - **Messages** : `hello` mémorise le rôle et le nom puis répond `welcome` ; `set` valide, normalise, incrémente `seq`, met à jour l'état, enregistre `sent {seq,id,at}` et diffuse `update` à tous ; `alert` incrémente `seq` puis diffuse `alert {seq}` ; `ack` enregistre une latence (premier ack par couple `(seq, overlay)` seulement, `seq` inconnue ignorée) ; `fps` est enregistré.
  - **Erreurs** : JSON invalide ou type inconnu → `rejected++` et avertissement sur la sortie d'erreur, sans fermer la connexion.
  - **Routes HTTP** : `GET /health`, `GET /stats`, `POST /stats/reset` (204) ; tout le reste → 404.
  - **Démarrage** : écrire `PRET <port>` sur la sortie standard. `EADDRINUSE` → message explicite et code 1.
  - **Arrêt** : `SIGINT` / `SIGTERM` → fermeture propre, code 0.
- [ ] T010 [P] [US1] Créer `shared/probe.ts` qui exporte `createProbe(overlay, send)` et sa méthode `track(seq, def, value)`, selon `contracts/protocole.md` et le choix R4 de research.md :
  - si aucun `[data-var="<id>"]` n'existe, ne rien faire ;
  - sinon, vérifier à chaque `requestAnimationFrame` que `data-value` vaut `serialize(def.type, value)`, attendre une image de plus, puis envoyer `{type:"ack", seq, overlay}` ;
  - abandonner au bout de 2000 ms.
- [ ] T011 [P] [US1] Créer `shared/fps.ts` qui exporte `startFps(overlay, send)` :
  - compter les `requestAnimationFrame` par fenêtre de 1 s ;
  - créer un `<div data-fps>` en position fixe en haut à gauche (texte blanc sur fond semi-opaque) qui affiche la valeur ;
  - envoyer `{type:"fps", overlay, value}` chaque seconde.
- [ ] T012 [US1] Créer `shared/client.ts` qui exporte `connect(options)`, selon `contracts/protocole.md` et le choix R3 de research.md :
  - **Connexion** : `WebSocket` natif vers `WS_URL`, puis `hello` à l'ouverture.
  - **Reconnexion** : toutes les 1000 ms si `reconnect` n'est pas `false`. `onStatus(true/false)` à chaque changement.
  - **Messages reçus** : `welcome` → mémoriser les définitions et appeler `onWelcome` ; `update` → `onUpdate`, puis `probe.track` si `name` est fourni ; `alert` → `onAlert`.
  - **Compteur FPS** : `startFps` si `name` est fourni et que `location.search` contient `debug=1`.
  - **Valeur de retour** : `{ set, alert, close }`. `set` et `alert` sont sans effet si le client est déconnecté.

  Le module doit pouvoir être importé sous Node sans planter : pas d'accès à `window` au moment de l'import.
- [ ] T013 [US1] Créer `shared/e2e/fixtures.ts` :
  - **Fixture Playwright `serveur`** (portée : un test). Elle lance `node shared/server/index.ts` en processus enfant, attend `PRET`, et expose :
    - `start({ vars? })`, `stop()`, `restart({ vars? })` ;
    - `client()` : un client de test basé sur le `WebSocket` natif de Node, avec `hello {role:"test"}`, `set`, `alert`, `messages[]` et `waitFor(predicate, timeout)` ;
    - `stats()`, `health()`.

    Elle arrête le processus en fin de test.
  - **Helper `pageUrl(name, extraQuery?)`** : il construit `${APP_URL}/${name}.html` en ajoutant `APP_QUERY` et `extraQuery`.
  - **Échec explicite** si `APP_URL` ou `FRAMEWORK` manque. Exception : `service.spec.ts`, qui n'a pas besoin de `APP_URL`.
- [ ] T014 [US1] Créer `shared/e2e/playwright.config.ts` :
  - `testDir` sur ce dossier, `workers: 1`, `fullyParallel: false`, `retries: 0`, `timeout: 30000`, viewport 1920×1080 ;
  - les reporters `list` et `./mesures-reporter.ts` ;
  - le projet `standard` : `launchOptions.args` `["--use-angle=swiftshader", "--enable-unsafe-swiftshader"]` et `grepInvert: /@repli/` ;
  - le projet `sans-3d` : `args` `["--disable-3d-apis"]` et `grep: /@repli/`.
- [ ] T015 [US1] Créer `shared/e2e/service.spec.ts`, qui couvre les scénarios US1-1 à US1-6 de cette feature (titres préfixés `SOCLE-1` à `SOCLE-6`) :
  - bienvenue avec 5 définitions et leurs valeurs ;
  - rediffusion d'un `update` avec `seq` aux 2 clients ;
  - rediffusion d'une alerte ;
  - `restart({vars: "variables.alt.json"})` → bienvenue avec la liste alternative ;
  - un `set` invalide (variable inconnue, `score: 1.5`, `vitesse: 3`, couleur `"red"`) n'est pas rediffusé et `rejected` augmente ;
  - import dynamique de `../protocol.ts` et `../client.ts` sous Node sans erreur, et `serialize` donne `"true"`, `"0.25"` et `"#4f8cff"`.

**Checkpoint** : `npx playwright test service.spec.ts` passe sans `APP_URL`.

---

## Phase 4: User Story 4 - Prouver l'outillage sur une page témoin sans framework (Priority: P1)

**Goal** : une app témoin vanilla conforme à `contracts/integration-apps.md`, avec 4 défauts injectables. Elle sert de cible à la suite d'acceptation (US2) et de référence « sans framework ».

**Independent Test** : `npm run build && npm run preview` dans `apps/temoin`, puis ouvrir les 4 pages avec le service lancé. Modifier une valeur dans le dashboard met à jour les overlays, et l'alerte anime pendant 2 s. La validation complète se fait à la fin de la phase 5 (US2).

- [ ] T016 [US4] Créer `apps/temoin/package.json` (`"type": "module"`, dépendances de développement `vite` et `typescript`, scripts `build: "tsc --noEmit && vite build"` et `preview: "vite preview"`) et `apps/temoin/tsconfig.json` (`strict`, `allowImportingTsExtensions`, `noEmit`, `moduleResolution: "bundler"`, `paths: { "@shared/*": ["../../shared/*"] }`, `types: ["vite/client"]`), puis lancer `npm install`.
- [ ] T017 [US4] Créer `apps/temoin/vite.config.ts` selon `contracts/integration-apps.md` : alias `@shared` vers `../../shared`, `server.fs.allow: ["..", "../../shared"]`, `build.manifest: true`, `rollupOptions.input` avec les 4 HTML, `preview: { port: 4170, strictPort: true }`.
- [ ] T018 [P] [US4] Créer les 4 fichiers `apps/temoin/dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html`. Chacun contient `<div id="app">` et charge `/src/<page>.ts` en module.
- [ ] T019 [P] [US4] Créer `apps/temoin/src/style.css` :
  - `html, body { background: transparent; margin: 0; overflow: hidden }` pour les overlays ;
  - une classe `.alerte` qui applique `@keyframes alerte` (scale 1 → 1.15 → 1 et flash par `filter: brightness(1 → 2.5 → 1)`, 2 s, `ease-out`), comme le prévoit FR-023 de la spec gelée ;
  - un style lisible en 1080p.
- [ ] T020 [P] [US4] Créer `apps/temoin/src/defauts.ts` : `defaut(code)` renvoie `true` si `new URLSearchParams(location.search).get("defaut") === code`. Codes possibles : `bandeau`, `score`, `alerte`, `reconnexion`.
- [ ] T021 [P] [US4] Créer `apps/temoin/src/alerte.ts`. Il exporte `jouerAlerte(racine, cibles)` :
  - poser `data-alert="on"` sur la racine ;
  - relancer l'animation CSS (retrait de la classe, lecture de `offsetWidth`, ajout de la classe) ;
  - annuler le minuteur précédent, puis remettre `data-alert="off"` après `ALERT_DURATION_MS`.

  Une alerte qui arrive pendant une autre doit redémarrer l'animation depuis le début. Avec `defaut("alerte")`, la fonction ne fait rien.
- [ ] T022 [US4] Créer `apps/temoin/src/dashboard.ts` :
  - la racine `#app` porte `data-connection` ;
  - `onWelcome` reconstruit les champs à partir des `vars` : un `label` avec le libellé, et un contrôle natif dont le type suit la table de `contracts/integration-apps.md` (`maxlength`, `min`, `max`, `step`), qui porte `data-var` et la valeur courante ;
  - l'événement `input` (ou `change` pour une case à cocher) appelle `client.set`, en convertissant `number` et `speed` en nombres. Aucun throttle (FR-012 de la spec gelée) ;
  - `onUpdate` met à jour le contrôle, sauf si c'est lui qui a le focus et a déjà la même valeur ;
  - un bouton `data-action="alerte"` libellé « Alerte » appelle `client.alert()`.
- [ ] T023 [P] [US4] Créer `apps/temoin/src/overlay-a.ts` :
  - afficher le titre et le score dans deux éléments `[data-var]` dont le texte et `data-value` (`serialize`) sont tenus à jour, à partir de `onWelcome` puis de `onUpdate` ;
  - avec `defaut("score")`, ignorer les mises à jour du score ;
  - à l'alerte, appeler `jouerAlerte` ;
  - `connect({role:"overlay", name:"overlay-a", reconnect: !defaut("reconnexion")})`.
- [ ] T024 [P] [US4] Créer `apps/temoin/src/overlay-b.ts` :
  - un bandeau `[data-var="bandeau"]`, toujours présent, avec le texte « EN DIRECT », affiché ou masqué (`display`) selon la valeur, et `data-value` tenu à jour ;
  - avec `defaut("bandeau")`, ignorer les mises à jour ;
  - alerte et reconnexion comme pour l'overlay A.
- [ ] T025 [P] [US4] Créer `apps/temoin/src/overlay-3d.ts` :
  - un conteneur avec deux éléments enfants distincts et masqués, l'un `data-var="couleur"`, l'autre `data-var="vitesse"`, et un `<canvas>` en 1920×1080 ;
  - `fetch(modelUrl)` (avec `import modelUrl from "@shared/assets/model.glb?url"`) puis `getContext("webgl2") ?? getContext("webgl")`. Si l'un des deux échoue → repli : un `div` visible contenant « 3D indisponible », avec un disque de la couleur courante, qui porte `data-var="couleur"` et **remplace** l'élément couleur de la scène. L'élément `data-var="vitesse"` reste présent, et il n'y a jamais deux éléments pour un même `data-var` (règle d'unicité de `contracts/integration-apps.md`) ;
  - sinon, une boucle `requestAnimationFrame` qui appelle `clearColor` avec la couleur courante, et dont la luminosité pulse pendant l'alerte ;
  - `data-alert` posé via `jouerAlerte` ;
  - `connect({role:"overlay", name:"overlay-3d"})`.

**Checkpoint** : le build du témoin passe et les 4 pages fonctionnent à la main. Le modèle, produit en phase 2, est affiché par la scène et non par le repli.

---

## Phase 5: User Story 2 - Vérifier automatiquement une implémentation contre la spec gelée (Priority: P1)

**Goal** : la suite d'acceptation couvre tous les scénarios automatisables de la spec gelée, ne dépend que du contrat DOM et écrit son résultat dans la grille.

**Independent Test** : avec `APP_URL=http://localhost:4170` et `FRAMEWORK=temoin`, 100 % des tests passent. Avec chacun des défauts `APP_QUERY=defaut=…`, le scénario visé échoue (quickstart §2 et §3).

- [ ] T026 [P] [US2] Créer `shared/e2e/dashboard.spec.ts` (US1-1 à US1-6 de la spec gelée) :
  - US1-1 : 5 contrôles `[data-var]` du bon type d'`input`, valeurs par défaut, libellés présents ;
  - US1-2 : pour chaque type, modifier le contrôle (avec `fill` ou `evaluate`, plus un événement `input`) → le client de test reçoit l'`update` attendu ;
  - US1-3 : cliquer `[data-action=alerte]` → le client reçoit une `alert` ;
  - US1-4 : `set` envoyé par le client de test → le contrôle affiche la valeur ;
  - US1-5 : `stop()` → `data-connection="off"` ; `start()` → `"on"` en moins de 5 s ;
  - US1-6 : `restart({vars:"variables.alt.json"})` puis rechargement → les contrôles correspondent à la liste alternative.
- [ ] T027 [P] [US2] Créer `shared/e2e/overlays.spec.ts` (US2-1 à US2-7) :
  - US2-1 : `set` envoyé avant l'ouverture de la page → valeur affichée dès le chargement ;
  - US2-2 : titre et score (texte visible et `data-value`) ;
  - US2-3 : bandeau visible ou masqué (`toBeVisible` / `toBeHidden`) et `data-value` ;
  - US2-4 : alerte → `data-alert="on"` en moins de 300 ms, puis `"off"` entre 1700 et 2300 ms, sur les deux overlays ;
  - US2-5 : seconde alerte à 1000 ms → toujours `"on"` à 2200 ms, puis `"off"` entre 2700 et 3300 ms ;
  - US2-6 : `stop`, `start`, `set` → la valeur s'affiche en moins de 5 s ;
  - US2-7 : `getComputedStyle` de `html` et `body` donne `rgba(0, 0, 0, 0)` ou `transparent`, et `scrollWidth ≤ innerWidth` / `scrollHeight ≤ innerHeight`.
- [ ] T028 [P] [US2] Créer `shared/e2e/overlay-3d.spec.ts` (US3-1 à US3-6) :
  - US3-1 : `canvas` présent avec un contexte WebGL, `data-var` couleur et vitesse présents, aucune `pageerror` ni `console.error` ;
  - US3-2 : couleur → `data-value` ;
  - US3-3 : vitesse `0` → `"0"`, et `1.5` → `"1.5"` ;
  - US3-4 : alerte → `data-alert` on puis off (tolérance de ±300 ms) ;
  - US3-5 `@repli` (projet `sans-3d`) : « 3D indisponible » visible, `data-var="couleur"`, et suivi de la couleur ;
  - US3-6 : avec `?debug=1`, `[data-fps]` est visible et `stats().fps` contient des valeurs pour `overlay-3d` en moins de 3 s ; sans ce paramètre, ni `[data-fps]` ni FPS.
- [ ] T029 [P] [US2] Créer `shared/e2e/bords.spec.ts` (cas limites testables de la spec gelée, titres `BORD-…`) :
  - service absent au chargement de l'overlay, puis démarré → affichage en moins de 3 s ;
  - rafale de 50 `set` du score → la valeur finale est affichée ;
  - titre vide → `data-value=""` et aucune erreur ;
  - dashboard : `maxlength=80` sur le titre (saisir 100 caractères donne 80), `min`, `max` et `step` sur le score et la vitesse ;
  - deux dashboards → une modification dans l'un apparaît dans l'autre ;
  - échec du chargement du modèle (`page.route("**/*.glb", r => r.abort())`) → repli `@repli` affiché, en projet `standard`. Ce test-là est titré sans `@repli`, mais vérifie le repli.
- [ ] T030 [US2] Créer `shared/e2e/manuels.ts` : la liste des scénarios non automatisables, avec la raison de chacun.
  - SC-002 de la spec gelée : découverte en moins d'une minute.
  - Rendu visuel de l'animation : ×1,15 et flash.
  - US2-7 dans OBS : transparence réelle.
  - US3-1 : rotation continue visible.
  - US3-2 : teinte visible du modèle.
  - US3-3 : vitesse perçue.
  - US3-4 : saut et 2 tours visibles.
- [ ] T031 [US2] Créer `shared/bench/record.ts` :
  - `record(entree)` ajoute l'entrée à `results/mesures.json` (chemin résolu depuis le fichier), en créant `{version:1, entrees:[]}` si besoin. Écriture atomique : fichier `.tmp`, puis `renameSync` ;
  - il calcule `id`, `horodatage` et `conditions.commit` (`git rev-parse --short HEAD`) ;
  - pour les mesures `cpu-*` et `gpu-*` hors référence, `net` = `valeur` − dernière entrée valide `cpu-reference` / `gpu-reference` ;
  - mode ligne de commande : lancé directement, il lit une entrée JSON sur l'entrée standard et l'enregistre.
- [ ] T032 [US2] Créer `shared/e2e/mesures-reporter.ts` (reporter Playwright). À `onEnd`, il appelle `record()` de `shared/bench/record.ts` avec :
  - `framework = FRAMEWORK` ;
  - `mesure: "e2e"`, `valeur` = nombre de réussis, `unite: "tests"` ;
  - `details: { echoues, listeEchecs (titres), manuels (de manuels.ts), dureeMs, projets }`.

  Il dépend de T031.
- [ ] T033 [US2] Construire puis servir le témoin, et lancer la suite (`APP_URL=http://localhost:4170`, `FRAMEWORK=temoin`). Corriger l'outillage ou le témoin jusqu'à 100 % au vert dans les deux projets (SC-001). Vérifier qu'une entrée `e2e` est bien écrite et que `dureeMs` est inférieur à 300000 (SC-006).
- [ ] T034 [US2] Lancer la suite avec `FRAMEWORK=temoin-defaut` et `APP_QUERY=defaut=bandeau`, puis `score`, `alerte` et `reconnexion`. Vérifier que le scénario visé échoue (US2-3, US2-2, US2-4, US2-6), ce qui couvre SC-002 et le scénario US2-4 de cette feature. Noter le résultat dans `specs/002-infra-commune/quickstart.md`, rubrique « Résultats de validation ».

**Checkpoint** : la suite est validée. Elle détecte les défauts et passe sur le témoin.

---

## Phase 6: User Story 3 - Mesurer chaque implémentation de façon reproductible (Priority: P1)

**Goal** : tous les scripts de mesure écrivent dans `results/mesures.json`, et la grille se génère sans saisie.

**Independent Test** : quickstart §4 sur le témoin, c'est-à-dire des entrées `poids-*`, `lignes` et `latence-*` valides, puis `results/grille.md` généré.

- [ ] T035 [P] [US3] Créer `shared/bench/latency.ts` (options `--framework`, `--count 200`, `--interval 100`, `--obs-fps`) :
  1. vérifier via `GET /health` que `overlay-a` et `overlay-b` sont connectés ;
  2. `POST /stats/reset` ;
  3. se connecter en `hello {role:"bench"}` ;
  4. envoyer `count` mises à jour à `interval` ms, en tournant entre titre (`"Mesure n"`), score (`n`) et bandeau (alterné) ;
  5. attendre 2500 ms, puis lire `GET /stats` ;
  6. calculer, par overlay, la médiane, le p95 (méthode du rang le plus proche) et le taux d'accusés perdus. Accusés attendus : titre ou score → `overlay-a`, bandeau → `overlay-b` ;
  7. enregistrer `latence-mediane` et `latence-p95` (toutes mesures confondues, avec le détail par overlay), `valide = pertes ≤ 2 %`, `conditions.obsFps`.
- [ ] T036 [P] [US3] Créer `shared/bench/alerts.ts` (options `--count 10`, `--interval 3000`) : se connecter en `bench`, envoyer les alertes, afficher la progression. Rien n'est enregistré.
- [ ] T037 [P] [US3] Créer `shared/bench/sizes.ts` (option `--framework`) :
  - lire `apps/<fw>/dist/.vite/manifest.json`, avec une erreur explicite si le fichier est absent (« activer build.manifest ») ;
  - pour chaque entrée `dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html`, faire la somme gzip (`zlib.gzipSync`) du HTML de `dist`, du `file`, des `imports` (récursifs, dédupliqués) et des `css` de tous ces chunks ;
  - calculer à part les `dynamicImports` (récursifs) ;
  - exclure les `.glb` ;
  - enregistrer `poids-<page>` en Ko (2 décimales), avec `details {differeKo, fichiers}`.
- [ ] T038 [P] [US3] Créer `shared/bench/fps.ts` (options `--framework`, `--duration 60`, `--obs-fps`) :
  1. vérifier que `overlay-3d` est connecté ;
  2. `POST /stats/reset` ;
  3. attendre `duration` ;
  4. lire les FPS de `overlay-3d`, en ignorant le premier échantillon ;
  5. enregistrer `fps-min` et `fps-moyen`, avec `details {plafond, ratio}`.
- [ ] T039 [P] [US3] Créer `shared/bench/cloc.ts` (option `--framework`) :
  - lancer `C:\Program Files\Git\usr\bin\perl.exe` sur `shared/node_modules/cloc/lib/cloc` avec `--json apps/<fw>/src` (chemin de Perl modifiable via `PERL_PATH`) ;
  - enregistrer `lignes` = `SUM.code`, avec le détail par langage. Erreur explicite si Perl est introuvable.
- [ ] T040 [P] [US3] Créer `shared/bench/cpu.ps1` (paramètres `-Framework`, `-Scenario reference|repos|alertes|3d`, `-Duration 60`, `-ObsFps`, `-Acceleration on|off`), compatible PowerShell 5.1 :
  - fixer `$OutputEncoding = [Text.UTF8Encoding]::new($false)` en tête du script, pour que l'entrée standard transmise à Node soit en UTF-8 ;
  - échouer si aucun processus `obs64` n'existe ;
  - toutes les secondes, pendant `Duration` : interroger `Win32_PerfFormattedData_PerfProc_Process` avec `Name` = `obs64` ou `Name` qui commence par `obs-browser-page`, et sommer `PercentProcessorTime` divisé par `NumberOfLogicalProcessors` ;
  - au même rythme, sommer `UtilizationPercentage` de `Win32_PerfFormattedData_GPUPerformanceCounters_GPUEngine` dont le `Name` contient `pid_<un PID retenu>_` et `engtype_3D` ;
  - calculer la moyenne et le maximum, puis envoyer deux entrées JSON (`cpu-<scenario>` et `gpu-<scenario>`, avec le framework `reference` si le scénario est `reference`) à `node shared/bench/record.ts` sur l'entrée standard, avec les conditions `obsFps` et `accelerationMaterielle`.
- [ ] T041 [US3] Créer `shared/bench/grille.ts` :
  - lire `results/mesures.json` et, pour chaque couple (framework, mesure), retenir la dernière entrée valide, en ignorant `temoin-defaut` ;
  - générer `results/grille.md` : un tableau dont les lignes suivent la grille du document de spike (critères validés, poids 2D et 3D, CPU et GPU nets, FPS min ÷ plafond, latences médiane et p95, lignes, nombre de passages E2E avant le vert) et les colonnes sont React, Vue, Svelte et témoin ;
  - mettre « — » pour une valeur absente, et rappeler en bas de page que la latence ne couvre que le trajet du service à l'overlay.
- [ ] T042 [US3] Dérouler le quickstart §4 sur le témoin : poids, lignes, latence (deux fenêtres visibles), puis grille. Vérifier que la latence est valide et que la médiane est inférieure à 3 images (SC-003). Noter le résultat dans « Résultats de validation » de `quickstart.md`.

**Checkpoint** : toutes les mesures automatiques fonctionnent sur le témoin.

---

## Phase 7: User Story 5 - Préparer les mesures manuelles dans OBS (Priority: P2)

**Goal** : un protocole OBS reproductible, que Lilian peut dérouler sans aide.

**Independent Test** : quickstart §5 sur le témoin, en moins de 30 minutes (SC-007).

- [ ] T043 [US5] Rédiger `results/protocole-obs.md`. Il doit couvrir :
  - les prérequis : version d'OBS à noter, fermer les onglets de navigateur des overlays ;
  - l'accélération matérielle des sources navigateur (Paramètres > Avancé), puis le redémarrage d'OBS ;
  - la cadence d'images d'OBS (Paramètres > Vidéo), à noter et à garder identique pour toutes les mesures ;
  - la création d'une scène vide « Référence », puis d'une scène par framework avec 3 sources navigateur en 1920×1080 (`overlay-a`, `overlay-b`, `overlay-3d`), avec la case « Arrêter la source quand elle n'est pas visible » cochée ;
  - une scène « FPS » avec `overlay-3d.html?debug=1` ;
  - l'ordre des mesures pour chaque framework :
    1. référence (une seule fois par session) ;
    2. `repos` 60 s ;
    3. `alertes` (lancer `npm run alertes` puis `cpu.ps1 -Duration 30` en parallèle) ;
    4. `3d` 60 s avec seulement la source 3D visible ;
    5. latence (`npm run latence`) avec la scène visible ;
    6. FPS (scène « FPS », `npm run fps`) ;
  - la commande exacte et l'emplacement du résultat pour chaque étape ;
  - une rubrique « ressenti /5 », à saisir à la main dans le journal.
- [ ] T044 [US5] Dérouler le protocole avec Lilian sur le témoin (quickstart §5), en le chronométrant. Corriger les étapes peu claires. Noter dans `quickstart.md` la durée réelle et les entrées `cpu-*`, `gpu-*` et `fps-*` obtenues.

**Checkpoint** : les mesures OBS du témoin sont dans la grille.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose** : contrôle final et pose du tag `base-commune`.

- [ ] T045 [P] Lancer `npm run typecheck` dans `shared/` et `npm run build` dans `apps/temoin` : aucune erreur.
- [ ] T046 [P] Vérifier que `shared/` respecte le principe II : aucun `enum`, aucun `namespace`, tous les imports relatifs portent l'extension `.ts`, et aucune dépendance n'est importée par `client.ts`, `probe.ts`, `fps.ts` ou `protocol.ts`.
- [ ] T047 Ajouter `shared/README.md` : un aperçu en 10 lignes et des liens vers `specs/002-infra-commune/contracts/` et `quickstart.md`. C'est le point d'entrée des trois implémentations.
- [ ] T048 Fusionner `002-infra-commune` dans `main` (`--no-ff`), puis poser le tag annoté `base-commune`.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)** : aucune dépendance.
- **Phase 2 (Foundational)** : après Phase 1. Elle bloque tout le reste.
- **Phase 3 (US1)** : après Phase 2.
- **Phase 4 (US4, témoin)** : après US1 (elle a besoin de `client.ts`).
- **Phase 5 (US2, suite)** : l'écriture des tests (T026 à T032) peut commencer après US1. Les validations T033 et T034 exigent US4.
- **Phase 6 (US3, mesures)** : elle a besoin de `record.ts` (T031). T042 exige le témoin (US4).
- **Phase 7 (US5)** : après US3 (scripts) et US4. Lilian doit être disponible avec OBS.
- **Phase 8** : après toutes les phases.

### User Story Dependencies

- US1 : socle, aucune dépendance de story.
- US4 : dépend de US1.
- US2 : dépend de US1 pour écrire les tests, et de US4 pour les valider.
- US3 : dépend de US1 (service et statistiques) et de T031. Sa validation dépend de US4.
- US5 : dépend de US3 et de US4.

### Parallel Opportunities

- T002 et T003 en parallèle de T001. T006, T007 et T008 (modèle) en parallèle de T005.
- T010 et T011 en parallèle, puis T012.
- T018 à T021 en parallèle, puis T023 à T025 en parallèle.
- T026 à T029 en parallèle (4 fichiers de tests indépendants).
- T035 à T040 en parallèle (6 scripts indépendants, tous branchés sur `record.ts`).

---

## Parallel Example: User Story 2

```text
T026 shared/e2e/dashboard.spec.ts
T027 shared/e2e/overlays.spec.ts
T028 shared/e2e/overlay-3d.spec.ts
T029 shared/e2e/bords.spec.ts
→ puis T030 à T032, puis la validation T033 et T034
```

## Parallel Example: User Story 3

```text
T035 latency.ts | T036 alerts.ts | T037 sizes.ts | T038 fps.ts | T039 cloc.ts | T040 cpu.ps1
→ puis T041 grille.ts, puis la validation T042
```

---

## Implementation Strategy

### MVP First

1. Phases 1 et 2, puis US1 : le service et le client fonctionnent, et `service.spec.ts` est au vert.
2. US4 et US2 : la suite est validée sur le témoin et sur les défauts injectés. **C'est le minimum pour démarrer les implémentations de façon équitable.**
3. US3 et US5 : les mesures. Elles sont indispensables avant la phase de mesure du spike, mais elles pourraient, en théorie, être finies pendant les implémentations. **On ne le fait pas** : la constitution exige que `shared/` soit complet avant `base-commune`.

### Incremental Delivery

Un commit par phase sur `002-infra-commune`. Le tag n'est posé qu'à la fin de la Phase 8.

---

## Notes

- Toute modification de `shared/` après `base-commune` passe par un amendement appliqué aux trois apps (constitution, principe II).
- T044 exige la présence de Lilian (OBS). Toutes les autres tâches sont exécutables par l'agent.

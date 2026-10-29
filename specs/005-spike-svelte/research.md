# Research — implémentation Svelte (005-spike-svelte)

Sources : spec gelée (copie identique), constitution v1.0.0, contrats de `specs/002-infra-commune/`, gabarit officiel `create-vite --template svelte-ts`, documentation officielle via le MCP Svelte (sections « .svelte.ts files », « Best practices », « {#key} », « <svelte:options> »), paquet npm `@threlte/core@8.6.1`.

## R1 — Versions et chaîne d'outils

- **Decision** : `svelte` ^5.57, `@sveltejs/vite-plugin-svelte` ^7.3, `vite` ^8.3.5, `@threlte/core` ^8.6, `three` ^0.186, `@types/three` ^0.186, `svelte-check` ^4.7, `@tsconfig/svelte` ^5.0, **`typescript` ~6.0**.
- **Rationale** : ce sont les versions courantes, alignées sur le gabarit officiel `svelte-ts` de create-vite. `svelte-check` (seul outil qui vérifie les types des fichiers `.svelte`) déclare `typescript: ^5 || ^6` en dépendance pair : TypeScript 7, utilisé par le témoin, n'est pas pris en charge. Le gabarit officiel fixe d'ailleurs `typescript ~6.0.3`.
- **Alternatives** : TypeScript 7 avec `tsc` seul (ne vérifie pas les `.svelte`, donc pas de contrôle de types des composants) ; forcer TS 7 sous `svelte-check` (dépendance pair non respectée, comportement non garanti). Rejetées.
- **À journaliser** : point de friction « outillage » (svelte-check en retard d'une version majeure de TypeScript).

## R2 — Structure du projet Vite multi-pages

- **Decision** : 4 fichiers HTML à la racine de `apps/svelte/` (`dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html`). Chacun charge un point d'entrée `src/<page>.ts` qui appelle `mount(<Composant>, { target })`, comme dans `main.ts` du gabarit. La config Vite ajoute `svelte()` au contrat d'intégration (alias `@shared`, `server.fs.allow`, `build.manifest`, 4 entrées, `preview` 4175 en `strictPort`).
- **Rationale** : contrat `integration-apps.md` et FR-044 (une entrée de build par page). Pas de SvelteKit (constitution III).
- **Alternatives** : une page unique avec routage par paramètre (viole FR-044) ; SvelteKit (interdit).

## R3 — Mode runes imposé à la compilation

- **Decision** : `svelte.config.js` déclare `compilerOptions.runes` à `true` pour les fichiers du projet et `undefined` pour `node_modules` (forme utilisée par les gabarits officiels `sv create`).
- **Rationale** : la constitution impose « runes uniquement : pas de `export let`, pas de `$:` ». Le compilateur refuse alors toute syntaxe héritée, au lieu de compter sur la relecture. Les dépendances (Threlte) gardent leur propre mode.
- **Alternatives** : `<svelte:options runes />` dans chaque composant (oubli possible) ; aucune option (le mode est déduit composant par composant).

## R4 — État partagé : une classe à champs `$state` dans un `.svelte.ts`

- **Decision** : `src/lib/live.svelte.ts` exporte une classe `Live` dont les champs sont des `$state` : `vars`, `values`, `connected`, `alerte` (actif, numéro, instant de début). Le constructeur appelle `connect()` de `@shared/client.ts` **une seule fois** et branche ses rappels sur ces champs. Elle expose `set(id, value)` et `alert()`. Chaque composant racine de page crée sa propre instance et la passe aux enfants en props.
- **Rationale** : constitution (« Runes dans des fichiers `.svelte.ts` », pas de `svelte/store` pour l'état applicatif). Les bonnes pratiques officielles recommandent « des classes avec des champs `$state` pour partager la réactivité entre composants, plutôt que des stores ». `vars` est remplacé en bloc à chaque `welcome` (`$state.raw`, conseillé pour les données reçues d'une API et seulement réaffectées) ; `values` est un objet profond muté clé par clé (une mise à jour = une propriété).
- **Alternatives** : `svelte/store` (interdit) ; contexte `createContext` (inutile : une page = un arbre court, sans SSR) ; état au niveau du module (une seule instance par page de toute façon, mais moins explicite).

## R5 — Dashboard : champs générés, envoi à chaque événement

- **Decision** : `{#each live.vars as def (def.id)}` (bloc keyé, recommandé) puis un `{#if}` sur `def.type` qui choisit le contrôle natif : `text` → `input[type=text]` + `maxlength`, `number` → `input[type=number]` + `min/max/step=1`, `boolean` → `input[type=checkbox]`, `color` → `input[type=color]`, `speed` → `input[type=range]` + `min/max/step`. Liaison **à sens unique** (`value={…}` / `checked={…}`) et envoi dans le gestionnaire `oninput` (`onchange` pour la case à cocher). Chaque gestionnaire met à jour `live.values[id]` puis appelle `live.set(id, valeur)`. Un nombre saisi partiellement (`-`, vide) ou hors bornes n'est pas envoyé : le service le rejetterait de toute façon.
- **Rationale** : FR-010 à FR-012 et FR-045. Les bonnes pratiques officielles placent le code déclenché par l'utilisateur dans le gestionnaire d'événement, pas dans un `$effect`. Un `$effect` sur une valeur liée par `bind:value` regrouperait les changements d'une même tâche, ce qui contredit « une mise à jour par événement, sans regroupement » (FR-012).
- **Alternatives** : `bind:value` + `$effect` d'envoi (regroupement possible, et boucle d'écho) ; bouton de validation (interdit par FR-012).

## R6 — Dashboard : écho de ses propres modifications

- **Decision** : le service renvoie chaque `update` à son émetteur (protocole). Pendant la frappe, l'écho de « a » peut arriver après que le champ affiche déjà « ab » et l'écraser. Le dashboard **ignore une `update` qui vise le champ ayant le focus** (`document.activeElement` porte `data-var` égal à l'id). Les autres champs, et le même champ une fois le focus perdu, suivent toutes les mises à jour.
- **Rationale** : US1-2 (une mise à jour par frappe, valeurs `a`, `ab`, `abc`), US1-4 et BORD-deux-dashboards (une modification venue d'ailleurs s'affiche). Le champ actif contient déjà la valeur la plus récente saisie localement.
- **Alternatives** : compter les échos attendus par variable (fragile si un autre dashboard écrit entre deux) ; ne jamais appliquer les échos (casse « dernière modification l'emporte » quand le focus n'y est plus).

## R7 — Animation d'alerte 2D

- **Decision** : `@keyframes alerte` en CSS (`scale(1)` → `scale(1.15)` + `brightness(2.5)` à 30 % → retour, 2 s, `ease-out`), appliquée par une **attachment** Svelte (`{@attach rejouer(live.alerte.numero)}`) qui, à chaque nouveau numéro d'alerte, annule l'animation en cours et la relance avec l'API Web Animations native (`element.animate(...)`, mêmes keyframes). `data-alert` sur la racine vaut `on` quand `live.alerte.actif`, géré par un minuteur unique de `ALERT_DURATION_MS` réarmé à chaque alerte (redémarrage depuis le début, FR-023 et US2-5).
- **Rationale** : moyens natifs du navigateur, sans librairie (FR-023). La documentation officielle signale `{#key}` comme « très coûteux » (démontage et remontage de tout le contenu) et recommande `{@attach}` pour piloter le DOM ; c'est aussi plus juste pour la mesure de charge CPU pendant 10 alertes.
- **Alternatives** : `{#key numero}` + classe CSS (remontage à chaque alerte, déconseillé) ; `svelte/transition` personnalisée dans un `{#key}` (même coût) ; bascule de classe avec reflow forcé (`offsetWidth`), impératif et moins idiomatique.

## R8 — Overlay 3D avec Threlte 8

- **Decision** :
  - `@threlte/core` seul : `<Canvas>`, `<T.*>`, `useTask`. Le rendu par défaut de Threlte crée un `WebGLRenderer` avec `alpha: true` (vérifié dans le paquet), donc fond transparent sans configuration.
  - Le modèle (`@shared/assets/model.glb?url`) est chargé **hors du Canvas** avec `GLTFLoader.loadAsync` (`three/addons/loaders/GLTFLoader.js`). Le succès range la géométrie du premier `Mesh` dans un `$state.raw` et le Canvas est monté par un `{#if}`. L'échec est intercepté par `.catch` et bascule en repli, sans rejet non géré (US3-1 interdit toute erreur console).
  - La géométrie est rendue en déclaratif : `<T.Mesh geometry={…} bind:ref>` avec `<T.MeshStandardMaterial color={live.values.couleur}>`, une caméra `makeDefault` et deux lumières.
  - `useTask((delta) => …)` fait avancer l'angle de base (`vitesse × 2π × delta`) et ajoute, pendant 2 s après le début de l'alerte, le saut (`0,5 × sin(π·e)`) et les 2 tours (`4π·e`), avec `e` en ease-out (cubique) du temps écoulé. Une alerte pendant une alerte remet l'instant de début (redémarrage).
- **Rationale** : constitution (Threlte 8, pas de librairie d'animation), FR-030 à FR-033. Charger hors Canvas décide du repli dans le DOM (FR-033, BORD-modele-absent) sans faire remonter une erreur depuis le contexte Threlte. Muter l'objet dans `useTask` évite de repasser des props à chaque image (pratique recommandée par Threlte).
- **Alternatives** : `useLoader(GLTFLoader)` de Threlte (exige d'être dans le Canvas ; le repli doit alors remonter par un rappel) ; `@threlte/extras` `useGltf` (dépendance supplémentaire, poids mesuré) ; props `rotation.y` réactives à chaque image (diff inutile).

## R9 — Détection de l'absence de 3D

- **Decision** : avant de monter le Canvas, `document.createElement("canvas").getContext("webgl2") ?? getContext("webgl")`. Si `null`, l'état initial est le repli, et le modèle n'est même pas chargé.
- **Rationale** : avec `--disable-3d-apis` (projet Playwright `sans-3d`) ou l'accélération désactivée dans OBS, Three lèverait une erreur à la création du renderer. Le test évite une page vide (US3-5).
- **Alternatives** : laisser Threlte échouer et intercepter l'erreur (`<svelte:boundary>`) : possible, mais l'erreur serait journalisée en console et le repli arriverait plus tard.

## R10 — Contrat DOM et sonde de latence

- **Decision** : chaque élément lié porte `data-var={id}` et `data-value={serialize(def.type, valeur)}` (fonction de `@shared/protocol.ts`). Overlay B : le bandeau reste dans le DOM, masqué par une classe (`display:none`) quand la valeur est fausse. Overlay 3D : deux `<span hidden>` (`couleur`, `vitesse`) dans le conteneur de scène ; en repli, le bloc « 3D indisponible » porte `data-var="couleur"` et remplace le `<span>` couleur. Aucun appel à la sonde dans l'app : `connect({ name })` s'en charge (contrat d'intégration).
- **Rationale** : FR-040 à FR-043, unicité des `data-var`. Svelte applique les changements d'état au DOM avant la prochaine image, et la sonde vérifie à chaque `requestAnimationFrame`.

## R11 — Typage et build

- **Decision** : `npm run build` = `svelte-check --tsconfig ./tsconfig.app.json && vite build`. `tsconfig.app.json` étend `@tsconfig/svelte` avec `strict`, `allowImportingTsExtensions`, `types: ["svelte", "vite/client"]` et `paths` `@shared/*`. `tsconfig.node.json` couvre `vite.config.ts` (organisation du gabarit officiel).
- **Rationale** : constitution III (TypeScript strict), contrat d'intégration, et équivalent du `tsc --noEmit && vite build` du témoin.

## R12 — Points de contrôle par story

- **Decision** : à la fin de chaque story, un script Playwright jetable (dans le dossier scratchpad de la session, hors dépôt et hors suite) ouvre les pages du build de production, pilote le service et prend des captures d'écran. La suite partagée n'est lancée qu'en entier, avec `FRAMEWORK=svelte`.
- **Rationale** : même méthode que pour React et Vue (équité). Une campagne partielle fausserait le compte des passages avant le vert.

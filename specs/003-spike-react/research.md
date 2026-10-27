# Research — implémentation React (003-spike-react)

Les sources consultées sont `shared/` (code et E2E), `specs/001-spec-spike`, `specs/002-infra-commune` et la configuration du témoin, qui fait partie de la base commune et n'utilise aucun framework. Les versions viennent du registre npm, consulté le 2026-10-27. Aucun code Vue ou Svelte n'a été lu.

## R1. Versions et branchement de React Compiler

**Decision** :

| Paquet | Version | Remarque |
| --- | --- | --- |
| `react`, `react-dom` | `~19.2.9` | La constitution impose 19.2. La 19.3.1 est publiée, d'où `~` et non `^`. |
| `@types/react`, `@types/react-dom` | `~19.2.18` | Alignés sur 19.2 |
| `zustand` | `^5.0.16` | — |
| `three` / `@types/three` | `~0.186.1` / `~0.186.0` | `three` est une dépendance directe, requise par R3F (pair `>=0.156`). |
| `@react-three/fiber` | `^9.8.2` | Pair `react >=19 <19.4`, compatible |
| `@react-three/drei` | `^10.7.9` | Pair `@react-three/fiber ^9` |
| `vite` | `^8.3.5` | Même version que le témoin |
| `@vitejs/plugin-react` | `^6.1.2` | Pair `vite ^8` |
| `@rolldown/plugin-babel` | `^0.2.4` | Exécute Babel dans le pipeline Rolldown de Vite 8 |
| `@babel/core` (+ `@types/babel__core`) | `^7.29.7` | Babel 7, voir plus bas |
| `babel-plugin-react-compiler` | `^1.0.0` | Imposé par la constitution |
| `typescript` | `^7.0.2` | Même version que `shared/` et le témoin |

Le branchement retenu est la voie documentée « Babel React Compiler » de `@vitejs/plugin-react` 6 :

```ts
plugins: [react(), babel({ presets: [reactCompilerPreset()] })]
```

**Rationale** : depuis la v6, `@vitejs/plugin-react` n'embarque plus Babel. La constitution nomme explicitement `babel-plugin-react-compiler`, et `reactCompilerPreset` est l'intégration officielle de ce plugin avec Vite 8. On choisit Babel 7 plutôt que Babel 8 (8.0.9 est disponible) parce que `babel-plugin-react-compiler` 1.0 dépend de `@babel/types ^7.26`. Ce couple est le plus éprouvé.

**Alternatives considered** :
- l'option `react({ compiler: true })` avec `oxc-transform-react` (port Rust). Elle est marquée expérimentale par le README, et ce n'est pas le plugin imposé, donc on l'écarte ;
- React 19.3. On l'écarte, car la constitution impose 19.2 ;
- Babel 8. Le gain est nul pour le spike, et le risque de compatibilité existe.

**Vérification à l'implémentation** : le build doit montrer que les composants sont compilés, par exemple par la présence de `react/compiler-runtime` ou de `_c(` dans le bundle. Si ce n'est pas le cas, l'écart est noté dans le journal, catégorie « configuration ».

## R2. Une seule connexion par page, hors de l'arbre React

**Decision** : chaque point d'entrée appelle `demarrer(role, name?)` (`src/live/connexion.ts`) **avant** `createRoot().render()`. Cette fonction appelle `connect()` une seule fois et relie ses callbacks aux actions du store Zustand. Elle conserve la `Connection` au niveau du module, et le dashboard l'utilise pour `set` et `alert`. `<StrictMode>` est conservé, comme dans le gabarit Vite React par défaut.

**Rationale** : le contrat impose un seul `connect()` par page. Un `useEffect` serait monté deux fois en développement sous StrictMode et ouvrirait deux sockets. Zustand est conçu pour être alimenté hors de React (`store.setState`, actions appelées depuis n'importe où). La connexion est une ressource externe de la page, pas d'un composant.

**Alternatives considered** :
- `useEffect` avec nettoyage dans un composant racine. On l'écarte, car il produit une double connexion en développement, et `onWelcome` serait appelé deux fois ;
- un contexte React qui porte la connexion. Il est inutile, puisque le store est déjà global à la page.

## R3. Forme du store et abonnements

**Decision** : un store Zustand par page (chaque page est un bundle distinct), créé avec `create()`. Son contenu est décrit dans [data-model.md](data-model.md). Les composants lisent une seule valeur avec un sélecteur, par exemple `useLive((s) => s.values.titre)`. Ainsi, une mise à jour de `score` ne rend que l'élément du score.

**Rationale** : c'est l'usage standard de Zustand 5. Les sélecteurs scalaires n'ont pas besoin de `useShallow`.

**Alternatives considered** : `useSyncExternalStore` maison. On l'écarte, car la constitution impose Zustand.

## R4. Dashboard : écho des mises à jour et contrôles natifs

Le service renvoie chaque `update` à **tous** les clients, émetteur compris. Si le dashboard appliquait l'écho de « a » pendant que l'utilisateur a déjà tapé « ab », le champ reviendrait à « a » et la frappe suivante donnerait « ac ». Le test `US1-2 la saisie au clavier` échouerait alors.

**Decision** : un compteur d'attente par variable (`pending[id]`) :
- à chaque saisie valide, le store applique la valeur localement (le champ contrôlé l'affiche aussitôt), incrémente `pending[id]` et appelle `connexion.set(id, value)`. Si le dashboard est déconnecté, rien n'est envoyé et rien n'est compté, car `set` est sans effet hors connexion ;
- à chaque `update` reçu pour `id` :
  - si `pending[id] > 0`, on décrémente. On n'applique la valeur reçue que lorsque le compteur retombe à 0 : c'est la dernière valeur retenue par le service, qui fait foi, comme le veut le cas limite « dernière modification gagnante » ;
  - sinon, la valeur est appliquée directement (US1-4, deux dashboards) ;
- `welcome` remet tous les compteurs à 0.

**Comportement hors connexion** : `saisir` ne fait rien quand le dashboard est déconnecté. Les champs contrôlés (texte, case, couleur, curseur) refusent donc la saisie et gardent la dernière valeur connue. Le champ numérique affiche son brouillon, mais n'envoie rien. La spec ne précise pas ce cas, et aucun test ne le couvre. Ce comportement est accepté, car l'indicateur `data-connection="off"` signale déjà la coupure (FR-014).

Pour que chaque `set` reçoive son écho, le dashboard n'envoie que des valeurs valides : `v = normalize(def, valeur)` puis `validate(def, v)` de `@shared/protocol.ts`. Cet ordre compte : une position de curseur comme `0.15000000000000002` échouerait au contrôle du pas avant l'arrondi. Un `set` invalide serait ignoré par le service, sans diffusion, et bloquerait le compteur.

Contrôles (un composant `Champ`, qui choisit le contrôle selon `def.type`) :

| Type | Contrôle | Lecture de la saisie |
| --- | --- | --- |
| `text` | `input[type=text]` avec `maxLength={def.maxLength}` | `e.target.value`. Le navigateur refuse la saisie au-delà de 80 caractères (BORD-titre-long). |
| `number` | `input[type=number]` avec `min`, `max` et `step=1` | Brouillon local (chaîne) : la saisie est affichée telle quelle (`""`, `"-"`), et seule une valeur entière dans les bornes est envoyée. Le brouillon se resynchronise sur la valeur du store quand celle-ci change. |
| `boolean` | `input[type=checkbox]` | `e.target.checked` |
| `color` | `input[type=color]` | `e.target.value`, en minuscules |
| `speed` | `input[type=range]` avec `min`, `max` et `step` | `Number(e.target.value)` |

Chaque champ porte `data-var` et une valeur contrôlée. `onChange` de React correspond à l'événement `input` natif : une mise à jour est envoyée à chaque frappe ou position du curseur, sans throttle (FR-012). Le libellé est un `<label>` qui contient un `<span>` (le texte exact, pour `getByText(..., { exact: true })`) et le contrôle. Aucun autre élément de la page ne porte `data-var`, car US1-1 compte exactement 5 éléments.

**Alternatives considered** :
- ignorer les mises à jour du champ qui a le focus. C'est plus simple, mais un dashboard concurrent ne serait jamais reflété tant que le focus reste sur le champ ;
- des champs non contrôlés (`defaultValue` et une ref). On l'écarte, car ce n'est pas l'usage React par défaut et il faudrait écrire dans le DOM à la main pour US1-4.

## R5. Alerte 2D : état, durée et redémarrage

**Decision** :
- le store porte `alerte: { seq, active }`. L'action `alerte(seq)`, appelée par `onAlert`, passe `active` à `true`, mémorise `seq` et (re)lance **un minuteur de module** de `ALERT_DURATION_MS` (2000 ms) qui repasse `active` à `false`. Une alerte reçue pendant une alerte annule le minuteur précédent ;
- la racine de chaque overlay rend `data-alert={active ? "on" : "off"}` ;
- le composant `Alerte` enveloppe les éléments animés. Quand `active` est vrai, il applique la classe `alerte` avec `key={seq}` : le remontage relance la keyframe depuis le début (US2-5) ;
- la keyframe CSS dure 2 s en `ease-out`. Elle fait monter `transform: scale()` de 1 à 1,15 puis revenir à 1, et elle fait apparaître puis disparaître le flash (`filter: brightness()` et un `text-shadow`/`box-shadow` lumineux) en même temps.

**Interprétation de « courbe ease-out » (FR-023)** : en CSS, la fonction de temporisation d'une animation s'applique **à chaque segment** entre deux keyframes, ici 0 → 30 % puis 30 → 100 %, et non à l'ensemble des 2 s. Pour un aller-retour (grossir puis revenir), une seule courbe sur l'ensemble est impossible avec des keyframes. On retient donc un ease-out par segment : montée rapide puis retour amorti. L'overlay 3D, lui, calcule une seule courbe ease-out sur la progression totale (R6), car c'est naturel en JavaScript. La spec gelée ne tranche pas. Ce choix est noté dans le journal pour que la comparaison avec Vue et Svelte se fasse en connaissance de cause.

**Rationale** : un minuteur indépendant de l'animation garantit que `data-alert` repasse à `off` même si l'élément animé est masqué (bandeau à faux, donc pas de `animationend`). Le même mécanisme sert à l'overlay 3D. Le remontage par `key` est la façon idiomatique de relancer une animation CSS en React. Les animations CSS sont un moyen natif du navigateur, autorisé par FR-023.

**Alternatives considered** :
- `onAnimationEnd` pour repasser à `off`. On l'écarte, car il n'est jamais émis sur un élément en `display:none` ;
- la Web Animations API dans un effet. C'est plus de code pour le même rendu ;
- un `setTimeout` dans un `useEffect` par overlay. Il est dupliqué, et il oblige à appeler `setState` dans un effet.

## R6. Overlay 3D : R3F, modèle, animation et repli

**Decision** :
- **Canvas** : `<Canvas>` de R3F, en plein cadre (1920×1080) dans le conteneur de scène. Le rendu est transparent : `alpha` est vrai par défaut et aucune couleur de fond n'est définie. La caméra est en `[0, 0, 4]`, avec un champ de 50°. Une lumière ambiante et une lumière directionnelle éclairent la scène, et `frameloop="always"` (valeur par défaut) assure la rotation continue.
- **Modèle** : `useGLTF(modelUrl)` de drei, avec `modelUrl` venant de `@shared/assets/model.glb?url`. Le maillage de Suzanne est extrait une fois dans un `useMemo` (parcours de `scene`), puis rendu avec `<mesh geometry={...}><meshStandardMaterial color={couleur} /></mesh>`. La couleur est donc déclarative, liée au store. Le modèle n'est pas compressé en Draco, donc aucun décodeur n'est téléchargé.
- **Rotation et alerte** : `useFrame((state, delta) => …)` lit `vitesse` avec `useLive.getState()`, le schéma de « mises à jour transitoires » recommandé par la doc R3F pour éviter un rendu React par image. Il calcule :
  - la rotation continue : `rotation.y += vitesse × 2π × delta` (0 l'arrête) ;
  - l'alerte : à chaque nouveau `seq`, on mémorise `state.clock.elapsedTime`. Pendant 2 s, avec `p` la progression et `e = easeOut(p)`, on applique `position.y = 0,5 × sin(π × e)` (montée puis descente) et un décalage de rotation de `2 × 2π × e`, ajouté à la rotation continue. Au-delà de 2 s, les décalages sont nuls. Une nouvelle alerte relance le calcul (FR-032).
- **Contrat DOM** : la racine porte `data-alert`, alimenté par le même `alerte.active` qu'en 2D. Le conteneur de scène contient deux `<span hidden>` : `data-var="couleur"` (dans la branche scène) et `data-var="vitesse"` (hors de la limite d'erreur, toujours présent).
- **Repli** :
  1. avant de monter le `<Canvas>`, on teste WebGL avec `canvas.getContext("webgl2") ?? getContext("webgl")` sur un canvas jetable. Si la réponse est `null` (projet `sans-3d`), le repli est rendu directement ;
  2. une error boundary (`LimiteErreur`, un composant classe de React, car React 19 n'a pas d'équivalent en hook) enveloppe `<Scene>` avec son span couleur. Un échec de `useGLTF` (BORD-modele-absent : la requête `.glb` est interrompue) ou de création du contexte remonte du Canvas vers l'arbre DOM parent : R3F 9 propage les erreurs de son arbre. La limite affiche alors le repli ;
  3. le repli est un élément visible avec une forme de la couleur courante, le texte « 3D indisponible » et `data-var="couleur"`. Il **remplace** le span couleur de la scène, si bien qu'il n'y a qu'un seul élément couleur.
- **Suspense** : `<Suspense fallback={null}>` autour du modèle, à l'intérieur du Canvas. Le span couleur est en dehors du Suspense, pour que `data-value` soit présent avant même la fin du chargement du modèle (US3-1 attend la couleur sous 10 s).

**Rationale** : ce sont les pratiques par défaut de R3F et de drei (`useGLTF`, `useFrame`, Suspense, mutation des refs dans la boucle d'images). L'animation est calculée à la main, sans librairie d'animation (FR-032) : on n'utilise pas `@react-spring/three`, et aucun utilitaire d'animation de drei.

**Alternatives considered** :
- `<primitive object={scene} />` et une mise à jour impérative de `material.color` dans un effet. C'est moins déclaratif ;
- se reposer uniquement sur l'error boundary pour l'absence de WebGL. Three.js écrirait alors une erreur dans la console avant le repli. La détection préalable est plus propre et ne coûte rien ;
- lire `vitesse` par sélecteur et dans la fermeture de `useFrame`. Cela marche aussi, mais la doc R3F déconseille de relier un état React changeant à la boucle d'images.

## R7. Page : style, transparence et configuration

**Decision** :
- `overlay.css` :
  - `html` et `body` : `margin: 0`, `background: transparent`, `overflow: hidden`, 1920×1080 ;
  - la racine des overlays est positionnée en absolu, sans fond ;
  - un titre long (80 caractères) reste dans le cadre : largeur maximale et retour à la ligne.

  Le dashboard a sa propre feuille, minimale. Il n'est pas contraint à la transparence.
- `vite.config.ts` reprend le contrat d'intégration : alias `@shared`, `server.fs.allow`, `build.manifest`, les 4 `rollupOptions.input` et `preview: { port: 4173, strictPort: true }`.
- `tsconfig.json` reprend celui du témoin, avec en plus `"jsx": "react-jsx"`. Le script `build` est `tsc --noEmit -p tsconfig.json && vite build`.

**Rationale** : les tests US2-7 et BORD-service-absent exigent un fond calculé `rgba(0, 0, 0, 0)` et aucun débordement. Le reste suit le contrat d'intégration commun.

## R8. Journal et campagnes E2E

**Decision** : `results/journal-react.md` est créé dès l'étape « plan ». Il note :
- les horodatages de début et de fin de chaque étape (plan, tasks, analyze, implement) ;
- chaque correction manuelle, avec sa catégorie et son auteur ;
- les écarts de configuration (R1).

Chaque lancement de la suite E2E se fait avec `FRAMEWORK=react`. Le reporter partagé enregistre la campagne et compte les passages avant le vert.

**Rationale** : constitution V et règles du spike.

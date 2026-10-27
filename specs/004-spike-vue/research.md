# Research : implémentation Vue du spike (004-spike-vue)

Phase 0 de `/speckit-plan`. Chaque décision suit le format : Décision, Justification, Alternatives écartées.
Sources : la spec gelée (copie dans `spec.md`), la constitution v1.0.0, les contrats de `specs/002-infra-commune/contracts/`, les tests `shared/e2e/*.spec.ts` (lus, jamais modifiés), la page témoin `apps/temoin` (base commune), et les déclarations de types des paquets npm, installés dans un dossier jetable hors dépôt.

## R1. Versions des dépendances

**Décision** : versions exactes (`npm view`, 2026-10-27) :

| Paquet | Version | Rôle |
| --- | --- | --- |
| `vue` | 3.5.44 (`latest`) | framework, sans Vapor Mode (la 3.6 n'existe qu'en alpha, beta et rc) |
| `pinia` | 4.1.0 | store imposé |
| `@tresjs/core` | 5.10.0 | 3D imposée (moteur de rendu Vue de three) |
| `@tresjs/cientos` | 5.10.0 | 3D imposée (chargement glTF via `useGLTF`) |
| `three` | 0.186.1 | dépendance pair de TresJS |
| `@types/three` | 0.186.0 | types de three |
| `vite` | 8.3.5 | identique au témoin |
| `@vitejs/plugin-vue` | 6.0.10 | compilation des SFC (compatible Vite 8) |
| `vue-tsc` | 3.3.13 | vérification des types des `.vue` |
| `typescript` | **6.0.3** | voir ci-dessous |

**Justification** : la constitution impose Vue 3.5 stable, Pinia, TresJS et Cientos, et l'absence de version 3.6 en RC. Les dépendances pair sont compatibles : Cientos 5.10 demande `vue >= 3.5.17` et `@tresjs/core ^5.9.1`, Pinia 4.1 demande `vue ^3.5.11`.

**Écart avec le témoin (TypeScript 6 au lieu de 7)** : `vue-tsc` 3.3.13 plante avec TypeScript 7.0.2 (`ERR_PACKAGE_PATH_NOT_EXPORTED : ./lib/tsc`), parce que TypeScript 7 (portage natif) n'expose plus l'API JavaScript dont Volar a besoin. Un essai dans un dossier jetable confirme que `vue-tsc` fonctionne avec TypeScript 6.0.3 et qu'il détecte bien une erreur de type volontaire. La constitution demande « TypeScript en mode strict » sans fixer de version : l'écart est donc permis, mais il est **noté comme point de friction** dans `results/journal-vue.md`. `shared/` reste exécuté par Node 26 sans build. Il est seulement vérifié par `vue-tsc` au travers des imports.

**Alternatives écartées** :
- TypeScript 7 sans `vue-tsc` (seulement `tsc` sur les `.ts`) : les `.vue` ne seraient pas vérifiés, alors que le contrat demande un mode strict sur tout le code.
- Une version 3.6 de Vue : interdit par la constitution.

## R2. Organisation de l'état : un store Pinia par page

**Décision** : chaque page crée sa propre app (`createApp`) et sa propre instance Pinia (`createPinia`). Un seul store, `useLiveStore` (setup store), contient :
- `vars` (définitions reçues dans le `welcome`) ;
- `values` (valeurs courantes, objet réactif) ;
- `connected` ;
- `alerteSeq` (numéro de la dernière alerte reçue).

Le module `src/live/connexion.ts` appelle `connect()` de `@shared/client.ts` **une seule fois par page**, branche ses rappels sur le store, et expose `set(id, value)` et `alerte()`. Le store est la seule source de vérité des composants.

**Justification** :
- Pinia est imposé, et le setup store est la forme recommandée par sa documentation pour Vue 3.
- Le contrat d'intégration exige un seul `connect()` par page.
- La sonde de latence de `client.ts` vérifie le DOM à chaque `requestAnimationFrame` après `onUpdate`. Vue applique les changements du DOM dans une micro-tâche (`nextTick`), avant la prochaine image : aucune synchronisation supplémentaire n'est nécessaire.

**Alternatives écartées** :
- `provide/inject` ou un `reactive()` global sans Pinia : contraire à la stack imposée.
- Une connexion ouverte dans chaque composant : contraire au contrat (une seule connexion par page).

## R3. Dashboard : champs générés et diffusion sans regroupement

**Décision** :
- `Dashboard.vue` fait un `v-for` sur `store.vars` (clé `def.id`), dans l'ordre reçu. Un composant `Champ.vue` affiche le libellé et un `<input>` natif dont le type dépend de `def.type` : `text`, `number`, `checkbox`, `color` ou `range`. Il applique `maxlength`, `min`, `max` et `step` depuis la définition (pour un nombre, `step=1`).
- Liaison unidirectionnelle (`:value` / `:checked`) et écouteurs natifs : `@input` pour le texte, le nombre, la couleur et le curseur, `@change` pour la case à cocher. Chaque événement appelle `set()` aussitôt, sans `debounce`, sans `throttle` et sans `v-model.lazy` (FR-012).
- Le nombre n'est envoyé que s'il est un entier dans les bornes. Une saisie vide ou hors bornes n'envoie rien, et le service rejetterait de toute façon la valeur.
- Un champ qui a le focus n'est pas réécrit par l'écho du service : un écho en retard écraserait la frappe en cours. Tout autre champ affiche la dernière valeur diffusée (US1-4, BORD-deux-dashboards).
- La racine porte `data-connection="on|off"` depuis `store.connected`. Le bouton porte `data-action="alerte"`. Aucun autre élément de la page ne porte `data-var` : le test US1-1 compte exactement 5 `[data-var]`.

**Justification** : FR-010 à FR-014 et FR-045 de la spec, et le contrat DOM d'intégration. Avec `v-model`, la valeur affichée serait liée directement au store, et l'écho du service réécrirait le champ en cours de saisie. La liaison unidirectionnelle garde la main sur ce cas.

**Alternatives écartées** :
- `v-model` sur une copie locale synchronisée par `watch` : plus de code pour le même résultat.
- Un champ codé en dur par variable : interdit par FR-010 (et US1-6 recharge une autre liste).

## R4. Overlays 2D : animation d'alerte native

**Décision** :
- Un composable `useAlerte(cibles)` réagit à `store.alerteSeq`. À chaque nouvelle alerte, il :
  1. passe `actif` à `true` : la racine affiche `data-alert="on"` ;
  2. annule l'animation en cours et lance `element.animate()` (Web Animations API) sur chaque cible. Les keyframes sont `scale(1)` et `brightness(1)`, puis `scale(1.15)` et `brightness(2.5)` à 30 %, puis le retour. L'animation dure `ALERT_DURATION_MS` avec `easing: "ease-out"` ;
  3. réarme un minuteur de `ALERT_DURATION_MS`, qui repasse `actif` à `false`.
- Une alerte pendant une alerte relance tout depuis le début (US2-5).
- Overlay A : `[data-var=titre]` et `[data-var=score]`, dont le texte et `data-value` sont liés au store.
- Overlay B : `[data-var=bandeau]` est toujours rendu, masqué avec `v-show` (`display:none`). Il garde son `data-value`, et seule la variable `bandeau` le met à jour (FR-021).
- `html` et `body` sont transparents, avec `overflow: hidden`, et la page fait 1920×1080.

**Justification** : FR-023 autorise « les moyens natifs du navigateur ou du framework ». L'API Web Animations relance une animation sans astuce de reflow, et elle garde le même rendu que l'animation CSS du témoin (×1,15, flash, 2 s, ease-out). `data-alert` dépend d'un minuteur et non de l'animation elle-même : les tests mesurent `off` entre 1 700 et 2 300 ms.

**Alternatives écartées** :
- `<Transition>` de Vue : il anime une entrée ou une sortie, pas une pulsation répétable.
- Classe CSS ajoutée et retirée, avec un reflow forcé : ça marche, mais c'est moins lisible en Vue que l'API native.
- Changer la `:key` de l'élément pour relancer l'animation : l'élément `data-var` serait détruit et recréé à chaque alerte.

## R5. Overlay 3D avec TresJS et Cientos

**Décision** :
- **Disponibilité de WebGL** : on la teste avant de monter la scène, sur un `<canvas>` jetable (`getContext("webgl2") ?? getContext("webgl")`). Sans WebGL, `TresCanvas` n'est pas monté, et le repli 2D s'affiche (US3-5 dans le projet `sans-3d`, lancé avec `--disable-3d-apis`).
- **Scène** : `<TresCanvas window-size alpha :clear-alpha="0">` contient une caméra perspective, une lumière ambiante, une lumière directionnelle et le modèle.
- **Modèle** : `useGLTF(modelUrl)` de Cientos, avec `modelUrl` importé via `@shared/assets/model.glb?url`. La couleur est appliquée aux matériaux des maillages du modèle quand `values.couleur` change (`watch`).
- **Échec du chargement du modèle** (BORD-modele-absent : la route `**/*.glb` est coupée) : si le chargement se termine sans modèle, ou si `useGLTF` rejette, ou si `TresCanvas` émet `error`, le repli s'affiche. **À vérifier au point de contrôle US3** : la façon exacte dont Cientos signale une erreur (`isLoading` qui repasse à `false` avec `state` nul, ou la promesse d'`execute` rejetée).
- **Animation** : `useLoop().onBeforeRender(({ delta }))` dans un composant enfant de `TresCanvas`.
  - Rotation continue : `rotation.y += vitesse × 2π × delta`. Une vitesse de 0 arrête la rotation.
  - Alerte : `t = (maintenant − début) / 2000`, borné à [0, 1], puis `e = 1 − (1 − t)³` (ease-out). Le saut vaut `0,5 × sin(π·e)` en Y et la rotation supplémentaire `4π·e` (2 tours) (FR-032). Une nouvelle alerte remet `début` à maintenant.
  - `data-alert` suit le même composable que les overlays 2D (R4), sans cible DOM à animer.
- **Contrat DOM** : dans le conteneur de la scène, deux `<span>` masqués portent `data-var="couleur"` et `data-var="vitesse"` avec leur `data-value`. En repli, un bloc visible portant `data-var="couleur"` (un disque de la couleur courante et le texte « 3D indisponible ») **remplace** le `span` couleur, et le `span` vitesse reste présent. Il y a exactement un élément par `data-var`.
- **Plugin Vite** : `vue({ template: { compilerOptions: templateCompilerOptions.template.compilerOptions } })`, avec `templateCompilerOptions` exporté par `@tresjs/core`. Les balises `Tres*` sont ainsi reconnues comme éléments personnalisés, sans avertissement « Failed to resolve component ». US3-1 refuse toute erreur de console.

**Justification** : FR-030 à FR-034, US3-1 à US3-6, BORD-modele-absent, constitution IV (repli 2D). L'animation se calcule dans la boucle de rendu de TresJS, sans librairie d'animation (FR-032). `cientos` est imposé et fournit le chargeur glTF.

**Alternatives écartées** :
- Le chargeur `GLTFLoader` de `three-stdlib` appelé directement : il contourne la librairie imposée sans nécessité.
- `<Suspense>` autour du modèle : il ne gère pas l'échec, et l'échec doit afficher le repli.

## R6. Projet Vite multi-page

**Décision** :
- `apps/vue/` contient `dashboard.html`, `overlay-a.html`, `overlay-b.html` et `overlay-3d.html` à la racine, chacun avec son point d'entrée `src/<page>/main.ts`.
- `vite.config.ts` reprend le contrat d'intégration : `@shared` vers `../../shared`, `server.fs.allow`, `build.manifest: true`, les 4 entrées dans `rollupOptions.input`, et `preview: { port: 4174, strictPort: true }`. On y ajoute le plugin Vue (R5).
- `tsconfig.json` : `strict`, `allowImportingTsExtensions`, `noEmit`, `moduleResolution: "bundler"`, `types: ["vite/client"]` et `paths` pour `@shared/*`. Il inclut `src/**/*.ts`, `src/**/*.vue` et `env.d.ts`.
- Scripts : `build` = `vue-tsc --noEmit -p tsconfig.json && vite build`, et `preview` = `vite preview`.

**Justification** : le contrat `integration-apps.md` et FR-044 (une entrée de build par page, pour mesurer le poids de chacune).

## R7. Validation au fil de l'eau (équité entre frameworks)

**Décision** : à la fin de chaque story (US1, US2, US3), un script Playwright jetable vérifie la page sur le build de production et prend une capture d'écran. Ce script n'appartient pas à la suite et il est écrit **hors du dépôt**, dans le dossier temporaire de session. La suite partagée `shared/e2e` n'est lancée qu'en **entier**, avec `FRAMEWORK=vue`, jamais avec `--grep` : chaque campagne compte dans le nombre de passages avant le vert. Avant chaque campagne, on vérifie qu'OBS est fermé (`Get-Process obs64`).

**Justification** : même méthode que pour les autres frameworks. Une campagne partielle réussie serait retenue comme « verte » par `grille.ts`. Les sources navigateur d'OBS se connectent au service de la suite et faussent US3-6.

## R8. Ce qui n'est pas lu

Le code de `apps/react` (et plus tard `apps/svelte`) n'est ni lu ni réutilisé (constitution, principe I). La seule référence d'implémentation est le témoin `apps/temoin`, qui fait partie de la base commune (`base-commune`).

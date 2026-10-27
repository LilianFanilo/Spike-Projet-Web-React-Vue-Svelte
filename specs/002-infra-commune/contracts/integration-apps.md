# Contrat : intégration d'une app (React, Vue, Svelte, témoin)

Toute app branchée sur l'outillage DOIT respecter ce contrat. Les tests d'acceptation et les scripts de mesure en dépendent.

## Structure et build

- Le dossier est `apps/<fw>/`. C'est un projet npm indépendant, avec son lockfile.
- Il a 4 entrées HTML à la racine de l'app : `dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html`.
- La configuration Vite comprend :
  - `resolve.alias['@shared']` qui pointe vers `../../shared` ;
  - `server.fs.allow` qui inclut `../../shared` ;
  - `build.manifest: true` ;
  - `build.rollupOptions.input` avec les 4 entrées ;
  - `preview: { port: <port>, strictPort: true }`.
- Le `tsconfig` comprend `strict: true`, `allowImportingTsExtensions: true` (pour les imports `.ts` de `shared/`) et `types: ["vite/client"]` (pour les imports `?url`, dont celui du modèle).
- Les ports de preview sont : témoin 4170, React 4173, Vue 4174, Svelte 4175.
- Le modèle 3D s'importe avec `import modelUrl from '@shared/assets/model.glb?url'`.

## Branchement

- Chaque page appelle `connect()` de `@shared/client.ts` une seule fois :
  - pour le dashboard, `role: "dashboard"` ;
  - pour les overlays, `role: "overlay"` et `name: "overlay-a"`, `"overlay-b"` ou `"overlay-3d"`.
- Aucune autre connexion WebSocket n'est ouverte. Les pages ne modifient pas `shared/`.
- L'appel de la sonde de latence à chaque message (FR-043 de la spec gelée, constitution IV) est assuré par `connect({ name })`. L'overlay n'a rien d'autre à appeler.

## Contrat DOM (rappel de la spec gelée, FR-040 à FR-045)

| Page | Exigence |
| --- | --- |
| Dashboard | Un contrôle natif par variable, portant `data-var="<id>"`. Le contrôle dépend du type : `text` → `input[type=text]` avec `maxlength` ; `number` → `input[type=number]` avec `min`, `max` et `step=1` ; `boolean` → `input[type=checkbox]` ; `color` → `input[type=color]` ; `speed` → `input[type=range]` avec `min`, `max` et `step`. Le libellé de chaque variable est affiché. Le bouton porte `data-action="alerte"`. La racine porte `data-connection="on"` ou `"off"`. |
| Overlay A | `[data-var="titre"]` et `[data-var="score"]` : texte visible égal à la valeur, `data-value` sérialisée |
| Overlay B | `[data-var="bandeau"]` : toujours présent, avec `data-value`. Visible avec le texte « EN DIRECT » si la valeur est `true`, masqué sinon (`display:none` ou `visibility:hidden`). |
| Overlay 3D | Deux éléments distincts, éventuellement masqués, à l'intérieur du conteneur de la scène : l'un porte `data-var="couleur"`, l'autre `data-var="vitesse"`. Un `<canvas>` WebGL. En repli, un élément visible contenant « 3D indisponible » porte `data-var="couleur"` et **remplace** l'élément couleur de la scène. L'élément `data-var="vitesse"` reste présent. |
| Tous les overlays | La racine porte `data-alert="on"` pendant l'animation et `data-alert="off"` sinon. `html` et `body` ont un fond transparent et pas de barre de défilement en 1920×1080. |

**Unicité** : une page contient **exactement un** élément pour chaque `data-var` qu'elle affiche. Ni les tests ni la sonde n'ont donc à choisir entre plusieurs éléments.

« La racine » désigne l'élément de plus haut niveau de l'app qui porte l'attribut. Les tests cherchent le premier élément `[data-alert]` (ou `[data-connection]`) de la page.

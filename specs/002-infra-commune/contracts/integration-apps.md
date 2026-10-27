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
- Le `tsconfig` comprend `strict: true` et `allowImportingTsExtensions: true` (pour les imports `.ts` de `shared/`).
- Les ports de preview sont : témoin 4170, React 4173, Vue 4174, Svelte 4175.
- Le modèle 3D s'importe avec `import modelUrl from '@shared/assets/model.glb?url'`.

## Branchement

- Chaque page appelle `connect()` de `@shared/client.ts` une seule fois :
  - pour le dashboard, `role: "dashboard"` ;
  - pour les overlays, `role: "overlay"` et `name: "overlay-a"`, `"overlay-b"` ou `"overlay-3d"`.
- Aucune autre connexion WebSocket n'est ouverte. Les pages ne modifient pas `shared/`.

## Contrat DOM (rappel de la spec gelée, FR-040 à FR-045)

| Page | Exigence |
| --- | --- |
| Dashboard | Un contrôle natif par variable, portant `data-var="<id>"`. Le contrôle dépend du type : `text` → `input[type=text]` avec `maxlength` ; `number` → `input[type=number]` avec `min`, `max` et `step=1` ; `boolean` → `input[type=checkbox]` ; `color` → `input[type=color]` ; `speed` → `input[type=range]` avec `min`, `max` et `step`. Le libellé de chaque variable est affiché. Le bouton porte `data-action="alerte"`. La racine porte `data-connection="on"` ou `"off"`. |
| Overlay A | `[data-var="titre"]` et `[data-var="score"]` : texte visible égal à la valeur, `data-value` sérialisée |
| Overlay B | `[data-var="bandeau"]` : toujours présent, avec `data-value`. Visible avec le texte « EN DIRECT » si la valeur est `true`, masqué sinon (`display:none` ou `visibility:hidden`). |
| Overlay 3D | `[data-var="couleur"]` et `[data-var="vitesse"]` sur le conteneur de la scène. Un `<canvas>` WebGL. En repli : un élément visible contenant « 3D indisponible », qui porte aussi `data-var="couleur"`. |
| Tous les overlays | La racine porte `data-alert="on"` pendant l'animation et `data-alert="off"` sinon. `html` et `body` ont un fond transparent et pas de barre de défilement en 1920×1080. |

« La racine » désigne l'élément de plus haut niveau de l'app qui porte l'attribut. Les tests cherchent le premier élément `[data-alert]` (ou `[data-connection]`) de la page.

# Contrat : app Svelte (`apps/svelte`)

Ce contrat applique à Svelte le contrat commun [integration-apps.md](../../002-infra-commune/contracts/integration-apps.md) et le protocole [protocole.md](../../002-infra-commune/contracts/protocole.md). En cas de conflit, ces deux contrats et la spec gelée priment.

## Pages exposées (build de production, `vite preview` sur 4175)

| URL | Composant racine | `connect()` | Racine porte |
| --- | --- | --- | --- |
| `/dashboard.html` | `Dashboard.svelte` | `role: "dashboard"` | `data-connection="on\|off"` |
| `/overlay-a.html` | `OverlayA.svelte` | `role: "overlay"`, `name: "overlay-a"` | `data-alert="on\|off"` |
| `/overlay-b.html` | `OverlayB.svelte` | `role: "overlay"`, `name: "overlay-b"` | `data-alert="on\|off"` |
| `/overlay-3d.html` | `Overlay3D.svelte` | `role: "overlay"`, `name: "overlay-3d"` | `data-alert="on\|off"` |

`?debug=1` sur l'overlay 3D : compteur FPS de `@shared/fps.ts`, démarré par `connect`. L'app n'ajoute rien.

## DOM observable

| Page | Éléments |
| --- | --- |
| Dashboard | Un `<label>` par variable (texte = `label`) contenant un `input` natif `data-var="<id>"` (type selon research R5), dans l'ordre de `vars`. Un `<button data-action="alerte">Alerte</button>`. Aucun autre élément `data-var`. |
| Overlay A | `[data-var="titre"]` (texte = titre) et `[data-var="score"]` (texte = score), chacun avec `data-value`. |
| Overlay B | `[data-var="bandeau"]`, toujours présent, `data-value`, texte « EN DIRECT », `display:none` quand faux. |
| Overlay 3D | Conteneur `.scene` 1920×1080 contenant : `<canvas>` (Threlte) + `<span hidden data-var="couleur">`, ou, en repli, un bloc visible « 3D indisponible » `data-var="couleur"` avec un disque de la couleur courante ; et dans les deux cas `<span hidden data-var="vitesse">`. |
| Overlays | `html` et `body` transparents, `margin:0`, `overflow:hidden`. |

## Modules internes

| Module | Exporte | Utilisé par |
| --- | --- | --- |
| `src/lib/live.svelte.ts` | `class Live` (voir data-model) | les 4 composants racines |
| `src/lib/alerte.ts` | `rejouer(numero)` : fabrique d'attachment qui relance l'animation d'alerte WAAPI quand `numero > 0` change | Overlay A, Overlay B |
| `src/lib/webgl.ts` | `webglDisponible(): boolean` | Overlay 3D |

## Ce que l'app ne fait pas

- Elle n'ouvre aucune autre connexion WebSocket et ne modifie pas `shared/`.
- Elle n'appelle pas la sonde de latence ni le compteur FPS directement.
- Elle n'embarque pas la liste des variables au build (le dashboard lit `welcome`).

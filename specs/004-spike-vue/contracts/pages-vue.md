# Contrat : pages de l'app Vue (`apps/vue`, port 4174)

Ce contrat applique à Vue le contrat commun [integration-apps.md](../../002-infra-commune/contracts/integration-apps.md). En cas de doute, le contrat commun et la spec gelée priment.

## Entrées et composants

| Entrée HTML | Point d'entrée | Composant racine | Connexion (`connect`) |
| --- | --- | --- | --- |
| `dashboard.html` | `src/dashboard/main.ts` | `Dashboard.vue` | `role: "dashboard"` |
| `overlay-a.html` | `src/overlays/overlay-a.ts` | `OverlayA.vue` | `role: "overlay", name: "overlay-a"` |
| `overlay-b.html` | `src/overlays/overlay-b.ts` | `OverlayB.vue` | `role: "overlay", name: "overlay-b"` |
| `overlay-3d.html` | `src/overlay-3d/main.ts` | `Overlay3D.vue` | `role: "overlay", name: "overlay-3d"` |

Chaque point d'entrée fait `createApp(Racine).use(createPinia())`, appelle une seule fois la connexion qui alimente `useLiveStore`, puis monte l'app sur `#app`.

## DOM attendu

### Dashboard
```html
<main class="dashboard" data-connection="on|off">
  <h1>…</h1>
  <p class="etat">Connecté | Déconnecté</p>
  <form>
    <!-- un par définition reçue, dans l'ordre du welcome -->
    <label><span>Titre</span><input type="text" data-var="titre" maxlength="80"></label>
    <label><span>Score</span><input type="number" data-var="score" min="-999999" max="999999" step="1"></label>
    <label><span>Bandeau visible</span><input type="checkbox" data-var="bandeau"></label>
    <label><span>Couleur du modèle</span><input type="color" data-var="couleur"></label>
    <label><span>Vitesse de rotation</span><input type="range" data-var="vitesse" min="0" max="2" step="0.05"></label>
  </form>
  <button type="button" data-action="alerte">Alerte</button>
</main>
```
Seuls les 5 contrôles portent `data-var`. Les attributs de bornes viennent des définitions, jamais de constantes.

### Overlay A
```html
<div class="overlay" data-alert="on|off">
  <div class="carte">
    <h1 data-var="titre" data-value="…">…</h1>
    <p data-var="score" data-value="…">…</p>
  </div>
</div>
```

### Overlay B
```html
<div class="overlay" data-alert="on|off">
  <div class="bandeau" data-var="bandeau" data-value="true|false" style="display:none si false">EN DIRECT</div>
</div>
```

### Overlay 3D
```html
<!-- mode scène -->
<div class="overlay" data-alert="on|off">
  <div class="scene">
    <canvas>…</canvas>                          <!-- rendu par TresCanvas -->
    <span class="cache" data-var="couleur" data-value="#rrggbb"></span>
    <span class="cache" data-var="vitesse" data-value="…"></span>
  </div>
</div>

<!-- mode repli (WebGL absent ou modèle non chargé) -->
<div class="overlay" data-alert="on|off">
  <div class="repli" data-var="couleur" data-value="#rrggbb">
    <div class="disque" style="background:#rrggbb"></div>
    <span>3D indisponible</span>
  </div>
  <span class="cache" data-var="vitesse" data-value="…"></span>
</div>
```
Avec `?debug=1`, `shared/fps.ts` ajoute lui-même `<div data-fps>` : l'app n'a rien à faire.

## Styles communs aux overlays
`html` et `body` : `margin: 0`, `background: transparent`, `overflow: hidden`. Rien ne dépasse de 1920×1080.

## Commandes
| Commande (dans `apps/vue`) | Effet |
| --- | --- |
| `npm run build` | `vue-tsc --noEmit` puis `vite build` (avec le manifest) |
| `npm run preview` | `vite preview`, port 4174, `strictPort` |

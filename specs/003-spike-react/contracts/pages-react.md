# Contrat : pages React → contrat DOM d'intégration

La référence est [002-infra-commune/contracts/integration-apps.md](../../002-infra-commune/contracts/integration-apps.md), gelée. Ce document indique **quel composant React** porte chaque exigence, pour que `/speckit-tasks` et `/speckit-analyze` puissent vérifier la couverture. En cas de divergence, c'est le contrat commun qui fait foi.

## Build

| Exigence | Où |
| --- | --- |
| 4 entrées `dashboard.html`, `overlay-a.html`, `overlay-b.html`, `overlay-3d.html` à la racine de `apps/react` | Fichiers HTML et `build.rollupOptions.input` dans `vite.config.ts` |
| `@shared` → `../../shared`, `server.fs.allow`, `build.manifest: true` | `vite.config.ts` |
| `preview: { port: 4173, strictPort: true }` | `vite.config.ts` |
| React Compiler actif | `vite.config.ts` : `react()` + `babel({ presets: [reactCompilerPreset()] })` |
| `strict`, `allowImportingTsExtensions`, `types: ["vite/client"]`, `jsx: "react-jsx"` | `tsconfig.json` |

## Branchement

| Page | Appel unique (dans `main`, avant `createRoot`) |
| --- | --- |
| Dashboard | `demarrer("dashboard")` → `connect({ role: "dashboard", … })` |
| Overlay A, B, 3D | `demarrer("overlay", "overlay-a" \| "overlay-b" \| "overlay-3d")` → `connect({ role: "overlay", name, … })` |

La sonde de latence et le compteur FPS (`?debug=1`) sont fournis par `connect({ name })`. Aucun composant ne les appelle.

## DOM par page

### Dashboard (`Dashboard.tsx`, `Champ.tsx`)

| Élément | Attributs |
| --- | --- |
| Racine `<main>` | `data-connection="on"` ou `"off"` (depuis `connected`) |
| Pour chaque `def` de `vars`, dans l'ordre : `<label>` contenant `<span>{def.label}</span>` et le contrôle | Le contrôle porte `data-var={def.id}`, avec le type d'input et les bornes de la table R4 de [research.md](../research.md) et une valeur contrôlée |
| `<button>Alerte</button>` | `data-action="alerte"` |

Aucun autre élément ne porte `data-var`.

### Overlay A (`overlay-a.tsx`)

| Élément | Attributs |
| --- | --- |
| Racine | `data-alert="on"` ou `"off"` |
| Titre (dans `<Alerte>`) | `data-var="titre"`, `data-value={serialize}`, texte égal à la valeur (vide si le titre est vide) |
| Score (dans `<Alerte>`) | `data-var="score"`, `data-value={serialize}`, le texte contient la valeur |

### Overlay B (`overlay-b.tsx`)

| Élément | Attributs |
| --- | --- |
| Racine | `data-alert` |
| Bandeau (dans `<Alerte>`) | `data-var="bandeau"` et `data-value="true"` ou `"false"`. Toujours rendu : le texte « EN DIRECT » est visible si la valeur est `true`, sinon l'élément est en `display: none` (attribut `hidden`). |

### Overlay 3D (`Overlay3D.tsx`, `Scene.tsx`, `Repli.tsx`)

| Cas | Arbre |
| --- | --- |
| WebGL disponible et modèle chargé | Racine `data-alert` › conteneur de scène › `<span hidden data-var="vitesse">` + [limite d'erreur › `<span hidden data-var="couleur">` + `<Canvas>`] |
| WebGL absent, ou erreur dans la limite (modèle introuvable, contexte impossible) | Racine `data-alert` › conteneur de scène › `<span hidden data-var="vitesse">` + `<div data-var="couleur">` visible, avec une forme de la couleur courante et le texte « 3D indisponible » |

Dans les deux cas, il y a exactement un élément `data-var="couleur"` et un élément `data-var="vitesse"`, chacun avec `data-value` sérialisé.

### Tous les overlays

- `html` et `body` : fond transparent, `overflow: hidden`, 1920×1080 (`overlay.css`).
- `data-alert` vient de `alerte.active`. Il passe à `on` à la réception de l'alerte, et à `off` 2000 ms après la dernière alerte reçue.

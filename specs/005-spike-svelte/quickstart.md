# Quickstart — valider l'implémentation Svelte

## Prérequis

- Node 26 et npm (`node --version`).
- Dépendances de `shared/` installées (`cd shared; npm ci`), navigateurs Playwright présents.
- **OBS fermé** pendant toute campagne E2E (`Get-Process obs64` ne doit rien renvoyer) : ses sources navigateur se connecteraient au service de la suite.
- Aucun onglet d'overlay ouvert dans un navigateur.

## Construire et servir (PowerShell, depuis la racine du dépôt)

```powershell
cd apps/svelte
npm ci
npm run build          # svelte-check puis vite build ; doit finir sans erreur ni avertissement
npm run preview        # http://localhost:4175, strictPort
```

## Vérification manuelle rapide

Dans un second terminal : `cd shared; npm run serveur` (port 8787).

1. `http://localhost:4175/dashboard.html` : 5 champs, « ● Connecté » ; modifier chaque champ.
2. `overlay-a.html` et `overlay-b.html` : le titre, le score et le bandeau suivent le dashboard ; « Alerte » fait grossir et briller les éléments pendant 2 s.
3. `overlay-3d.html` : Suzanne tourne, change de couleur et de vitesse, saute et fait 2 tours à l'alerte ; `?debug=1` affiche le compteur FPS.
4. Arrêter puis relancer le service : le dashboard passe « Déconnecté » puis « Connecté », les overlays retrouvent l'état.

## Points de contrôle par story (hors suite)

À la fin de chaque story, un script Playwright jetable placé dans le dossier scratchpad de la session (jamais dans le dépôt) ouvre les pages du build de production, pilote le service et enregistre des captures d'écran. On ne lance **jamais** la suite partagée avec `--grep`.

## Contrat d'acceptation (suite complète)

```powershell
cd shared
$env:APP_URL = "http://localhost:4175"; $env:FRAMEWORK = "svelte"; npm run e2e
```

Résultat attendu : tous les tests verts sur les deux projets Playwright (`standard` et `sans-3d`). Chaque campagne est enregistrée et notée dans `results/journal-svelte.md` (horodatage, réussis, échoués).

## Mesures (après le vert, avec OBS)

Suivre `results/protocole-obs.md` avec les scènes `Svelte 2D/3D/FPS` réglées sur le port 4175 (voir [commandes.md](../002-infra-commune/contracts/commandes.md)) :
`npm run poids -- --framework svelte`, `npm run lignes -- --framework svelte`, puis latence, alertes, FPS et `bench/cpu.ps1`.

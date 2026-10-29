# Journal — implémentation React (003-spike-react)

Constitution, principe V. Agent : Claude Code, modèle Claude Opus 5.5 (`claude-opus-5-5`). Pas de MCP framework.

## Étapes

| Étape | Début | Fin | Remarques |
| --- | --- | --- | --- |
| Branche et copie de la spec | 2026-10-27 21:49 | 2026-10-27 21:49 | `003-spike-react` depuis `base-commune` (b07f4de). La spec est copiée depuis `specs/001-spec-spike/spec.md`. |
| Plan (`/speckit-plan`) | 2026-10-27 21:50 | 2026-10-27 21:56 | Stack : React ~19.2.9 (la 19.3.1 est publiée mais écartée par la constitution), Zustand 5, R3F 9 + drei 10, React Compiler par la voie Babel (`reactCompilerPreset` + `@rolldown/plugin-babel`). |
| Tâches (`/speckit-tasks`) | 2026-10-27 21:57 | 2026-10-27 22:00 | 29 tâches. La suite E2E ne tourne que complète, en phase 6 : une campagne partielle réussie serait comptée comme « vert » par `grille.ts`. Les points de contrôle par story sont manuels. Retouches du plan : `normalize` avant `validate` (R4), `saisir` déplacée dans `connexion.ts`, fichiers CSS ajoutés à l'arborescence. |
| Analyse (`/speckit-analyze`) | 2026-10-27 22:01 | 2026-10-27 22:06 | 0 critique, 3 moyens, 6 faibles. Corrigés avant l'implémentation, dans les artefacts : C1 (horodatage de cette étape), I1 (type de `serialize` écrit en dur dans les overlays), U1 (contrôle `three` par `WebGLRenderer`), U3 (restriction de `VarValue` pour la couleur), I2 (caméra `[0, 0, 4]`). B1 (ease-out par segment en CSS) et U2 (champs figés hors connexion) sont documentés dans research.md, sans changer la spec. |
| Implémentation (`/speckit-implement`) | 2026-10-27 22:06 | 2026-10-27 22:20 | Code de T001 à T023 écrit d'un trait. Premier `npm run build` vert, sans erreur TypeScript (22:10). L'avertissement Vite « chunk > 500 kB » sur l'overlay 3D est laissé tel quel (constitution VI). |
| Points de contrôle T012, T017, T024 | 2026-10-27 22:10 | 2026-10-27 22:12 | Faits par l'agent, groupés après le code, car le build exige les 4 entrées. Contrôle de fumée avec un script Playwright jetable (hors dépôt, hors suite partagée, aucune campagne enregistrée) et des captures d'écran : attributs `data-*` conformes, alerte `on` puis `off`, bandeau masqué, fond transparent, repli si `.glb` bloqué, FPS avec `?debug=1`, aucune erreur console dans les cas nominaux. **À reproduire à l'identique pour Vue et Svelte.** |
| Contrôles de build T025, T026 | 2026-10-27 22:12 | 2026-10-27 22:12 | Manifeste avec 4 entrées. `WebGLRenderer` présent seulement dans le graphe de l'overlay 3D. React Compiler actif sur tous les composants (cache `(0,x.c)(N)`). Le motif de recherche prévu dans T025 et le quickstart (`compiler-runtime\|_c\(`) ne fonctionne pas sur du code minifié ; il est corrigé dans les documents, le code n'est pas touché. `shared/` est inchangé depuis `base-commune` ; aucun `apps/vue` ni `apps/svelte`. |

## Corrections manuelles

Catégories : bug, syntaxe obsolète, écart à la spec, configuration. Auteurs : IA seule, humain.

| # | Date | Fichier | Catégorie | Auteur | Description |
| --- | --- | --- | --- | --- | --- |
| 1 | 2026-10-27 22:16 | `apps/react/src/dashboard/Champ.tsx` | bug | IA seule | Curseur `speed` : la saisie passe par un écouteur natif `input` (ref callback React 19 avec nettoyage), et `onChange` devient vide. Cause (US1-2) : quand un script modifie `el.value` puis émet `input`, le suivi de valeur de React croit le champ inchangé et n'appelle pas `onChange`. Aucun `set` n'est envoyé. `fill` de Playwright n'est pas concerné, car il agit dans un contexte isolé. C'est un piège propre à React (contrôle natif + événement synthétique). Vérifié par script jetable : modification par script, clic souris et flèche clavier envoient chacun un seul `set`, sans erreur console. |

## Campagnes E2E (`FRAMEWORK=react`)

| # | Date | Résultat | Échecs | Remarques |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-27 22:13 | 32/34 | US1-2 (dashboard), US3-6 (overlay 3D) | US1-2 : bug React, correction n° 1. US3-6 : OBS ouvert pendant la campagne (source FPS connectée au service de test), voir « Écarts et amendements ». |
| 2 | 2026-10-27 22:20 | 34/34 | — | Après la correction n° 1, avec OBS fermé (fermé par l'agent à la demande de Lilian). Service frais vérifié sans client externe avant la campagne. |

Passages avant le vert : **2**

## Écarts et amendements

- **2026-10-27 22:19 — US3-6 : échec dû à l'environnement, pas au test ni à React.** OBS était ouvert pendant la campagne n° 1. Une de ses sources navigateur (`overlay-3d?debug=1`, processus `obs-browser-page`) se connecte à **tout** service lancé sur le port 8787, y compris celui de la suite, et envoie des `fps` à 30 i/s, la cadence d'OBS. L'assertion `expect((await serveur.stats()).fps).toEqual([])` échoue donc. Diagnostic :
  - le « client fantôme » apparaît aussi sur le témoin ;
  - il persiste même si la page de test est d'abord envoyée sur `about:blank` ;
  - un service lancé seul, sans aucun navigateur de test, reçoit immédiatement un client `overlay/overlay-3d`, dont la connexion TCP appartient à `obs-browser-page`.

  Une première hypothèse (« test défectueux, `page.close()` laisse la page vivre ») a été écartée par ce diagnostic : **aucun amendement n'est nécessaire**. Les essais sur le témoin ont été lancés sans `FRAMEWORK`, donc rien n'a été enregistré. **Règle pour les 3 frameworks : fermer OBS (ou au moins ses sources pointées sur un port d'app) pendant toute campagne E2E.** La campagne n° 1 compte quand même : elle est enregistrée, et l'échec US1-2 était réel.
- Environnement : sous Windows, `vite build` échoue (`EPERM` sur `dist/assets`) tant que `vite preview` tourne. Il faut arrêter le preview avant de reconstruire. Ce n'est pas une correction de code.

## Ressenti (/5)

| Domaine | Note | Commentaire |
| --- | --- | --- |
| Dashboard | | |
| Overlays 2D | | |
| 3D | | |

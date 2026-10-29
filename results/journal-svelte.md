# Journal — implémentation Svelte (005-spike-svelte)

Branche `005-spike-svelte`, créée depuis le tag `base-commune`. Spec copiée à l'identique depuis `specs/001-spec-spike/spec.md` (identique à `spec-gelee`, amendement FR-045 inclus). Port de preview : 4175. Agent : Claude Code, modèle Claude Opus 5.5 (`claude-opus-5-5`). MCP Svelte actif (voir Écarts).

## Étapes

| Étape | Début | Fin | Remarques |
| --- | --- | --- | --- |
| Préparation (branche, spec, journal, MCP Svelte) | 2026-10-27 23:03 | 2026-10-27 23:10 | MCP Svelte actif après correction de portée (voir Écarts) |
| `/speckit-plan` | 2026-10-27 23:10 | 2026-10-27 23:16 | plan, research, data-model, contrat, quickstart ; MCP consulté (doc Svelte) |
| `/speckit-tasks` | 2026-10-27 23:17 | 2026-10-27 23:19 | 30 tâches (setup 6, fondation 4, US1 5, US2 5, US3 6, finition 4) |
| `/speckit-analyze` | 2026-10-27 23:20 | 2026-10-27 23:22 | 0 critique ; 7 points moyens ou faibles, 6 corrigés dans tasks, data-model, research et journal (validé par Lilian) |
| `/speckit-implement` | 2026-10-27 23:22 | 2026-10-27 23:31 | **9 min**, 30/30 tâches, E2E 34/34 au 1er passage, 0 correction manuelle. Durée totale de la phase (préparation à E2E vert) : 28 min. |
| ↳ Setup + fondation (T001–T010) | 2026-10-27 23:22 | 2026-10-27 23:24 | Versions installées : svelte 5.57.3, @threlte/core 8.6.1, three 0.186.1, vite 8.3.5, typescript 6.0.3, svelte-check 4.7.7. svelte-check : 0 erreur. Keyframes d'alerte définies une seule fois, dans `src/lib/alerte.ts` (Web Animations), pas en double dans `app.css`. |
| ↳ US1 dashboard (T011–T015) | 2026-10-27 23:24 | 2026-10-27 23:26 | autofixer : 0 remarque. Entrées des overlays provisoires (vides) pour que `vite build` passe. Point de contrôle jetable : 7/7. |
| ↳ US2 overlays 2D (T016–T020) | 2026-10-27 23:26 | 2026-10-27 23:28 | autofixer : 0 remarque. Point de contrôle jetable : 7/7 au 2e lancement, après correction du script de contrôle lui-même (une capture placée avant la mesure faussait `on`) ; l'app n'a pas été modifiée. Durée de l'alerte ≈ 2,02 s. |
| ↳ US3 overlay 3D (T021–T026) | 2026-10-27 23:28 | 2026-10-27 23:30 | autofixer : 0 remarque, svelte-check : 0 erreur. Vite avertit qu'un bloc dépasse 500 Ko (`overlay-3d`, 806 Ko, 208 Ko gzip, surtout three.js) ; laissé tel quel (constitution VI). Point de contrôle jetable : 5/5 au 1er lancement (SwiftShader, `--disable-3d-apis`, `.glb` bloqué, `?debug=1`). |
| ↳ Contrôles de conformité (T027–T028) | 2026-10-27 23:30 | 2026-10-27 23:30 | Aucune syntaxe héritée ni `svelte/store` ; une seule connexion `connect()` (dans `Live`) ; `shared/` intact ; manifeste avec les 4 entrées. |

## Corrections manuelles

| # | Étape | Catégorie | Auteur | Description |
| --- | --- | --- | --- | --- |

Aucune. Le code produit par l'IA a passé svelte-check, `svelte-autofixer`, les points de contrôle et la suite E2E sans retouche. La seule reprise concerne un script de contrôle jetable (hors app, hors dépôt), voir l'étape US2.

## Campagnes E2E (`FRAMEWORK=svelte`)

| # | Horodatage | Réussis | Échoués | Remarques |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-27 23:31 (`2026-10-27T22:31:38.010Z-e2e-svelte`) | 34 | 0 | Vert au 1er passage. OBS fermé, 8787 libre, build de production servi sur 4175. Durée 33,1 s. |

## Écarts et amendements

- **Biais assumé (constitution, principe I)** : le MCP officiel Svelte (`https://mcp.svelte.dev/mcp`) est branché pendant toute la phase Svelte, et seulement pour elle. React et Vue n'ont eu aucun MCP équivalent. Il a été ajouté en portée utilisateur (`claude mcp add --scope user`), car l'extension VS Code ouvre le projet sous `c:/…` alors que la portée locale l'enregistrait sous `C:/…`. Retiré à la fin de la phase, le 2026-10-27 après le vert E2E (portées utilisateur et locale).

## Points de friction

- **Outillage (plan)** : `svelte-check` 4.7 n'accepte que TypeScript 5 ou 6, alors que le témoin utilise TypeScript 7. L'app Svelte utilise TypeScript ~6.0, la version du gabarit officiel `create-vite svelte-ts` (research R1).

- **Build (US1)** : `vite build` échoue si une entrée HTML pointe vers un script absent. Il a fallu créer des entrées d'overlay vides avant d'implémenter US2 et US3.
- **Build (US3)** : avertissement standard de Vite sur la taille du bloc 3D (three.js), sans conséquence fonctionnelle.

## Ressenti (/5)

À remplir par Lilian (dashboard, overlays, 3D).

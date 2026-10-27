# Constitution du spike React vs Vue vs Svelte

## Core Principles

### I. Équité de la comparaison

- Il n'existe qu'**une seule spécification fonctionnelle**, gelée par le tag git `spec-gelee`.
  Elle est copiée à l'identique dans le dossier de feature de chaque framework.
- Toute modification de la spec après le gel DOIT être appliquée aux trois copies et tracée
  dans les trois journaux.
- Chaque framework est implémenté sur **sa propre branche git**, créée à partir du tag
  `base-commune`. Une implémentation NE DOIT JAMAIS lire ni réutiliser le code d'un autre framework.
- Les trois implémentations DOIVENT être faites avec le même modèle et le même agent IA.
  Le MCP officiel Svelte n'est autorisé que pour Svelte. Ce biais est assumé et DOIT être noté
  dans `journal-svelte.md`.

Justification : le spike compare des frameworks, pas des spécifications ni des conditions de
travail. Toute différence non tracée fausse la grille de résultats.

### II. Outillage commun en lecture seule

- `shared/` contient tout ce qui ne dépend pas du framework :
  - le protocole WebSocket et `variables.json` ;
  - le serveur relais (port 8787) ;
  - la sonde de latence `probe.ts` ;
  - les tests E2E Playwright ;
  - les scripts de mesure.

  Ce dossier est écrit une seule fois, avant les implémentations, et aucune implémentation
  NE DOIT le modifier.
- Les tests E2E partagés sont le **contrat d'acceptation**. Ils NE DOIVENT PAS être modifiés pour
  faire passer un framework. Un test défectueux se corrige par un amendement, appliqué aux trois.
- Le code de `shared/` n'utilise que du TypeScript « effaçable » : pas d'`enum`, pas de
  `namespace`, imports avec l'extension `.ts`. Node 26 l'exécute ainsi directement, sans build.

Justification : le transport et la mesure sont identiques pour tous, et l'écart mesuré ne vient
que du framework.

### III. Stack minimale

- TypeScript en mode strict, Vite et npm. Aucun méta-framework (ni Next, ni Nuxt, ni SvelteKit).
- `apps/react`, `apps/vue` et `apps/svelte` sont des projets npm indépendants, chacun avec son
  lockfile, sans npm workspaces. Ils importent `shared/` via l'alias Vite `@shared`, déclaré
  dans `server.fs.allow`.
- Aucune librairie UI ni d'animation. Seuls la librairie 3D et le store imposés (voir
  « Contraintes techniques ») sont autorisés, en plus du framework et de Vite.

Justification : on compare des runtimes nus, et des dépendances séparées évitent qu'une version
de `three` soit imposée aux trois.

### IV. Contrat DOM et instrumentation

- Dans un overlay, chaque variable affichée DOIT porter `data-var="<id>"` et
  `data-value="<valeur sérialisée>"`. L'overlay DOIT appeler la sonde partagée à chaque message
  reçu.
- Les overlays font 1920×1080, avec un fond transparent. Chacun est une entrée Vite distincte :
  `dashboard`, `overlay-a`, `overlay-b`, `overlay-3d`.
- Le compteur FPS ne s'affiche qu'avec `?debug=1` et envoie ses valeurs au serveur.
- L'overlay 3D DOIT afficher un repli 2D si WebGL est indisponible.

Justification : ce contrat sert à la fois aux tests E2E et à la mesure de latence, de la même
façon quel que soit le framework.

### V. Mesures reproductibles

- Toutes les mesures se font sur le **build de production** : `vite build`, puis
  `vite preview --strictPort` sur les ports 4173 (React), 4174 (Vue) et 4175 (Svelte).
- Le barème `results/bareme.md` est figé et NE DOIT PAS changer après la première mesure.
- Chaque implémentation tient un journal `results/journal-<fw>.md`, qui note :
  - l'horodatage de début et de fin de chaque étape ;
  - chaque correction manuelle, avec sa catégorie (bug, syntaxe obsolète, écart à la spec,
    configuration) et son auteur (IA seule ou humain) ;
  - le nombre de passages E2E avant le vert.

Justification : sans journal ni barème figé, les notes pourraient être ajustées après coup.

### VI. Simplicité de spike

- Le code est jetable, mais il doit rester lisible.
- Aucun test unitaire n'est exigé : les tests E2E partagés suffisent.
- Aucune optimisation propre à un framework au-delà de ses pratiques recommandées par défaut.

Justification : le spike mesure ce qu'une équipe obtient en suivant les usages standard,
pas le résultat d'un tuning expert.

## Contraintes techniques par framework

| Framework | Version | Réactivité / store | 3D | Règles spécifiques |
| --- | --- | --- | --- | --- |
| React | 19.2 | Zustand | React Three Fiber + drei | React Compiler activé (`babel-plugin-react-compiler`) |
| Vue | 3.5 stable | Pinia | TresJS + Cientos | Pas de Vapor Mode ni de version 3.6 en RC |
| Svelte | 5 | Runes dans des fichiers `.svelte.ts` | Threlte 8 | Runes uniquement : pas de `export let`, pas de `$:`, pas de `svelte/store` pour l'état applicatif |

## Flux de travail du spike

1. Constitution, puis spécification, puis clarification, puis gel (tag `spec-gelee`).
2. Outillage commun (`shared/`), puis tag `base-commune`.
3. Pour chaque framework, dans l'ordre React, Vue, Svelte, et dans une session neuve :
   création de la branche, copie de la spec, puis plan, tâches, analyse et implémentation,
   jusqu'à ce que les tests E2E partagés soient au vert.
4. Fusion des trois branches sur `main`, mesures, puis synthèse.

Une implémentation n'est considérée comme terminée que si tous les tests E2E partagés passent
sur le build de production. Sinon, l'échec est noté dans le journal et le barème s'applique.

## Governance

- Cette constitution prime sur les plans, les tâches et les choix d'implémentation.
- Tout amendement exige l'accord de Lilian. Il s'applique aux trois implémentations et
  il est noté dans les trois journaux.
- Versionnage sémantique :
  - MAJEUR : retrait ou redéfinition d'un principe ;
  - MINEUR : ajout d'un principe ou d'une règle ;
  - CORRECTIF : reformulation.
- Chaque `/speckit-plan` DOIT vérifier sa conformité à cette constitution dans sa section
  « Constitution Check ». Chaque `/speckit-analyze` DOIT signaler tout écart.

**Version**: 1.0.0 | **Ratified**: 2026-10-27 | **Last Amended**: 2026-10-27

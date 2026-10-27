# Journal — implémentation Vue (004-spike-vue)

Branche `004-spike-vue` créée depuis `base-commune`, spec copiée depuis `specs/001-spec-spike/spec.md`. Port 4174.

## Étapes

| Étape | Début | Fin | Remarques |
| --- | --- | --- | --- |
| Préparation (branche, spec, journal) | 2026-10-27 22:23 | 2026-10-27 22:24 | |
| `/speckit-plan` | 2026-10-27 22:24 | 2026-10-27 22:29 | plan, research, data-model, contracts/pages-vue.md, quickstart |
| `/speckit-tasks` | 2026-10-27 22:32 | 2026-10-27 22:34 | 27 tâches (Setup 4, Fondation 4, US1 5, US2 4, US3 6, Finition 4) |
| `/speckit-analyze` | 2026-10-27 22:39 | 2026-10-27 22:41 | 0 critique, 3 moyens (F1, U1, U2), 4 faibles ; couverture 100 % |
| `/speckit-implement` : Setup, Fondation, US1, US2, US3 (code) | 2026-10-27 22:48 | 2026-10-27 22:55 | build (vue-tsc + vite) vert au premier essai |
| Points de contrôle US1, US2, US3 (scripts jetables hors dépôt) | 2026-10-27 22:55 | 2026-10-27 22:58 | US1 22/22, US2 18/18 + reconnexion 4/4, US3 20/20 ; captures vérifiées |
| T024 conformité + T025 campagne E2E | 2026-10-27 22:58 | 2026-10-27 22:59 | 34/34 au premier passage |
| **Total** (préparation → vert) | 2026-10-27 22:23 | 2026-10-27 22:59 | **36 min** |

## Corrections manuelles

| # | Étape | Catégorie | Auteur | Description |
| --- | --- | --- | --- | --- |

Aucune correction manuelle : le code généré a passé le build, les trois points de contrôle et la suite complète sans retouche humaine. (Les seules retouches ont porté sur les scripts de contrôle jetables, hors dépôt, et pas sur l'app.)

## Campagnes E2E (`FRAMEWORK=vue`)

| # | Horodatage | Réussis | Échoués | Remarques |
| --- | --- | --- | --- | --- |
| 1 | 2026-10-27T21:59:13Z (22:59 heure locale) | 34 | 0 | suite entière, OBS fermé, build de production sur 4174 ; id `2026-10-27T21:59:13.254Z-e2e-vue` |

**Passages avant le vert : 1.**

## Écarts et amendements

Aucun amendement de la spec. Trois précisions issues de `/speckit-analyze` ont été appliquées directement en écrivant le code (décisions de conception, pas des corrections) :
- **F1** : l'alerte est déclenchée par un compteur local (`alertes`) et non par le `seq` du service, qui repart à 0 quand le service redémarre (data-model mis à jour).
- **U1** : le bandeau est centré avec la propriété `translate`, pour que l'animation (qui agit sur `transform`) ne le décale pas. Vérifié au point de contrôle US2 (centre identique à 0,0001 px près).
- **U2** : chaque champ du dashboard garde une valeur affichée locale, non réécrite tant qu'il a le focus, et resynchronisée à la sortie du champ.

Vérification prévue en R5 : Cientos (`useGLTF`, via `useAsyncState`) ne lève pas d'exception quand le modèle ne se charge pas. `isLoading` repasse à `false` et `state` reste nul : c'est ce signal qui déclenche le repli.

## Points de friction

- **TypeScript 6 au lieu de 7** (plan, 2026-10-27) : `vue-tsc` 3.3.13 plante avec TypeScript 7.0.2 (`ERR_PACKAGE_PATH_NOT_EXPORTED : ./lib/tsc`), car le portage natif n'expose plus l'API JS utilisée par Volar. L'app Vue utilise donc TypeScript 6.0.3 pour vérifier les `.vue` en mode strict. Le témoin et `shared/` restent en TS 7. Ce n'est pas une correction manuelle : c'est une décision de plan, vérifiée dans un dossier jetable.
- **Import des options du compilateur TresJS** : `@tresjs/core` exporte `templateCompilerOptions` depuis un sous-chemin dédié (`@tresjs/core/template-compiler-options`). Il est utilisé dans `vite.config.ts` pour ne pas charger tout le runtime 3D dans Node. C'est un choix fait en écrivant la config, pas une correction.
- **Avertissement de taille du chunk 3D** (948 Ko, 255 Ko gzip) : il est signalé par Vite et laissé tel quel, car la constitution VI exclut toute optimisation au-delà des réglages par défaut.

## Ressenti (/5)

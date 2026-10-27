# Data model : implémentation Vue (004-spike-vue)

Les entités métier (Variable, État courant, Alerte, Overlay) sont définies par la spec gelée et par `specs/002-infra-commune/data-model.md`. Leurs types TypeScript viennent de `@shared/protocol.ts` (`VariableDef`, `VarValue`, `Values`) et ne sont pas redéfinis ici. Ce document décrit seulement l'état côté client, propre à l'implémentation Vue.

## Store Pinia `useLiveStore` (setup store, une instance par page)

| Champ | Type | Initial | Mis à jour par |
| --- | --- | --- | --- |
| `vars` | `Ref<VariableDef[]>` | `[]` | `onWelcome` : remplacé en entier à chaque (re)connexion |
| `values` | `Values` (objet `reactive`) | `{}` | `onWelcome` : valeurs remplacées ; `onUpdate(id, value)` : `values[id] = value` |
| `connected` | `Ref<boolean>` | `false` | `onStatus(connected)` |
| `alertes` | `Ref<number>` | `0` | `onAlert` : `alertes++` (compteur local : le `seq` du service repart à 0 quand le service redémarre, analyse F1) |

Actions :

| Action | Effet |
| --- | --- |
| `set(id, value)` | Envoie `set` au service via la connexion. Ne modifie pas `values` localement : la valeur affichée vient toujours de l'écho `update` (la dernière modification diffusée l'emporte). |
| `alerte()` | Envoie `alert` au service. |

Règles :
- Une page n'ouvre qu'**une** connexion (`src/live/connexion.ts`), branchée sur ce store au montage de l'app.
- `values` n'est jamais validé côté client au-delà des contrôles du dashboard. Le service valide et rejette.
- Après une reconnexion, `onWelcome` rétablit l'état complet (FR-024). Le service ayant pu redémarrer, ses valeurs par défaut s'affichent alors.

## État local des composants

| Composant | État | Transitions |
| --- | --- | --- |
| `useAlerte` (overlays 2D et 3D) | `actif: boolean`, minuteur, horodatage de début | `alertes` change → `actif = true`, animation relancée depuis 0, minuteur réarmé (2000 ms) ; minuteur écoulé → `actif = false`. La racine affiche `data-alert = actif ? "on" : "off"`. |
| Overlay 3D | `mode: "scene" \| "repli"` | Au démarrage : WebGL absent → `repli`, sinon `scene` (la scène reste montée pendant le chargement du modèle). Échec du chargement (`isLoading` repasse à `false` avec `state` nul) ou erreur de `TresCanvas` → `repli`. On ne revient jamais au mode `scene` depuis `repli`. |
| Modèle 3D | angle de rotation, début d'alerte | à chaque image : angle += vitesse × 2π × delta ; position et rotation supplémentaire d'alerte calculées depuis le début (FR-032) |
| `Champ.vue` (dashboard) | `affichee` (valeur affichée) | suit `values[def.id]`, sauf si le champ a le focus (l'écho est ignoré) ; resynchronisée à la sortie du champ (analyse U2) |

## Sérialisation (`data-value`)

On utilise toujours `serialize(def.type, value)` de `@shared/protocol.ts`. Elle n'est jamais réécrite dans l'app (FR-041).

# Data model — implémentation Svelte

Les types de base (`VariableDef`, `VarType`, `VarValue`, `Values`) et leurs règles de validation viennent de `@shared/protocol.ts` et du data-model de `specs/002-infra-commune/`. Ils ne sont pas redéfinis ici. Ce document décrit l'état **côté app** et ses transitions.

## `Live` (classe, `src/lib/live.svelte.ts`)

Une instance par page, créée par le composant racine.

| Champ | Rune | Type | Rôle |
| --- | --- | --- | --- |
| `vars` | `$state.raw` | `VariableDef[]` | Définitions reçues dans le dernier `welcome`. Remplacées en bloc. |
| `values` | `$state` | `Values` | Valeurs courantes, mutées clé par clé. |
| `connected` | `$state` | `boolean` | Suit `onStatus`. `false` au départ. |
| `alerte.actif` | `$state` | `boolean` | `true` pendant `ALERT_DURATION_MS` après la dernière alerte. |
| `alerte.numero` | `$state` | `number` | Incrémenté à chaque alerte (0 = aucune). Déclenche la relance de l'animation 2D. |
| `debut` | non réactif (champ simple de la classe) | `number` | `performance.now()` de la dernière alerte, lu par la boucle 3D. Hors de l'objet `alerte`, qui est un `$state`. |

Méthodes : `set(id, value)` (met à jour `values[id]` puis envoie), `alert()`, `def(id)` (définition par id).

Options du constructeur : `role` (`"dashboard"` ou `"overlay"`), `name` (overlay), `ignorer?(id)` (dashboard : vrai si l'update visant `id` doit être ignorée, cf. research R6).

### Transitions

| Événement (`connect`) | Effet |
| --- | --- |
| `onStatus(true/false)` | `connected` ← valeur |
| `onWelcome(vars, values)` | `vars` ← `vars` ; `values` ← copie de `values` (à chaque reconnexion, FR-024) |
| `onUpdate(id, value)` | si `ignorer?.(id)` : rien ; sinon `values[id]` ← `value` |
| `onAlert()` | `alerte.numero` + 1 ; `debut` ← maintenant ; `actif` ← `true` ; minuteur réarmé : `actif` ← `false` après 2000 ms |

Il n'y a pas de persistance : au redémarrage du service, le `welcome` suivant remet les valeurs du service.

## Dérivés par page

| Page | Dérivé | Valeur |
| --- | --- | --- |
| Toutes (overlays) | `data-alert` racine | `live.alerte.actif ? "on" : "off"` |
| Dashboard | `data-connection` racine | `live.connected ? "on" : "off"` |
| Overlay A | `data-value` titre / score | `serialize(def.type, values[id])` |
| Overlay B | visibilité du bandeau | `values.bandeau === true` |
| Overlay 3D | `repli` | `$state` : `true` si WebGL absent au démarrage, ou si le chargement du modèle échoue |
| Overlay 3D | angle de base, saut, tours | variables locales de la boucle `useTask` (non réactives) |

## Validation côté dashboard

| Type | Contrôle | Envoyé quand |
| --- | --- | --- |
| `text` | `maxlength = maxLength` | à chaque `input` |
| `number` | `min`, `max`, `step=1` | à chaque `input` si `valueAsNumber` est un entier dans les bornes |
| `boolean` | case à cocher | à chaque `change` |
| `color` | sélecteur natif | à chaque `input` (valeur en `#rrggbb` minuscules) |
| `speed` | curseur `min`, `max`, `step` | à chaque `input` (`Number(value)`) |
